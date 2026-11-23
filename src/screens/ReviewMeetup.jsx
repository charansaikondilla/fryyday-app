import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Check, Star, UserPlus, Users } from 'lucide-react';
import { getPerson, useStore, ME } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, firstName } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Avatar, Steps } from '../components/ui';
import { PlanSummary } from '../components/PlanCards';
import { SuccessTick } from '../components/Illustrations';
import Confetti from '../components/Confetti';
import { NotFound } from './PlanDetails';

const LABELS = ['', 'Not great', 'Okay', 'Nice', 'Good', 'Loved it!'];
const TAGS = ['Friendly host', 'Easy to find', 'Great conversation', 'Good vibe', 'On time', 'Would go again'];

/** 12 — After the meetup */
export default function ReviewMeetup() {
  const { id } = useParams();
  const nav = useNav();
  const toast = useToast();
  const { state, submitReview, sendFriendRequest } = useStore();
  const plan = state.plans[id];
  const existing = state.reviews[id];
  const [rating, setRating] = useState(existing?.rating || 4);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState(existing?.tags || ['Friendly host', 'Easy to find']);
  const [text, setText] = useState(existing?.text || '');
  const [done, setDone] = useState(false);
  if (!plan) return <NotFound />;

  const shown = hover || rating;
  const others = [plan.hostId, ...plan.attendees].filter((p) => p !== ME).map((p) => getPerson(state, p));

  const submit = () => {
    submitReview(id, { rating, tags, text: text.trim() });
    setDone(true);
  };

  if (done) {
    return (
      <Screen
        header={<TopBar back backTo="/home" center={<Logo size={22} />} />}
        footer={
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => nav.replace('/home')}>
            Done
          </button>
        }
      >
        <Confetti fire={1} origin={{ x: 0.5, y: 0.2 }} count={80} />
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="col" style={{ alignItems: 'center', textAlign: 'center' }}>
          <motion.div variants={fadeUp} className="mt-16">
            <SuccessTick size={104} />
          </motion.div>
          <motion.h1 variants={fadeUp} className="t-h1 mt-16">
            Thanks for the review!
          </motion.h1>
          <motion.p variants={fadeUp} className="t-body mt-8">
            Keep the connection going — add people you’d meet again.
          </motion.p>
        </motion.div>
        <motion.div className="list mt-24" variants={stagger(0.06, 0.3)} initial="hidden" animate="show">
          {others.map((p) => {
            const friend = state.friends.includes(p.id);
            const sent = state.sentFriendRequests.includes(p.id);
            return (
              <motion.div key={p.id} variants={fadeUp} className="person-row card">
                <Avatar person={p} size={48} />
                <span className="grow">
                  <strong>{p.name}</strong>
                  <small className="t-cap" style={{ display: 'block' }}>
                    {p.id === plan.hostId ? 'Host' : 'Met at this plan'}
                  </small>
                </span>
                <button
                  type="button"
                  className={cx('btn btn-xs', friend || sent ? 'btn-soft' : 'btn-primary')}
                  disabled={friend || sent}
                  onClick={() => {
                    sendFriendRequest(p.id);
                    toast.show({ title: 'Friend request sent', body: p.name, avatar: p.avatar, icon: 'user' });
                  }}
                >
                  {friend ? (
                    <>
                      <Check size={14} strokeWidth={3} /> Friends
                    </>
                  ) : sent ? (
                    'Requested'
                  ) : (
                    <>
                      <UserPlus size={14} strokeWidth={2.6} /> Add
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <div>
          <TopBar back backTo={`/plan/${id}`} center={<Logo size={22} />} />
          <div style={{ padding: '0 var(--pad) 6px' }}>
            <Steps total={3} current={3} />
          </div>
        </div>
      }
      footer={
        <div className="col gap-8" style={{ alignItems: 'center' }}>
          <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={submit}>
            Submit review
          </button>
          <button type="button" className="text-link" onClick={() => nav.back('/home')}>
            Skip for now
          </button>
          <button type="button" className="text-link" style={{ fontSize: 13, color: 'var(--text-2)' }} onClick={() => nav.go(`/report?plan=${id}&person=${plan.hostId}`)}>
            Report a concern
          </button>
        </div>
      }
    >
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          How was your meetup?
        </motion.h1>
        <div className="mt-16">
          <PlanSummary plan={plan} hostLine />
        </div>

        <motion.div variants={fadeUp} className="stars mt-24" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              className={cx('star', n <= shown && 'on')}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              whileTap={{ scale: 0.8 }}
              animate={n <= shown ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : { scale: 1 }}
              transition={{ duration: 0.35, delay: n <= shown ? (n - 1) * 0.04 : 0 }}
            >
              <Star size={42} strokeWidth={1.8} fill={n <= shown ? 'currentColor' : 'none'} />
            </motion.button>
          ))}
        </motion.div>
        <div className="row center mt-12">
          <AnimatePresence mode="wait">
            <motion.span key={shown} className="pill pill-accent" style={{ fontSize: 15, height: 34, padding: '0 18px' }} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}>
              {LABELS[shown]}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.h3 variants={fadeUp} className="t-h3 mt-24">
          What went well?
        </motion.h3>
        <motion.div variants={fadeUp} className="chip-wrap mt-12">
          {TAGS.map((t) => {
            const on = tags.includes(t);
            return (
              <motion.button key={t} type="button" whileTap={{ scale: 0.94 }} className={cx('chip sm', on && 'is-active')} onClick={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))}>
                {on && <motion.span className="chip-fill" layoutId={undefined} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />}
                {on && <Check size={14} strokeWidth={3} />}
                {t}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.textarea variants={fadeUp} className="input textarea mt-16" rows={3} placeholder="Share a little more…" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} aria-label="Your review" />
        <motion.p variants={fadeUp} className="row gap-10 t-sub mt-12">
          <Users size={20} strokeWidth={2.1} style={{ flex: 'none' }} /> Your review will be visible to the host and other members.
        </motion.p>
        <p className="t-cap mt-4">Hosted by {firstName(getPerson(state, plan.hostId).name)}</p>
      </motion.div>
    </Screen>
  );
}
