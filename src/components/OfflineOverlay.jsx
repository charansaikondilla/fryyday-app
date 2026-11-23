import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import Logo from './Logo';
import { OfflineArt } from './Illustrations';

export const OFFLINE_PREVIEW_EVENT = 'fryyday:offline-preview';

/** Shown automatically when the device goes offline (25 / OFFLINE). */
export default function OfflineOverlay() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [preview, setPreview] = useState(false);
  const [checking, setChecking] = useState(false);
  const shake = useAnimationControls();

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    const prev = () => setPreview(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    window.addEventListener(OFFLINE_PREVIEW_EVENT, prev);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener(OFFLINE_PREVIEW_EVENT, prev);
    };
  }, []);

  const retry = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const stillOffline = navigator.onLine === false;
      setOffline(stillOffline);
      if (stillOffline) shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.45 } });
      else setPreview(false);
    }, 900);
  };

  const show = offline || preview;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="offline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="alertdialog"
          aria-label="You are offline"
        >
          <div className="screen-glow" aria-hidden="true" />
          <div className="offline-top">
            <Logo size={24} />
          </div>
          <motion.div className="offline-body" animate={shake}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
              <OfflineArt size={200} />
            </motion.div>
            <motion.h2 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="t-h1">
              You’re offline
            </motion.h2>
            <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.22 }} className="t-body t-center">
              Check your connection
              <br />
              and try again.
            </motion.p>
            <motion.button
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              type="button"
              className="btn btn-primary btn-block shine"
              onClick={retry}
              disabled={checking}
              style={{ marginTop: 28 }}
            >
              {checking ? <span className="spinner" /> : 'Retry'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
