// Every photo in src/assets/img is bundled and exposed by file name, e.g. IMG['coffee-crew'].
const files = import.meta.glob('../assets/img/*.webp', { eager: true, import: 'default' });

export const IMG = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.webp', ''), url]),
);
