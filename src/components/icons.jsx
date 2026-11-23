import {
  BookOpen,
  Clapperboard,
  Coffee,
  Gamepad2,
  Music,
  Plane,
  UtensilsCrossed,
  Volleyball,
} from 'lucide-react';

/* Custom icons drawn on the same 24px grid and stroke as lucide. */

function Svg({ size = 24, strokeWidth = 2, className, children, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function WalkIcon(props) {
  return (
    <Svg {...props}>
      <circle cx="14" cy="4.2" r="2" />
      <path d="M12.7 8.2 11 13.6" />
      <path d="M11 13.6 9.3 17.1 7.2 21" />
      <path d="M11 13.6l2.7 3.2 1.3 4.2" />
      <path d="M12.7 8.2 9.7 10l-1.6 2.8" />
      <path d="M12.7 8.2l2 3.1 2.6 1" />
    </Svg>
  );
}

export function PickleballIcon(props) {
  return (
    <Svg {...props}>
      <g transform="rotate(-45 12 12)">
        <rect x="6.5" y="1.8" width="11" height="13" rx="5.5" />
        <path d="M12 14.8v6.4" />
        <path d="M10.2 18.2h3.6" />
      </g>
      <circle cx="19.4" cy="4.6" r="2.4" />
    </Svg>
  );
}

export const ACTIVITY_ICONS = {
  coffee: Coffee,
  walk: WalkIcon,
  pickleball: PickleballIcon,
  sports: Volleyball,
  movies: Clapperboard,
  food: UtensilsCrossed,
  travel: Plane,
  music: Music,
  gaming: Gamepad2,
  books: BookOpen,
};
