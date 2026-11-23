import { forwardRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Check, Info, MessageCircle, MessagesSquare } from 'lucide-react';
import { getPerson, myChats, useStore, ME } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatTime, daysFromToday, timeAgo, weekdayName } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, firstName } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen } from '../components/Screen';
import { ActivityIcon, Avatar, Img, LocationButton, Segmented } from '../components/ui';
import { CitySheet } from '../components/Sheets';

const RequestCard = forwardRef(function RequestCard({ r }, ref) {
  const { state, respondRequest } = useStore();
  const toast = useToast();
  const person = getPerson(state, r.personId);
  const plan = state.plans[r.planId];
  const [leaving, setLeaving] = useState(null);
  if (!plan) return null;

  const act = (accept) => {
    setLeaving(accept ? 'accept' : 'decline');
    setTimeout(() => {
      const ok = respondRequest(r.id, accept);
      if (!ok) setLeaving(null);
      else if (!accept) toast.show({ title: 'Request declined', body: `${firstName(person.name)} won’t be notified why.`, icon: 'check' });
    }, accept ? 520 : 380);
  };

  return (
    <motion.article
      ref={ref}
      layout
      variants={fadeUp}
      initial="hidden"
      animate="show"
      exit={leaving === 'decline' ? { x: -340, opacity: 0, transition: { duration: 0.35 } } : { scale: 0.9, opacity: 0, transition: { duration: 0.3 } }}
      className={cx('req-card card', leaving === 'accept' && 'is-accepting')}
    >
      <div className="row gap-16" style={{ alignItems: 'flex-start' }}>
        <Avatar person={person} size={92} square />
        <div className="grow" style={{ minWidth: 0 }}>
          <h3 className="t-h3">{firstName(person.name)}</h3>
          <p className="req-plan">
            <ActivityIcon activity={plan.activity} size={17} strokeWidth={2.2} />
            <span className="ellipsis">{plan.title}</span>
          </p>
          <p className="t-sub mt-4">{r.message}</p>
          <p className="t-cap mt-4">{timeAgo(r.at)}</p>
        </div>
      </div>
      <div className="row gap-10 mt-16">
        <button
          type="button"
          className="btn btn-primary btn-md grow"
          onClick={() => !leaving && act(true)}
          aria-disabled={Boolean(leaving)}
          style={leaving ? { pointerEvents: 'none' } : undefined}
        >
          <AnimatePresence mode="wait" initial={false}>
            {leaving === 'accept' ? (
              <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ display: 'grid' }}>
                <Check size={22} strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span key="txt" exit={{ opacity: 0 }}>
                Accept
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button type="button" className="btn btn-outline btn-md grow" onClick={() => act(false)} disabled={Boolean(leaving)}>
          Decline
        </button>
      </div>
    </motion.article>
  );
});

function SentCard({ r }) {
  const nav = useNav();
  const { state } = useStore();
  const plan = state.plans[r.planId];
  const host = getPerson(state, r.personId);
  if (!plan) return null;
  const label = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined', waitlist: 'Waitlist' }[r.status] || r.status;
  return (
    <motion.article layout variants={fadeUp} className="sent-card card pressable" onClick={() => nav.go(r.status === 'waitlist' ? `/plan/${plan.id}/waitlist` : `/plan/${plan.id}`)}>
      <Img src={plan.image} alt="" activity={plan.activity} className="sent-img" />
      <div className="grow" style={{ minWidth: 0 }}>
        <h4 className="ellipsis">{plan.title}</h4>
        <p className="t-cap mt-4">Hosted by {firstName(host.name)}</p>
        <span className={cx('pill mt-8', r.status === 'accepted' ? 'pill-accent' : r.status === 'declined' ? 'pill-danger' : 'pill-muted')}>
          {r.status === 'pending' && <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />}
          {label}
        </span>
      </div>
    </motion.article>
  );
}

function lastLabel(ts) {
  if (!ts) return '';
  const d = daysFromToday(ts);
  if (d === 0) return formatTime(ts);
  if (d === -1) return 'Yesterday';
  if (d > -7) return weekdayName(ts);
  return timeAgo(ts);
}

