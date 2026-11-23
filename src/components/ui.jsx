import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Check, ChevronDown, MapPin, Minus, Plus, X } from 'lucide-react';
import { ACTIVITY_ICONS } from './icons';
import { cx, initials } from '../lib/utils';

/* --------------------------------------------------------------------------
   Image with shimmer placeholder, fade-in and graceful fallback
   -------------------------------------------------------------------------- */
export function Img({ src, alt = '', className, style, scrim = false, activity, children, eager = false }) {
  const [state, setState] = useState(src ? 'loading' : 'error');
  const ref = useRef(null);

  useEffect(() => {
    setState(src ? 'loading' : 'error');
  }, [src]);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setState('loaded');
  }, [src]);

  const Icon = ACTIVITY_ICONS[activity] || ACTIVITY_ICONS.coffee;
  return (
    <div className={cx('img', state === 'loaded' && 'is-loaded', scrim && 'img-scrim', className)} style={style}>
      {src && state !== 'error' && (
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
        />
      )}
      {state === 'error' && (
        <div className="img-fallback">
          <Icon size={34} strokeWidth={2} />
        </div>
      )}
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Avatars
   -------------------------------------------------------------------------- */
export function Avatar({ person, size = 44, ring = false, square = false, className, online = false }) {
  const src = person?.avatar;
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  if (!src || broken) {
    return (
      <span className={cx('avatar avatar-mono', ring && 'avatar-ring', square && 'square', className)} style={style} aria-label={person?.name}>
        {initials(person?.name || '?')}
        {online && <span className="online-dot" />}
      </span>
    );
  }
  return (
    <span className={cx('avatar', ring && 'avatar-ring', square && 'square', className)} style={style}>
      <img src={src} alt={person?.name || ''} draggable={false} onError={() => setBroken(true)} />
      {online && <span className="online-dot" />}
    </span>
  );
}

export function AvatarStack({ people, size = 34, max = 4, extra = 0, ring = 'var(--surface)' }) {
  const shown = people.slice(0, max);
  const more = Math.max(0, people.length - max) + extra;
  return (
    <span className="avatar-stack" style={{ '--stack-ring': ring }}>
      {shown.map((p, i) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: -8, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 420, damping: 24 }}
          style={{ display: 'inline-flex', borderRadius: '50%', zIndex: 10 - i }}
        >
          <Avatar person={p} size={size} />
        </motion.span>
      ))}
      {more > 0 && (
        <span className="avatar-more" style={{ width: size, height: size }}>
          +{more}
        </span>
      )}
    </span>
  );
}

/* --------------------------------------------------------------------------
   Chips (single or multi select) with a sliding lime fill
   -------------------------------------------------------------------------- */
export function Chip({ active, onClick, icon: Icon, children, size, layoutId, className, multi = false }) {
  return (
    <motion.button
      type="button"
      className={cx('chip', active && 'is-active', size === 'sm' && 'sm', className)}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-pressed={active}
    >
      <AnimatePresence initial={false}>
        {active &&
          (multi || !layoutId ? (
            <motion.span
              key="fill"
              className="chip-fill"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 520, damping: 30 }}
            />
          ) : (
            <motion.span key="fill" className="chip-fill" layoutId={layoutId} transition={{ type: 'spring', stiffness: 480, damping: 36 }} />
          ))}
      </AnimatePresence>
      {multi && active ? <Check size={15} strokeWidth={3} /> : Icon ? <Icon size={17} strokeWidth={2.1} /> : null}
      {children}
    </motion.button>
  );
}

/* --------------------------------------------------------------------------
   Segmented control
   -------------------------------------------------------------------------- */
