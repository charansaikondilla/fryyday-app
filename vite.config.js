import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Lists every file in public/ as a site-relative path (e.g. "icons/icon-192.png"). */
function publicFiles(dir, root = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? publicFiles(full, root) : [relative(root, full).replace(/\\/g, '/')];
  });
}

/**
 * Emits dist/sw.js: a service worker that pre-caches every file of this build so the
 * installed app (Android / iPhone home screen) opens instantly and works offline.
 * Its version is a hash of the build, so each deploy replaces the old cache.
 */
function serviceWorker() {
  return {
    name: 'fryyday-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const pub = publicFiles('public');
      const files = [...new Set(['./', 'index.html', ...Object.keys(bundle), ...pub])]
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map'))
        .sort();
      const hash = createHash('sha256');
      files.forEach((f) => hash.update(f));
      if (bundle['index.html']) hash.update(String(bundle['index.html'].source));
      pub.forEach((f) => hash.update(readFileSync(join('public', f))));
      const version = hash.digest('hex').slice(0, 12);

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `/* Fryyday service worker — generated at build time. */
const CACHE = 'fryyday-${version}';
const PRECACHE = ${JSON.stringify(files)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('fryyday-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Pages: try the network first so a new deploy shows up, fall back to the cached app offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('index.html', copy));
          return res;
        })
        .catch(() => caches.match('index.html')),
    );
    return;
  }

  // Scripts, styles, images, fonts: file names are content-hashed, so the cache is always right.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
`,
      });
    },
  };
}

// `base: './'` keeps every asset path relative, so the production build
// works from any folder or sub-path (Netlify, Vercel, GitHub Pages, S3...).
export default defineConfig({
  plugins: [react(), serviceWorker()],
  base: './',
  server: { port: 5173, open: true },
  preview: { port: 4173 },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
  },
});