function ChatRow({ chat }) {
  const nav = useNav();
  const { state, typing } = useStore();
  const plan = state.plans[chat.planId];
  const last = chat.messages.at(-1);
  const who = last && last.from !== 'system' ? getPerson(state, last.from) : null;
  const typer = typing[chat.id] ? getPerson(state, typing[chat.id]) : null;
  return (
    <motion.button layout variants={fadeUp} type="button" className="chat-row" onClick={() => nav.go(`/chat/${chat.id}`)}>
      <span style={{ position: 'relative' }}>
        <Img src={plan?.image} alt="" activity={plan?.activity} className="chat-row-img" />
      </span>
      <span className="grow" style={{ minWidth: 0 }}>
        <span className="row between gap-8">
          <strong className="ellipsis">{chat.title}</strong>
          <small className={cx(chat.unread > 0 && 't-accent')}>{lastLabel(last?.at)}</small>
        </span>
        <span className="row between gap-8 mt-4">
          <span className={cx('chat-row-last ellipsis', chat.unread > 0 && 'strong')}>
            {typer ? (
              <span className="t-accent">{firstName(typer.name)} is typing…</span>
            ) : last ? (
              <>
                {who ? `${who.id === ME ? 'You' : firstName(who.name)}: ` : ''}
                {last.image ? '📷 Photo' : last.text}
              </>
            ) : (
              'No messages yet'
            )}
          </span>
          {chat.unread > 0 && <span className="count-badge">{chat.unread}</span>}
        </span>
      </span>
    </motion.button>
  );
}

/** 04 — Requests & chats */
export default function Inbox() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'chats' ? 'chats' : 'requests';
  const [box, setBox] = useState('received');
  const [cityOpen, setCityOpen] = useState(false);

  const received = state.requests.filter((r) => r.dir === 'in' && r.status === 'pending');
  const sent = state.requests.filter((r) => r.dir === 'out');
  const chats = myChats(state);
  const unreadChats = chats.reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <Screen
      tabs
      header={
        <div className="discover-head">
          <div className="row between">
            <Logo size={26} />
            <LocationButton city={state.user.city} onClick={() => setCityOpen(true)} />
          </div>
          <h1 className="t-display mt-8">Inbox</h1>
        </div>
      }
    >
      <Segmented
        value={tab}
        onChange={(v) => setParams(v === 'chats' ? { tab: 'chats' } : {}, { replace: true })}
        options={[
          { value: 'requests', label: 'Requests', count: tab === 'requests' ? null : received.length },
          { value: 'chats', label: 'Chats', count: tab === 'chats' ? null : unreadChats },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'requests' ? (
          <motion.div key="req" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            <div className="mt-12">
              <Segmented
                size="sm"
                value={box}
                onChange={setBox}
                options={[
                  { value: 'received', label: `Received (${received.length})` },
                  { value: 'sent', label: `Sent (${sent.length})` },
                ]}
              />
            </div>
            {box === 'received' ? (
              <motion.div className="list mt-16" variants={stagger(0.07)} initial="hidden" animate="show">
                <AnimatePresence mode="popLayout">
                  {received.map((r) => (
                    <RequestCard key={r.id} r={r} />
                  ))}
                </AnimatePresence>
                {!received.length && (
                  <motion.div variants={fadeUp} className="empty" style={{ paddingTop: 16 }}>
                    <span className="empty-ic">
                      <Check size={30} strokeWidth={2.6} />
                    </span>
                    <h3 style={{ fontSize: 22 }}>You’re all caught up</h3>
                    <p>New join requests for your plans will appear here.</p>
                  </motion.div>
                )}
                <motion.p variants={fadeUp} className="row center gap-8 t-sub mt-8">
                  <Info size={17} strokeWidth={2.2} /> Chat opens after you accept.
                </motion.p>
              </motion.div>
            ) : (
              <motion.div className="list mt-16" variants={stagger(0.07)} initial="hidden" animate="show">
                {sent.map((r) => (
                  <SentCard key={r.id} r={r} />
                ))}
                {!sent.length && (
                  <div className="empty">
                    <h3 style={{ fontSize: 22 }}>No requests sent</h3>
                    <p>Find a plan you like and request to join.</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="chats" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}>
            <motion.div className="chat-list mt-16" variants={stagger(0.06)} initial="hidden" animate="show">
              {chats.map((c) => (
                <ChatRow key={c.id} chat={c} />
              ))}
              {!chats.length && (
                <div className="empty">
                  <span className="empty-ic">
                    <MessagesSquare size={30} strokeWidth={2.2} />
                  </span>
                  <h3 style={{ fontSize: 22 }}>No chats yet</h3>
                  <p>Group chats open once you join a plan.</p>
                </div>
              )}
            </motion.div>
            {chats.length > 0 && (
              <p className="row center gap-8 t-cap mt-16">
                <MessageCircle size={15} /> Only members of a plan can see its chat.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <CitySheet open={cityOpen} onClose={() => setCityOpen(false)} />
    </Screen>
  );
}
