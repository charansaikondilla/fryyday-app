import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronRight, Mail, Search, ShieldCheck, TriangleAlert, UsersRound } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Sheet } from '../components/ui';

const TOPICS = {
  joining: {
    title: 'Joining a plan',
    sub: 'Find, request, and join plans.',
    Icon: UsersRound,
    faqs: [
      ['How do I join a plan?', 'Open a plan and tap “Request to join”. Add a short note — the host approves requests, and the group chat opens once you’re in.'],
      ['What if a plan is full?', 'You can join the waitlist. If a spot opens, we notify you in order of the list.'],
      ['Can I leave a plan?', 'Yes. Open the plan, tap ••• and choose “Leave plan”. The host is notified.'],
      ['Do I have to check in?', 'No — check-in is optional. It simply lets your group know you’ve arrived.'],
    ],
  },
  hosting: {
    title: 'Hosting',
    sub: 'Create and manage your plans.',
    Icon: CalendarDays,
    faqs: [
      ['How do I create a plan?', 'Tap the + button, pick an activity, a public place, a time and how many spots are open. Review it and publish.'],
      ['Who can join?', 'People request to join and you decide who comes. Choose “Friends” to keep a plan friends-only.'],
      ['Can I change the time or venue?', 'Yes. Open your plan → ••• → Edit plan. Everyone who joined gets a change notice.'],
      ['How do I cancel?', 'Open your plan → ••• → Cancel plan. Add a reason if you like — everyone is notified.'],
    ],
  },
  safety: {
    title: 'Chat and safety',
    sub: 'Stay respectful and keep meetups safe.',
    Icon: ShieldCheck,
    faqs: [
      ['Is my location shared?', 'Never precisely. Fryyday only uses your area, and maps show public venues only.'],
      ['How do I report someone?', 'Open their profile or the plan menu and tap Report. You can also block them at the same time.'],
      ['Meeting tips', 'Meet in busy public places, tell a friend where you’re going, and leave anytime you feel uncomfortable.'],
      ['Who sees the group chat?', 'Only people who have been accepted into the plan.'],
    ],
  },
};

function Faq({ q, a, open, onToggle }) {
  return (
    <motion.div variants={fadeUp} className={cx('faq', open && 'open')}>
      <button type="button" className="faq-q" onClick={onToggle} aria-expanded={open}>
        {q}
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ display: 'grid' }}>
          <ChevronDown size={20} strokeWidth={2.3} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} style={{ overflow: 'hidden' }}>
            <p className="faq-a">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ContactSheet({ open, onClose }) {
  const toast = useToast();
  const [msg, setMsg] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title="Contact support" subtitle="We usually reply within a few hours.">
      <textarea className="input textarea" rows={4} placeholder="How can we help?" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <button
        type="button"
        className="btn btn-primary btn-block mt-12"
        disabled={!msg.trim()}
        onClick={() => {
          setMsg('');
          onClose();
          toast.show({ title: 'Message sent', body: 'Support will reply in your inbox.', icon: 'check' });
        }}
      >
        Send message
      </button>
    </Sheet>
  );
}

/** 33 — Help center */
export function HelpCenter() {
  const nav = useNav();
  const [q, setQ] = useState('');
  const [openKey, setOpenKey] = useState(null);
  const [contact, setContact] = useState(false);
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return Object.values(TOPICS).flatMap((t) => t.faqs.filter(([qq, a]) => qq.toLowerCase().includes(query) || a.toLowerCase().includes(query)));
  }, [q]);

  return (
    <Screen
      header={<TopBar back center={<Logo size={22} />} />}
      footer={
        <div className="col gap-10">
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => setContact(true)}>
            <Mail size={20} strokeWidth={2.3} /> Contact support
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => nav.go('/report?urgent=1')}>
            <TriangleAlert size={19} strokeWidth={2.3} /> Report an urgent concern
          </button>
        </div>
      }
    >
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Help Center
        </motion.h1>
        <motion.div variants={fadeUp} className="input-wrap mt-16">
          <Search size={20} strokeWidth={2.2} />
          <input className="input search" placeholder="Search help" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search help" />
        </motion.div>

        {q.trim() ? (
          <motion.div className="list mt-16" variants={stagger(0.04)} initial="hidden" animate="show" key={q}>
            {results.map(([qq, a]) => (
              <Faq key={qq} q={qq} a={a} open={openKey === qq} onToggle={() => setOpenKey(openKey === qq ? null : qq)} />
            ))}
            {!results.length && <p className="t-sub t-center mt-12">No answers for “{q}”. Try contacting support.</p>}
          </motion.div>
        ) : (
          <>
            <motion.h3 variants={fadeUp} className="t-h3 mt-24 mb-12">
              Browse topics
            </motion.h3>
            <div className="list">
              {Object.entries(TOPICS).map(([key, t]) => (
                <motion.button variants={fadeUp} key={key} type="button" className="topic-row" onClick={() => nav.go(`/help/${key}`)}>
                  <span className="topic-ic">
                    <t.Icon size={26} strokeWidth={2} />
                  </span>
                  <span className="grow">
                    <strong>{t.title}</strong>
                    <small>{t.sub}</small>
                  </span>
                  <ChevronRight size={20} className="t-muted" />
                </motion.button>
              ))}
            </div>
          </>
        )}
      </motion.div>
      <ContactSheet open={contact} onClose={() => setContact(false)} />
    </Screen>
  );
}

export function HelpTopic() {
  const { topic } = useParams();
  const t = TOPICS[topic] || TOPICS.joining;
  const [openKey, setOpenKey] = useState(t.faqs[0][0]);
  return (
    <Screen header={<TopBar back backTo="/help" title={t.title} />}>
      <motion.div className="list mt-8" variants={stagger(0.05)} initial="hidden" animate="show">
        {t.faqs.map(([q, a]) => (
          <Faq key={q} q={q} a={a} open={openKey === q} onToggle={() => setOpenKey(openKey === q ? null : q)} />
        ))}
      </motion.div>
    </Screen>
  );
}
