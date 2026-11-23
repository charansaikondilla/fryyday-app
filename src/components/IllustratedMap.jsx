import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ActivityIcon } from './ui';
import { cx } from '../lib/utils';

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** City blocks generated once (deterministic) so the map looks hand-drawn but stays stable. */
function useBlocks() {
  return useMemo(() => {
    const rnd = seeded(7);
    const blocks = [];
    for (let gx = 0; gx < 14; gx++) {
      for (let gy = 0; gy < 11; gy++) {
        if (rnd() < 0.18) continue;
        const x = gx * 30 + rnd() * 6 - 4;
        const y = gy * 30 + rnd() * 6 - 4;
        blocks.push({ x, y, w: 18 + rnd() * 8, h: 16 + rnd() * 9, r: rnd() * 10 - 5 });
      }
    }
    return blocks;
  }, []);
}

/**
 * Illustrative map with public venue pins. Precise member locations are never shown —
 * only the area circle and public places.
 */
export default function IllustratedMap({ pins = [], selectedId, onSelect, radiusKm = 5, areaLabel = 'Jubilee Hills', height = 360 }) {
  const blocks = useBlocks();
  const radius = 48 + Math.min(radiusKm, 25) * 4.2;
  return (
    <div className="map" style={{ height }}>
      <motion.svg
        viewBox="0 0 400 320"
        preserveAspectRatio="xMidYMid slice"
        className="map-svg"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect width="400" height="320" fill="var(--map-land)" />
        <g fill="var(--map-block)">
          {blocks.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" transform={`rotate(${b.r} ${b.x + b.w / 2} ${b.y + b.h / 2})`} />
          ))}
        </g>
        <g fill="var(--map-park)">
          <path d="M40 40 C 70 20, 120 30, 118 62 C 116 92, 70 96, 50 84 C 30 72, 18 56, 40 40 Z" />
          <path d="M150 210 C 190 190, 250 200, 262 232 C 274 262, 230 290, 190 284 C 150 278, 120 236, 150 210 Z" />
          <path d="M300 60 C 330 50, 360 70, 352 96 C 344 120, 310 118, 298 104 C 286 90, 284 66, 300 60 Z" />
          <path d="M20 230 C 40 214, 76 222, 74 246 C 72 268, 40 274, 26 262 C 12 250, 8 240, 20 230 Z" />
        </g>
        <path d="M330 250 C 360 236, 410 240, 410 270 L 410 330 L 300 330 C 296 300, 304 262, 330 250 Z" fill="var(--map-water)" />
        <g fill="none" stroke="var(--map-road)" strokeLinecap="round">
          <path d="M-10 120 C 60 110, 120 140, 200 128 S 340 100, 410 118" strokeWidth="5" />
          <path d="M-10 270 C 80 250, 160 280, 240 262 S 360 230, 410 236" strokeWidth="4" />
          <path d="M120 -10 C 112 60, 140 120, 128 200 S 110 290, 124 330" strokeWidth="4" />
          <path d="M290 -10 C 300 70, 272 140, 286 210 S 316 290, 300 330" strokeWidth="4" />
          <path d="M-10 190 C 70 196, 140 176, 220 190 S 360 210, 410 196" strokeWidth="3" />
          <path d="M210 -10 C 214 60, 196 120, 214 180 S 200 280, 208 330" strokeWidth="3" />
        </g>
        <g fill="none" stroke="var(--map-road-major)" strokeLinecap="round">
          <path d="M-10 60 C 100 90, 180 50, 260 80 S 380 160, 410 150" strokeWidth="9" />
          <path d="M60 330 C 90 250, 170 230, 230 160 S 300 40, 340 -10" strokeWidth="9" />
        </g>
        <circle cx="200" cy="160" r={radius} fill="var(--accent-soft)" stroke="var(--accent-line)" strokeWidth="1.5" strokeDasharray="5 6" />
        <text x="200" y="164" textAnchor="middle" className="map-label">
          {areaLabel}
        </text>
      </motion.svg>

      <div className="map-pins">
        <AnimatePresence>
          {pins.map((p, i) => {
            const active = p.id === selectedId;
            return (
              <motion.button
                key={p.id}
                type="button"
                className={cx('map-pin', active && 'is-active', p.x > 60 && 'flip')}
                style={{ left: `${p.x}%`, top: `${20 + p.y * 0.72}%`, zIndex: active ? 5 : 2 }}
                initial={{ y: -40, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: active ? 1.08 : 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 380, damping: 16, delay: 0.25 + i * 0.07 }}
                onClick={() => onSelect?.(p.id)}
                aria-label={p.label}
              >
                <span className="map-pin-dot">
                  {active && <span className="map-pin-pulse" />}
                  <ActivityIcon activity={p.activity} size={19} strokeWidth={2.4} />
                  {p.count > 1 && <span className="map-pin-count">{p.count}</span>}
                </span>
                <span className="map-pin-label">{p.label}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <span className="map-note">Illustrative map · public places only</span>
    </div>
  );
}
