import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cx } from '../lib/utils';
import { useNav } from '../lib/nav';

const ScreenContext = createContext({ scrolled: false, scrollRef: { current: null } });
const scrollMemory = new Map();

export function useScreen() {
  return useContext(ScreenContext);
}

/**
 * Layout primitive for every screen.
 *  - `header`      sticky top bar inside the scroll area
 *  - `overlay`     absolutely positioned layer above content (hero top bars)
 *  - `footer`      pinned bottom area with a fade (CTAs)
 *  - `tabs`        reserves space for the bottom tab bar
 */
export function Screen({
  header,
  overlay,
  footer,
  tabs = false,
  glow = true,
  softGlow = false,
  className,
  bodyClassName,
  children,
  scrollKey,
  onScroll,
  noBody = false,
  innerRef,
}) {
  const location = useLocation();
  const key = scrollKey ?? location.pathname + location.search;
  const scrollRef = useRef(null);
  const lastY = useRef(0);
  const scrolledRef = useRef(false);
  const [scrolled, setScrolled] = useState(false);

  useLayoutEffect(() => {
    const y = scrollMemory.get(key);
    if (y && scrollRef.current) {
      scrollRef.current.scrollTop = y;
      lastY.current = y;
      scrolledRef.current = y > 6;
      setScrolled(y > 6);
    }
    // restore once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => scrollMemory.set(key, lastY.current), [key]);

  const handleScroll = (e) => {
    const y = e.currentTarget.scrollTop;
    lastY.current = y;
    const s = y > 6;
    if (s !== scrolledRef.current) {
      scrolledRef.current = s;
      setScrolled(s);
    }
    onScroll?.(e);
  };

  const setRefs = (node) => {
    scrollRef.current = node;
    if (innerRef) innerRef.current = node;
  };

  return (
    <ScreenContext.Provider value={{ scrolled, scrollRef }}>
      <div className={cx('screen', tabs && 'has-tabs', footer && 'has-footer', className)}>
        {glow && <div className={cx('screen-glow', softGlow && 'is-soft')} aria-hidden="true" />}
        {overlay}
        <div className="screen-scroll" ref={setRefs} onScroll={handleScroll}>
          {header}
          {noBody ? children : <div className={cx('screen-body', bodyClassName)}>{children}</div>}
        </div>
        {footer && <div className="screen-footer">{footer}</div>}
      </div>
    </ScreenContext.Provider>
  );
}

export function TopBar({ title, left, right, center, back = false, backTo, onBack, overlay = false, glass = false, className, alwaysSolid = false }) {
  const { scrolled } = useScreen();
  return (
    <div className={cx('topbar', (scrolled || alwaysSolid) && !overlay && 'is-scrolled', overlay && 'is-overlay', className)}>
      <div className="topbar-side">{back ? <BackButton to={backTo} onClick={onBack} glass={glass} /> : left}</div>
      <div className="topbar-center">{center ?? (title ? <span className="topbar-title">{title}</span> : null)}</div>
      <div className="topbar-side right">{right}</div>
    </div>
  );
}

export function BackButton({ to, onClick, glass = false, label = 'Back' }) {
  const nav = useNav();
  return (
    <button
      type="button"
      className={cx('icon-btn', glass && 'glass')}
      aria-label={label}
      onClick={() => (onClick ? onClick() : nav.back(to || '/home'))}
    >
      <ArrowLeft size={24} strokeWidth={2.2} />
    </button>
  );
}
