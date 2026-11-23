import { motion } from 'framer-motion';

const LIME = '#EAFF00';
const LIME_2 = '#F3FF8C';

/* Rays that burst out in a fan above a point. */
function Rays({ cx, cy, r1 = 30, r2 = 44, angles = [-70, -40, -12, 16, 44, 72], width = 6, delay = 0.35, color = LIME }) {
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round">
      {angles.map((a, i) => {
        const rad = ((a - 90) * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * r1;
        const y1 = cy + Math.sin(rad) * r1;
        const x2 = cx + Math.cos(rad) * r2;
        const y2 = cy + Math.sin(rad) * r2;
        return (
          <motion.line
            key={a}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 1, 0.6, 1] }}
            transition={{
              pathLength: { delay: delay + i * 0.06, duration: 0.35, ease: 'easeOut' },
              opacity: { delay: delay + i * 0.06, duration: 2.4, repeat: Infinity, repeatType: 'mirror' },
            }}
          />
        );
      })}
    </g>
  );
}

function Sparkle({ x, y, s = 1, delay = 0 }) {
  return (
    <motion.path
      d={`M${x} ${y - 7 * s} L${x + 1.8 * s} ${y - 1.8 * s} L${x + 7 * s} ${y} L${x + 1.8 * s} ${y + 1.8 * s} L${x} ${y + 7 * s} L${x - 1.8 * s} ${y + 1.8 * s} L${x - 7 * s} ${y} L${x - 1.8 * s} ${y - 1.8 * s} Z`}
      fill={LIME}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.6, 1], opacity: [0, 1, 0.5, 1] }}
      transition={{ delay, duration: 2.2, repeat: Infinity, repeatType: 'mirror' }}
      style={{ originX: 0.5, originY: 0.5 }}
    />
  );
}

/* --------------------------------------------------------------------------
   Two friends high-fiving — "Your plan is live!"
   -------------------------------------------------------------------------- */
