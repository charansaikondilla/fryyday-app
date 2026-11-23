import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';

const FrameContext = createContext({ framed: false, tone: 'auto', register: () => () => {} });

/**
 * Tracks whether the app is drawn inside the desktop phone frame, and which
 * status-bar tone the top-most screen wants (light text over photos, etc.).
 * Tones are kept in a stack so overlapping page transitions resolve correctly.
 */
export function FrameProvider({ framed, children }) {
  const [stack, setStack] = useState([]);

  const register = useCallback((id, tone) => {
    setStack((s) => [...s.filter((x) => x.id !== id), { id, tone }]);
    return () => setStack((s) => s.filter((x) => x.id !== id));
  }, []);

  const tone = stack.length ? stack[stack.length - 1].tone : 'auto';
  const value = useMemo(() => ({ framed, tone, register }), [framed, tone, register]);
  return <FrameContext.Provider value={value}>{children}</FrameContext.Provider>;
}

export function useFrame() {
  return useContext(FrameContext);
}

/** Screens with a dark photo behind the status bar call useStatusTone('light'). */
export function useStatusTone(tone) {
  const { register } = useContext(FrameContext);
  const id = useId();
  useEffect(() => register(id, tone), [id, tone, register]);
}
