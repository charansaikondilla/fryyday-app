import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { House, Mail, Plus, Search, UserRound } from 'lucide-react';
import { inboxBadge, useStore } from '../context/StoreContext';
import { cx, haptic } from '../lib/utils';

const TABS = [
  { to: '/home', label: 'Home', Icon: House },
  { to: '/discover', label: 'Discover', Icon: Search },
  { fab: true, to: '/create', label: 'Add event' },
  { to: '/inbox', label: 'Inbox', Icon: Mail, badge: true },
  { to: '/profile', label: 'Profile', Icon: UserRound },
];

/** One bottom menu across the app: Home | Discover | + Add Event | Inbox | Profile */
export default function TabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { state } = useStore();
  const badge = inboxBadge(state);

  return (
    <motion.nav
      className="tabbar"
      aria-label="Main"
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
    >
      {TABS.map((t) => {
        if (t.fab) {
          return (
            <div key="fab" className="tab-fab-wrap">
              <motion.button
                type="button"
                className="tab-fab"
                aria-label="Add event"
                whileTap={{ scale: 0.88, rotate: 90 }}
                whileHover={{ rotate: 90 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                onClick={() => {
                  haptic(8);
                  navigate('/create');
                }}
              >
                <Plus size={28} strokeWidth={2.6} />
              </motion.button>
            </div>
          );
        }
        const active = pathname === t.to;
        return (
          <button
            key={t.to}
            type="button"
            className={cx('tab', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (!active) navigate(t.to, { replace: true });
            }}
          >
            <span className="tab-icon">
              {active && <motion.span className="tab-glow" layoutId="tab-glow" transition={{ type: 'spring', stiffness: 520, damping: 38 }} />}
              <motion.span animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }} style={{ display: 'grid' }}>
                <t.Icon size={23} strokeWidth={active ? 2.4 : 2} />
              </motion.span>
              {t.badge && badge > 0 && (
                <motion.span key={badge} className="count-badge" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
                  {badge > 9 ? '9+' : badge}
                </motion.span>
              )}
            </span>
            {t.label}
          </button>
        );
      })}
    </motion.nav>
  );
}
