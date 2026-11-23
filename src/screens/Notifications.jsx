import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellOff, CalendarClock, Check, MapPinned, MessageCircle, Settings, Star } from 'lucide-react';
import { getPerson, useStore } from '../context/StoreContext';
import { daysFromToday, timeAgo } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, firstName } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Avatar } from '../components/ui';

function describe(n, state) {
  const plan = n.planId ? state.plans[n.planId] : null;
  const person = n.personId ? getPerson(state, n.personId) : null;
  switch (n.type) {
    case 'request':
      return { title: `${firstName(person.name)} wants to join`, body: plan?.title, avatar: person, action: { label: 'Review request', to: '/inbox' } };
    case 'accepted':
      return { title: 'You’re in!', body: `${firstName(person.name)} accepted your request.`, icon: Check, iconClass: 'solid', to: plan?.chatId ? `/chat/${plan.chatId}` : `/plan/${n.planId}` };
    case 'message': {
      const chat = state.chats[n.chatId];
      return { title: `New message in ${chat?.title || 'chat'}`, body: n.text, icon: MessageCircle, to: `/chat/${n.chatId}` };
    }
    case 'change':
      return { title: 'Venue changed', body: `${plan?.title} is now at ${plan?.change?.to || plan?.venue}.`, icon: MapPinned, to: `/plan/${n.planId}/changed` };
    case 'review':
      return { title: `How was ${plan?.title}?`, body: 'Leave a quick review for the host.', icon: Star, to: `/plan/${n.planId}/review` };
    case 'reminder':
      return { title: `Your ${plan?.activity === 'walk' ? 'walk' : 'plan'} starts in one hour`, body: plan?.title, icon: CalendarClock, to: `/plan/${n.planId}` };
    default:
      return { title: 'Update', body: '', icon: Check };
  }
}

function Item({ n }) {
  const nav = useNav();
  const { state } = useStore();
  const d = describe(n, state);
  const Icon = d.icon;
  return (
    <motion.div
      layout
      variants={fadeUp}
      className={cx('notif', !n.read && 'unread', d.to && 'pressable')}
      onClick={() => d.to && nav.go(d.to)}
      role={d.to ? 'button' : undefined}
      tabIndex={d.to ? 0 : undefined}
    >
      {d.avatar ? (
        <Avatar person={d.avatar} size={54} square />
      ) : (
        <span className={cx('notif-ic', d.iconClass)}>
          <Icon size={d.iconClass === 'solid' ? 24 : 26} strokeWidth={d.iconClass === 'solid' ? 3 : 2} />
        </span>
      )}
      <div className="grow" style={{ minWidth: 0 }}>
        <h4>{d.title}</h4>
        {d.body && <p className="ellipsis">{d.body}</p>}
        <small>{timeAgo(n.at)}</small>
        {d.action && (
          <button
            type="button"
            className="btn btn-primary btn-sm btn-block mt-8"
            onClick={(e) => {
              e.stopPropagation();
              nav.go(d.action.to);
            }}
          >
            {d.action.label}
          </button>
        )}
      </div>
      <AnimatePresence>
        {!n.read && <motion.span className="notif-dot" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} />}
      </AnimatePresence>
    </motion.div>
  );
}

/** 11 — Notifications */
export default function Notifications() {
  const nav = useNav();
  const { state, markAllRead } = useStore();
  const enabled = Object.values(state.settings.notifications).some(Boolean);

  const sorted = useMemo(() => [...state.notifications].sort((a, b) => b.at - a.at), [state.notifications]);
  const today = sorted.filter((n) => daysFromToday(n.at) === 0);
  const earlier = sorted.filter((n) => daysFromToday(n.at) !== 0);

  useEffect(() => {
    const t = setTimeout(markAllRead, 2600);
    return () => clearTimeout(t);
  }, [markAllRead]);

  return (
    <Screen
      header={
        <TopBar
          back
          center={<Logo size={22} />}
          right={
            <button type="button" className="icon-btn" aria-label="Notification settings" onClick={() => nav.go('/settings/notifications')}>
              <Settings size={22} strokeWidth={2.1} />
            </button>
          }
        />
      }
    >
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Notifications
        </motion.h1>
        {!enabled && (
          <motion.div variants={fadeUp} className="note mt-16">
            <BellOff size={20} /> Notifications are paused. Turn them on in settings.
          </motion.div>
        )}
        {today.length > 0 && (
          <>
            <motion.h3 variants={fadeUp} className="t-h3 mt-20 mb-12">
              Today
            </motion.h3>
            <div className="list">
              {today.map((n) => (
                <Item key={n.id} n={n} />
              ))}
            </div>
          </>
        )}
        {earlier.length > 0 && (
          <>
            <motion.h3 variants={fadeUp} className="t-h3 mt-24 mb-12">
              Earlier
            </motion.h3>
            <div className="list">
              {earlier.map((n) => (
                <Item key={n.id} n={n} />
              ))}
            </div>
          </>
        )}
        {!sorted.length && (
          <div className="empty">
            <h3>All caught up</h3>
            <p>New requests and updates will show up here.</p>
          </div>
        )}
      </motion.div>
    </Screen>
  );
}
