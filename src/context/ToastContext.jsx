import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { uid } from '../lib/utils';

const ToastContext = createContext(null);

/**
 * Toasts are shown one at a time inside the "dynamic island".
 * toast.show({ title, body, avatar, icon: 'check' | 'bell' | 'chat' | 'alert' | 'heart' | 'link' | 'user',
 *              tone: 'accent' | 'danger', to: '/route', duration })
 */
export function ToastProvider({ children }) {
  const [queue, setQueue] = useState([]);

  const show = useCallback((toast) => {
    const id = uid('t');
    setQueue((q) => {
      // Avoid stacking identical messages.
      if (q.some((t) => t.title === toast.title && t.body === toast.body)) return q;
      return [...q.slice(-3), { id, duration: 3600, icon: 'check', ...toast }];
    });
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setQueue((q) => q.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ show, dismiss, current: queue[0] || null }), [show, dismiss, queue]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
