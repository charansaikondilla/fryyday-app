import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';

const ThemeContext = createContext(null);
const KEY = 'fryyday:theme';

function readPref() {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

function systemPrefersLight() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false;
}

function applyToDocument(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#F7F4EE' : '#0B0B0C');
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(readPref);
  const [sysLight, setSysLight] = useState(systemPrefersLight);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e) => setSysLight(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const theme = pref === 'system' ? (sysLight ? 'light' : 'dark') : pref;

  useLayoutEffect(() => {
    applyToDocument(theme);
  }, [theme]);

  /** Change the theme. `origin` = {x, y} in viewport px for the circular reveal. */
  const setTheme = useCallback(
    (next, origin) => {
      const resolved = next === 'system' ? (sysLight ? 'light' : 'dark') : next;
      const commit = () => {
        flushSync(() => setPref(next));
        applyToDocument(resolved);
        try {
          localStorage.setItem(KEY, next);
        } catch {
          /* storage unavailable */
        }
      };

      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (resolved === theme || reduce || typeof document.startViewTransition !== 'function') {
        commit();
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      try {
        const vt = document.startViewTransition(commit);
        vt.ready
          .then(() => {
            document.documentElement.animate(
              { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
              { duration: 680, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
            );
          })
          .catch(() => {});
      } catch {
        commit();
      }
    },
    [theme, sysLight],
  );

  const toggleTheme = useCallback(
    (origin) => setTheme(theme === 'dark' ? 'light' : 'dark', origin),
    [theme, setTheme],
  );

  const value = useMemo(() => ({ theme, pref, setTheme, toggleTheme }), [theme, pref, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Helper: get the centre of the clicked element for the reveal origin. */
export function originFromEvent(e) {
  if (!e) return undefined;
  const el = e.currentTarget;
  if (el && el.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: e.clientX, y: e.clientY };
}
