// Shared motion presets (framer-motion)

export const EASE = [0.22, 1, 0.36, 1];
export const EASE_IOS = [0.32, 0.72, 0, 1];

export const spring = { type: 'spring', stiffness: 420, damping: 32, mass: 0.9 };
export const softSpring = { type: 'spring', stiffness: 260, damping: 28 };
export const bouncy = { type: 'spring', stiffness: 520, damping: 22 };

export const stagger = (each = 0.055, delay = 0.06) => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: delay } },
});

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

export const pop = {
  hidden: { opacity: 0, scale: 0.86 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 420, damping: 24 } },
};

export const slideRight = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
};

export const tap = { scale: 0.96 };
export const tapSoft = { scale: 0.985 };
