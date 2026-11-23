import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Check, Heart, Link2, MessageCircle, UserPlus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useFrame } from '../context/FrameContext';
import { cx } from '../lib/utils';

const ICONS = { check: Check, bell: Bell, chat: MessageCircle, alert: AlertTriangle, heart: Heart, link: Link2, user: UserPlus };

/** iOS-style dynamic island that morphs into notifications. */
export default function DynamicIsland() {
  const { current, dismiss } = useToast();
  const { framed } = useFrame();
  const navigate = useNavigate();
  const [vw, setVw] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!current) return undefined;
    const t = setTimeout(() => dismiss(current.id), current.duration || 3600);
    return () => clearTimeout(t);
  }, [current, dismiss]);

  const open = Boolean(current);
  const openWidth = framed ? 369 : Math.min(vw - 20, 400);
  const Icon = current ? ICONS[current.icon] || Check : Check;

  const target = open
    ? { width: openWidth, height: 72, borderRadius: 30, opacity: 1, y: 0 }
    : framed
      ? { width: 124, height: 36, borderRadius: 20, opacity: 1, y: 0 }
      : { width: 124, height: 36, borderRadius: 20, opacity: 0, y: -60 };

  return (
    <div className="island-layer">
      <motion.div
        className={cx('island', open && 'is-open')}
        initial={false}
        animate={target}
        transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.9 }}
        drag={open ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={(_, info) => {
          if (current && info.offset.y < -16) dismiss(current.id);
        }}
        role="status"
        aria-live="polite"
      >
        {!open && framed && <span className="island-cam" />}
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.button
              key={current.id}
              type="button"
              className="island-content"
              initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.96 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, transition: { delay: 0.12, duration: 0.3 } }}
              exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.96, transition: { duration: 0.14 } }}
              onClick={() => {
                if (current.to) navigate(current.to);
                dismiss(current.id);
              }}
            >
              {current.avatar ? (
                <span className="avatar" style={{ width: 42, height: 42 }}>
                  <img src={current.avatar} alt="" />
                </span>
              ) : (
                <span className={cx('island-icon', current.tone === 'danger' && 'danger')}>
                  <Icon size={20} strokeWidth={2.6} />
                </span>
              )}
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="island-title ellipsis" style={{ display: 'block' }}>
                  {current.title}
                </span>
                {current.body && (
                  <span className="island-body ellipsis" style={{ display: 'block' }}>
                    {current.body}
                  </span>
                )}
              </span>
              {current.avatar && (
                <span className="island-icon" style={{ width: 26, height: 26 }}>
                  <Icon size={14} strokeWidth={3} />
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