export function Segmented({ options, value, onChange, size, className }) {
  const id = useId();
  return (
    <div className={cx('seg', size === 'sm' && 'sm', className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active} className={cx('seg-btn', active && 'is-active')} onClick={() => onChange(o.value)}>
            {active && <motion.span className="seg-pill" layoutId={`seg-${id}`} transition={{ type: 'spring', stiffness: 480, damping: 38 }} />}
            {o.label}
            {o.count != null && o.count > 0 && <span className="count-badge">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Toggle switch
   -------------------------------------------------------------------------- */
export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={cx('toggle', on && 'on')} onClick={() => onChange(!on)}>
      <motion.span className="toggle-knob" animate={{ x: on ? 22 : 0 }} transition={{ type: 'spring', stiffness: 600, damping: 32 }} />
    </button>
  );
}

/* --------------------------------------------------------------------------
   Radio / checkbox visuals
   -------------------------------------------------------------------------- */
export function Radio({ on }) {
  return (
    <span className={cx('radio', on && 'on')} aria-hidden="true">
      <AnimatePresence>
        {on && (
          <motion.span
            className="radio-dot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 26 }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}

export function Checkbox({ on }) {
  return (
    <span className={cx('checkbox', on && 'on')} aria-hidden="true">
      <AnimatePresence>
        {on && (
          <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} style={{ display: 'grid' }}>
            <Check size={16} strokeWidth={3.2} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* --------------------------------------------------------------------------
   Number stepper with rolling digits
   -------------------------------------------------------------------------- */
export function Stepper({ value, onChange, min = 1, max = 20 }) {
  const dir = useRef(1);
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => {
          dir.current = -1;
          onChange(Math.max(min, value - 1));
        }}
      >
        <Minus size={18} strokeWidth={2.6} />
      </button>
      <output aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            style={{ display: 'block' }}
            initial={{ y: dir.current * 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: dir.current * -22, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </output>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => {
          dir.current = 1;
          onChange(Math.min(max, value + 1));
        }}
      >
        <Plus size={18} strokeWidth={2.6} />
      </button>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Progress steps (segmented bar)
   -------------------------------------------------------------------------- */
export function Steps({ total = 3, current = 1 }) {
  return (
    <div className="steps" aria-label={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i}>
          <motion.i
            initial={{ scaleX: i < current - 1 ? 1 : 0 }}
            animate={{ scaleX: i < current ? 1 : 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      ))}
    </div>
  );
}

export function ProgressBar({ value = 0.5, from = 0 }) {
  return (
    <div className="progress">
      <motion.i initial={{ scaleX: from }} animate={{ scaleX: value }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  );
}

/* --------------------------------------------------------------------------
   Bottom sheet (drag down to dismiss)
   -------------------------------------------------------------------------- */
export function Sheet({ open, onClose, title, subtitle, children, footer, className, maxHeight }) {
  const controls = useDragControls();
  const [host, setHost] = useState(null);

  useEffect(() => {
    setHost(document.getElementById('app'));
  }, []);

  const onKey = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onKey]);

  if (!host) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            className={cx('sheet', className)}
            style={maxHeight ? { maxHeight } : undefined}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose?.();
            }}
          >
            <div className="sheet-handle" onPointerDown={(e) => controls.start(e)} style={{ touchAction: 'none' }} />
            {(title || subtitle) && (
              <div className="sheet-head" onPointerDown={(e) => controls.start(e)} style={{ touchAction: 'none' }}>
                <div>
                  {title && <h3 className="sheet-title">{title}</h3>}
                  {subtitle && <p className="t-sub mt-4">{subtitle}</p>}
                </div>
                <button type="button" className="icon-btn soft" aria-label="Close" onClick={onClose} style={{ width: 36, height: 36 }}>
                  <X size={18} strokeWidth={2.4} />
                </button>
              </div>
            )}
            <div className="sheet-body">{children}</div>
            {footer && <div style={{ paddingTop: 14 }}>{footer}</div>}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    host,
  );
}

/* --------------------------------------------------------------------------
   Location selector button ("Hyderabad ⌄")
   -------------------------------------------------------------------------- */
export function LocationButton({ city, onClick, boxed = false }) {
  return (
    <motion.button type="button" className={cx('loc-btn', boxed && 'boxed')} onClick={onClick} whileTap={{ scale: 0.95 }}>
      <MapPin className="pin" size={17} strokeWidth={2.4} />
      <span>{city}</span>
      <ChevronDown size={16} strokeWidth={2.4} />
    </motion.button>
  );
}

/* --------------------------------------------------------------------------
   Activity icon helper
   -------------------------------------------------------------------------- */
export function ActivityIcon({ activity, size = 18, strokeWidth = 2.1, className }) {
  const Icon = ACTIVITY_ICONS[activity] || ACTIVITY_ICONS.coffee;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}
