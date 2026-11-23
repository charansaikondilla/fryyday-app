import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { cx } from '../lib/utils';

/**
 * Fryyday wordmark: "Fr" + two celebrating "y" figures (a high-five under a burst of rays) + "day".
 * variant: 'auto' (black badge in light mode), 'plain', 'badge'.
 */
export default function Logo({ size = 26, variant = 'auto', animate = false, className, color }) {
  const { theme } = useTheme();
  const badge = variant === 'badge' || (variant === 'auto' && theme === 'light');
  const fill = color || 'var(--accent)';

  return (
    <span className={cx('logo', badge && 'logo-badge', className)} style={{ fontSize: size, color: fill }} aria-label="Fryyday">
      <span className="logo-txt" aria-hidden="true">
        Fr
      </span>
      <YYMark animate={animate} />
      <span className="logo-txt" aria-hidden="true">
        day
      </span>
    </span>
  );
}

export function YYMark({ animate = false, className }) {
  const armL = { hidden: { rotate: -28, opacity: 0 }, show: { rotate: 0, opacity: 1 } };
  const armR = { hidden: { rotate: 28, opacity: 0 }, show: { rotate: 0, opacity: 1 } };
  const ray = (i) => ({
    hidden: { scale: 0, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { delay: 0.45 + i * 0.07, type: 'spring', stiffness: 500, damping: 16 } },
  });
  const anim = animate ? { initial: 'hidden', animate: 'show' } : {};
  const springT = { type: 'spring', stiffness: 260, damping: 14, delay: 0.15 };

  return (
    <svg className={cx('logo-mark', className)} viewBox="-6 -6 130 138" aria-hidden="true">
      <motion.g {...anim}>
        <g className="logo-rays" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
          <motion.path d="M59 -3 L59 8" variants={ray(1)} style={{ originX: 0.5, originY: 1 }} />
          <motion.path d="M42.5 2.5 L47.5 10.5" variants={ray(0)} style={{ originX: 1, originY: 1 }} />
          <motion.path d="M75.5 2.5 L70.5 10.5" variants={ray(2)} style={{ originX: 0, originY: 1 }} />
        </g>
        {/* figure one */}
        <g fill="none" stroke="currentColor" strokeWidth="13.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 48 L28 88" />
          <path d="M28 88 C 25 104, 19 116, 7 124" />
          <motion.path d="M28 88 L56 25" variants={armL} transition={springT} style={{ originX: 0, originY: 1 }} />
        </g>
        <circle cx="23.5" cy="50" r="9" fill="currentColor" />
        {/* figure two */}
        <g fill="none" stroke="currentColor" strokeWidth="13.5" strokeLinecap="round" strokeLinejoin="round" className="logo-fig2">
          <path d="M116 48 L90 88" />
          <path d="M90 88 C 87 104, 81 116, 69 124" />
          <motion.path d="M90 88 L62 25" variants={armR} transition={springT} style={{ originX: 1, originY: 1 }} />
        </g>
        <circle cx="94.5" cy="50" r="9" fill="currentColor" className="logo-fig2" />
      </motion.g>
    </svg>
  );
}
