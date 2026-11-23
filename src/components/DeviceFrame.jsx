import { useEffect, useState } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, Coffee, MessageCircle, Moon, ShieldCheck, Sparkles, Sun } from 'lucide-react';
import { FrameProvider, useFrame } from '../context/FrameContext';
import { originFromEvent, useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';
import Logo from './Logo';
import DynamicIsland from './DynamicIsland';
import { cx } from '../lib/utils';

const PHONE_W = 417;
const PHONE_H = 876;

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vp;
}

/**
 * On phones the app fills the screen. On larger screens it is presented inside
 * a phone on a lit stage, scaled to fit the window.
 */
export default function DeviceFrame({ children }) {
  const { w, h } = useViewport();
  const framed = w >= 640 && h >= 480;
  const scale = Math.min(1, (h - 40) / PHONE_H, (w - 40) / PHONE_W);

  if (!framed) {
    return (
      <FrameProvider framed={false}>
        <div className="native-root">
          <div className="app" id="app">
            {children}
            <DynamicIsland />
          </div>
        </div>
      </FrameProvider>
    );
  }

  return (
    <FrameProvider framed>
      <MotionConfig transformPagePoint={(p) => ({ x: p.x / scale, y: p.y / scale })}>
        <div className="stage">
          <div className="stage-lights" aria-hidden="true">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>
          <div className="stage-grid" aria-hidden="true" />
          <div className="stage-noise" aria-hidden="true" />

          <StageTop />
          <StageSide />
          <StageRight />

          <motion.div
            className="phone-wrap"
            style={{ scale }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="phone-glow" aria-hidden="true" />
            <div className="phone">
              <span className="phone-btn l1" />
              <span className="phone-btn l2" />
              <span className="phone-btn l3" />
              <span className="phone-btn r1" />
              <div className="phone-screen framed">
                <div className="app" id="app">
                  {children}
                  <StatusBar />
                  <DynamicIsland />
                  <div className="home-indicator" aria-hidden="true" />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="stage-caption">Fryyday · Good plans. Great company.</div>
        </div>
      </MotionConfig>
    </FrameProvider>
  );
}

function StageTop() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="stage-top">
      <div className="stage-brand">
        <Logo size={28} />
        <small>Turn plans into connections.</small>
      </div>
      <button type="button" className="theme-pill" onClick={(e) => toggleTheme(originFromEvent(e))} aria-label="Toggle light and dark mode">
        <span className={cx('theme-pill-opt', theme === 'light' && 'on')}>
          <Sun size={16} strokeWidth={2.4} />
        </span>
        <span className={cx('theme-pill-opt', theme === 'dark' && 'on')}>
          <Moon size={16} strokeWidth={2.4} />
        </span>
        <motion.span className="theme-pill-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 34 }} style={{ left: theme === 'light' ? 4 : 40 }} />
      </button>
    </div>
  );
}

function StageSide() {
  return (
    <motion.aside
      className="stage-side"
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2>
        Good plans.
        <br />
        <em>Great company.</em>
      </h2>
      <p>Find people nearby for coffee, walks, pickleball, movies and food — then meet up for real.</p>
      <ul>
        <li>
          <span>
            <Coffee size={14} strokeWidth={2.6} />
          </span>
          Discover plans around you
        </li>
        <li>
          <span>
            <Sparkles size={14} strokeWidth={2.6} />
          </span>
          Host in under a minute
        </li>
        <li>
          <span>
            <MessageCircle size={14} strokeWidth={2.6} />
          </span>
          Group chat after you’re in
        </li>
        <li>
          <span>
            <ShieldCheck size={14} strokeWidth={2.6} />
          </span>
          Public places, area-only location
        </li>
      </ul>
    </motion.aside>
  );
}

const JUMPS = [
  { label: 'Welcome', to: '/welcome' },
  { label: 'Home', to: '/home', auth: true },
  { label: 'Discover · map', to: '/discover?view=map', auth: true },
  { label: 'Plan details', to: '/plan/p-coffee', auth: true },
  { label: 'Create a plan', to: '/create', auth: true },
  { label: 'Inbox requests', to: '/inbox', auth: true },
  { label: 'Group chat', to: '/chat/c-satcoffee', auth: true },
  { label: 'Notifications', to: '/notifications', auth: true },
  { label: 'Profile', to: '/profile', auth: true },
  { label: 'Settings', to: '/settings', auth: true },
];

function StageRight() {
  const navigate = useNavigate();
  const { state } = useStore();
  const { framed } = useFrame();
  const ready = state.session.onboarded && state.session.loggedIn;
  if (!framed) return null;
  return (
    <motion.aside
      className="stage-right"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="stage-card">
        <h4>Jump to a screen</h4>
        <div className="jump-list">
          {JUMPS.map((j) => (
            <button
              key={j.to}
              type="button"
              className="jump-btn"
              disabled={j.auth && !ready}
              onClick={() => navigate(j.to)}
              title={j.auth && !ready ? 'Finish onboarding first' : undefined}
            >
              {j.label}
              <ArrowUpRight size={15} strokeWidth={2.4} />
            </button>
          ))}
        </div>
      </div>
      <div className="stage-card stage-tip">
        <Bell size={16} strokeWidth={2.4} />
        <span>Everything works: request to join, chat, host a plan — replies and approvals arrive live.</span>
      </div>
    </motion.aside>
  );
}

function StatusBar() {
  const { tone } = useFrame();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  return (
    <div className={cx('statusbar', tone !== 'auto' && `tone-${tone}`)} aria-hidden="true">
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {h}:{m}
      </span>
      <span className="statusbar-icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
          <path d="M8.5 2.4c2.4 0 4.6.9 6.3 2.5l1.2-1.3C14 1.6 11.4.6 8.5.6S3 1.6 1 3.6l1.2 1.3c1.7-1.6 3.9-2.5 6.3-2.5z" />
          <path d="M8.5 5.9c1.4 0 2.7.5 3.7 1.4l1.2-1.3C12.1 4.8 10.4 4.1 8.5 4.1s-3.6.7-4.9 1.9l1.2 1.3c1-.9 2.3-1.4 3.7-1.4z" />
          <path d="M8.5 9.3c.6 0 1.1.2 1.5.6L8.5 11.5 7 9.9c.4-.4.9-.6 1.5-.6z" />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="18" height="9" rx="2.5" fill="currentColor" />
          <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity="0.45" />
        </svg>
      </span>
    </div>
  );
}