export function HighFive({ size = 260 }) {
  const spring = { type: 'spring', stiffness: 200, damping: 14 };
  return (
    <svg viewBox="0 0 300 226" width={size} height={(size * 226) / 300} className="illus" aria-hidden="true">
      <Rays cx={150} cy={74} r1={30} r2={50} angles={[-62, -32, 0, 32, 62]} width={6.5} delay={0.7} />
      <Sparkle x={42} y={64} delay={0.9} />
      <Sparkle x={262} y={58} s={0.8} delay={1.1} />
      <Sparkle x={30} y={150} s={0.7} delay={1.3} />
      <Sparkle x={272} y={146} s={0.9} delay={1.0} />

      {/* Left friend */}
      <motion.g initial={{ x: -46, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.05 }}>
        <motion.path
          d="M120 172 C 132 140, 141 110, 146 80"
          stroke="#E7B07F"
          strokeWidth="17"
          strokeLinecap="round"
          fill="none"
          initial={{ rotate: 42 }}
          animate={{ rotate: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          style={{ originX: 0, originY: 1 }}
        />
        <circle cx="147" cy="74" r="11" fill="#E7B07F" />
        <path d="M52 226 C 52 182, 72 160, 100 160 C 128 160, 148 182, 148 226 Z" fill={LIME} />
        <path d="M86 160 C 92 172, 108 172, 114 160" fill="#d4e600" />
        <circle cx="100" cy="122" r="27" fill="#E7B07F" />
        <path
          d="M72 122 C 66 96, 84 82, 102 86 C 116 82, 132 94, 128 116 C 122 106, 112 100, 100 102 C 88 104, 80 110, 72 122 Z"
          fill="#191919"
        />
        <circle cx="76" cy="104" r="7" fill="#191919" />
        <circle cx="84" cy="92" r="8" fill="#191919" />
        <circle cx="98" cy="86" r="8" fill="#191919" />
        <circle cx="113" cy="88" r="7" fill="#191919" />
        <path d="M89 122 q4 -5 8 0" stroke="#191919" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M106 122 q4 -5 8 0" stroke="#191919" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M92 132 q9 9 18 0 Z" fill="#191919" />
        <path d="M95 134 q6 4 12 0" fill="#fff" />
      </motion.g>

      {/* Right friend */}
      <motion.g initial={{ x: 46, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring, delay: 0.12 }}>
        <motion.path
          d="M180 172 C 168 140, 159 110, 154 80"
          stroke="#C98E64"
          strokeWidth="17"
          strokeLinecap="round"
          fill="none"
          initial={{ rotate: -42 }}
          animate={{ rotate: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          style={{ originX: 1, originY: 1 }}
        />
        <circle cx="153" cy="74" r="11" fill="#C98E64" />
        <path d="M152 226 C 152 182, 172 160, 200 160 C 228 160, 248 182, 248 226 Z" fill={LIME_2} />
        <path
          d="M172 128 C 166 94, 190 80, 208 86 C 230 92, 236 118, 232 150 C 236 166, 226 172, 218 164 C 222 150, 220 132, 214 118 C 204 110, 190 110, 180 120 Z"
          fill="#191919"
        />
        <circle cx="200" cy="124" r="26" fill="#C98E64" />
        <path d="M174 118 C 176 98, 196 90, 212 98 C 222 104, 226 114, 226 124 C 218 112, 204 106, 190 108 C 182 110, 178 114, 174 118 Z" fill="#191919" />
        <path d="M188 124 q4 -5 8 0" stroke="#191919" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M205 124 q4 -5 8 0" stroke="#191919" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M192 134 q8 8 16 0 Z" fill="#191919" />
        <circle cx="226" cy="134" r="3.6" fill="none" stroke={LIME} strokeWidth="2.2" />
      </motion.g>

      {/* clap flash */}
      <motion.circle
        cx="150"
        cy="72"
        r="20"
        fill={LIME}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.6, 0], opacity: [0, 0.55, 0] }}
        transition={{ delay: 0.55, duration: 0.6, ease: 'easeOut' }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Neighbourhood with a pin — "Find plans around you."
   -------------------------------------------------------------------------- */
export function CityPin({ size = 300 }) {
  return (
    <svg viewBox="0 0 320 210" width={size} height={(size * 210) / 320} className="illus city" aria-hidden="true">
      <ellipse cx="160" cy="196" rx="150" ry="12" className="c-shadow" />
      {/* road */}
      <path d="M190 210 C 196 186, 236 178, 250 160 C 262 146, 300 142, 320 140" className="c-road" strokeWidth="18" fill="none" strokeLinecap="round" />
      {/* back buildings */}
      <rect x="18" y="86" width="52" height="108" rx="5" className="c-bld" />
      <rect x="248" y="62" width="56" height="102" rx="5" className="c-bld" />
      <rect x="214" y="104" width="40" height="84" rx="5" className="c-bld-2" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1].map((c) => <rect key={`a${r}${c}`} x={28 + c * 18} y={98 + r * 22} width="10" height="12" rx="2" className="c-win" />),
      )}
      {[0, 1, 2, 3].map((r) =>
        [0, 1].map((c) => <rect key={`b${r}${c}`} x={260 + c * 20} y={74 + r * 20} width="11" height="12" rx="2" className="c-win" />),
      )}
      {[0, 1, 2].map((r) => (
        <rect key={`d${r}`} x="226" y={116 + r * 20} width="14" height="10" rx="2" className="c-win" />
      ))}
      {/* café */}
      <rect x="78" y="118" width="108" height="76" rx="6" className="c-cafe" />
      <path d="M72 118 h120 l-8 22 h-104 Z" fill={LIME} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${86 + i * 22} 118 h11 l-2 22 h-11 Z`} className="c-stripe" />
      ))}
      <rect x="96" y="150" width="30" height="44" rx="3" className="c-door" />
      <rect x="138" y="150" width="34" height="26" rx="3" className="c-glass" />
      <rect x="106" y="98" width="52" height="22" rx="5" fill="#0B0B0C" />
      <path d="M124 104 h12 v7 a5 5 0 0 1 -5 5 h-2 a5 5 0 0 1 -5 -5 Z M136 106 h2.5 a2.5 2.5 0 0 1 0 5 H136" stroke={LIME} strokeWidth="1.8" fill="none" />
      {/* trees */}
      {[
        [52, 176, 16],
        [196, 172, 14],
        [298, 176, 13],
        [12, 182, 11],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <rect x={x - 2} y={y} width="4" height="18" rx="2" className="c-trunk" />
          <motion.circle
            cx={x}
            cy={y - r * 0.4}
            r={r}
            className="c-tree"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: 0.5, originY: 1 }}
          />
        </g>
      ))}
      {/* pin */}
      <motion.ellipse
        cx="160"
        cy="96"
        rx="16"
        ry="5"
        fill={LIME}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0.5, 0, 0.5], scale: [0.6, 2.2, 0.6] }}
        transition={{ delay: 0.8, duration: 2, repeat: Infinity }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
      <motion.g initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.2 }}>
        <motion.g animate={{ y: [0, -5, 0] }} transition={{ delay: 1.2, duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
          <path d="M160 96 C 146 78, 132 64, 132 46 a28 28 0 0 1 56 0 C 188 64, 174 78, 160 96 Z" fill={LIME} />
          <circle cx="160" cy="46" r="11" fill="#0B0B0C" />
        </motion.g>
      </motion.g>
      <Rays cx={160} cy={34} r1={36} r2={48} angles={[-48, -18, 18, 48]} width={5} delay={0.9} />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Steaming cup — empty states
   -------------------------------------------------------------------------- */
export function EmptyCup({ size = 190 }) {
  return (
    <svg viewBox="0 0 200 170" width={size} height={(size * 170) / 200} className="illus" aria-hidden="true">
      <Rays cx={100} cy={70} r1={60} r2={72} angles={[-62, -40, 40, 62]} width={5} delay={0.4} />
      <ellipse cx="100" cy="156" rx="72" ry="9" className="c-shadow" />
      {[0, 1].map((i) => (
        <motion.path
          key={i}
          d={`M${88 + i * 22} 52 c -8 -10, 8 -16, 0 -28`}
          stroke={LIME}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={{ y: [6, -10], opacity: [0, 1, 0], scaleY: [0.9, 1.1] }}
          transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      <ellipse cx="100" cy="140" rx="70" ry="13" fill="#C5D900" />
      <ellipse cx="100" cy="136" rx="70" ry="13" fill={LIME_2} />
      <path d="M48 72 h104 v32 a44 40 0 0 1 -44 40 h-16 a44 40 0 0 1 -44 -40 Z" fill={LIME} />
      <path d="M152 82 h6 a16 16 0 0 1 0 32 h-10" stroke={LIME} strokeWidth="9" fill="none" strokeLinecap="round" />
      <ellipse cx="100" cy="72" rx="52" ry="11" fill="#C9DD00" />
      <ellipse cx="100" cy="73" rx="44" ry="8" fill="#8C6A3D" />
      <path d="M100 79 c -4 -4, -10 -2, -9 2 c 1 3, 6 5, 9 7 c 3 -2, 8 -4, 9 -7 c 1 -4, -5 -6, -9 -2 Z" fill="#F7E3C4" />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Wi-Fi with a slash — offline
   -------------------------------------------------------------------------- */
export function OfflineArt({ size = 190 }) {
  return (
    <svg viewBox="0 0 200 170" width={size} height={(size * 170) / 200} className="illus" aria-hidden="true">
      <ellipse cx="100" cy="150" rx="62" ry="10" className="c-shadow" />
      <g fill="none" stroke={LIME} strokeLinecap="round">
        {[
          [62, 13],
          [42, 13],
          [22, 13],
        ].map(([r, w], i) => (
          <motion.path
            key={r}
            d={`M${100 - r} ${118 - r * 0.55} A ${r} ${r} 0 0 1 ${100 + r} ${118 - r * 0.55}`}
            strokeWidth={w}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 2.2, delay: (2 - i) * 0.25, repeat: Infinity }}
          />
        ))}
      </g>
      <circle cx="100" cy="118" r="10" fill={LIME} />
      <motion.path
        d="M140 30 L70 140"
        stroke="var(--bg)"
        strokeWidth="18"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
      <motion.path
        d="M140 30 L70 140"
        stroke={LIME}
        strokeWidth="9"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      />
      <Rays cx={146} cy={30} r1={14} r2={26} angles={[-20, 10, 40]} width={5} delay={0.8} />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Icon inside a ray burst — plan updated, waitlist, success
   -------------------------------------------------------------------------- */
export function Burst({ icon: Icon, size = 120, stroke = 2 }) {
  return (
    <div className="burst" style={{ width: size * 1.6, height: size * 1.25 }} aria-hidden="true">
      <svg viewBox="0 0 160 125" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <Rays cx={80} cy={70} r1={46} r2={62} angles={[-80, -50, -22, 22, 50, 80]} width={5} delay={0.3} />
      </svg>
      <motion.div
        className="burst-icon"
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 14, delay: 0.1 }}
      >
        <Icon size={size * 0.62} strokeWidth={stroke} />
      </motion.div>
    </div>
  );
}

/* Big success tick with pulse rings */
export function SuccessTick({ size = 112 }) {
  return (
    <div className="success-tick" style={{ width: size, height: size }} aria-hidden="true">
      <span className="ring" />
      <span className="ring r2" />
      <motion.svg
        viewBox="0 0 52 52"
        width={size}
        height={size}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
      >
        <circle cx="26" cy="26" r="25" fill={LIME} />
        <motion.path
          d="M15 27 l7.5 7.5 L38 19"
          fill="none"
          stroke="#0B0B0C"
          strokeWidth="4.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
        />
      </motion.svg>
    </div>
  );
}
