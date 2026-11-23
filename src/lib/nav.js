import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const TAB_PATHS = ['/home', '/discover', '/inbox', '/profile'];

/** Which transition a route uses when it is opened. */
export function routeKind(pathname) {
  if (pathname === '/' || pathname === '/welcome') return 'fade';
  if (TAB_PATHS.includes(pathname)) return 'tab';
  if (pathname === '/create') return 'modal';
  if (/^\/plan\/[^/]+\/published$/.test(pathname)) return 'zoom';
  return 'push';
}

/** Navigation helpers with a safe "back" that never leaves the app. */
export function useNav() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      go: (to, opts) => navigate(to, opts),
      replace: (to, opts) => navigate(to, { ...opts, replace: true }),
      tab: (to) => navigate(to, { replace: true }),
      back: (fallback = '/home') => {
        const idx = window.history.state?.idx;
        if (typeof idx === 'number' && idx > 0) navigate(-1);
        else navigate(fallback, { replace: true });
      },
    }),
    [navigate],
  );
}
