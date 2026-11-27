import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useAnimationControls } from 'framer-motion';
import { CalendarDays, ChevronRight, Clock, MapPin, Pencil, Users, X } from 'lucide-react';
import { ACTIVITIES, CREATE_ACTIVITIES, resolveVenue, venueByName, venueType } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { at, formatTime, formatWhen, nextDays } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, haptic } from '../lib/utils';
import { Screen, TopBar } from '../components/Screen';
import { Img, ProgressBar, Radio, Stepper } from '../components/ui';
import { ACTIVITY_ICONS } from '../components/icons';
import { DateSheet, TimeSheet, VenueSheet } from '../components/Sheets';

function defaultDraft() {
  return {
    activity: 'coffee',
    title: ACTIVITIES.coffee.defaultTitle,
    titleTouched: false,
    venue: '',
    dayOffset: 1,
    time: '17:30',
    spots: 4,
    audience: 'nearby',
    about: ACTIVITIES.coffee.defaultAbout,
  };
}

/** 03 — Create a plan · step 1 of 2 */
export function CreatePlan() {
  const nav = useNav();
  const { state, setDraft } = useStore();
  const [d, setD] = useState(() => ({ ...defaultDraft(), ...(state.draft || {}) }));
  const [sheet, setSheet] = useState(null); // venue | date | time
  const [error, setError] = useState('');
  const shake = useAnimationControls();
  const day = nextDays(7).find((x) => x.offset === d.dayOffset);

  const set = (patch) => setD((prev) => ({ ...prev, ...patch }));

  const pickActivity = (id) => {
    const act = ACTIVITIES[id];
    const v = d.venue ? venueByName(d.venue) : null;
    set({
      activity: id,
      title: d.titleTouched ? d.title : act.defaultTitle,
      about: d.titleTouched ? d.about : act.defaultAbout,
      venue: v && v.type !== venueType(id) ? '' : d.venue,
    });
    haptic(6);
  };

  const next = () => {
    if (!d.title.trim()) {
      setError('Give your plan a name.');
      shake.start({ x: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } });
      return;
    }
    if (!d.venue) {
      setError('Choose a public place to meet.');
      shake.start({ x: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } });
      return;
    }
    setError('');
    setDraft(d);
    nav.go('/create/review');
  };

  return (
    <Screen
      softGlow
      header={
        <div className="create-head">
          <TopBar
            left={
              <button type="button" className="icon-btn soft" aria-label="Close" onClick={() => nav.back('/home')}>
                <X size={22} strokeWidth={2.3} />
              </button>
            }
            center={<span className="topbar-title" style={{ fontSize: 20, fontWeight: 800 }}>Create a plan</span>}
          />
          <div className="create-progress">
            <p>
              <span className="t-accent">1 of 2</span> · The basics
            </p>
            <ProgressBar value={0.5} from={0} />
          </div>
        </div>
      }
      footer={
        <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={next}>
          Continue
        </button>
      }
    >
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show">
        <LayoutGroup id="create-acts">
          <motion.div variants={fadeUp} className="act-picker">
            {CREATE_ACTIVITIES.map((id) => {
              const Icon = ACTIVITY_ICONS[id];
              const on = d.activity === id;
              return (
                <motion.button key={id} type="button" whileTap={{ scale: 0.93 }} className={cx('act', on && 'is-on')} onClick={() => pickActivity(id)} aria-pressed={on}>
                  {on && <motion.span layoutId="act-fill" className="act-fill" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <Icon size={26} strokeWidth={2} />
                  <span>{ACTIVITIES[id].label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        </LayoutGroup>

        <motion.label variants={fadeUp} className="field mt-20">
          <span className="field-label">Plan name</span>
          <input className="input" value={d.title} maxLength={48} onChange={(e) => set({ title: e.target.value, titleTouched: true })} placeholder="Coffee & conversations" />
        </motion.label>

        <motion.div variants={fadeUp} className="field">
          <span className="field-label">Venue</span>
          <motion.button type="button" className={cx('select-btn', error && !d.venue && 'has-error')} onClick={() => setSheet('venue')} animate={shake}>
            <MapPin size={20} strokeWidth={2.2} />
            {d.venue ? <span className="ellipsis">{d.venue}</span> : <span className="ph">Choose a public place</span>}
            <ChevronRight className="chev" size={20} />
          </motion.button>
        </motion.div>

        <motion.div variants={fadeUp} className="field-grid">
          <div className="field">
            <span className="field-label">Date</span>
            <button type="button" className="select-btn" onClick={() => setSheet('date')}>
              <CalendarDays size={20} strokeWidth={2.2} />
              <span className="ellipsis">{day ? day.label : 'Pick a day'}</span>
              <ChevronRight className="chev" size={18} />
            </button>
          </div>
          <div className="field">
            <span className="field-label">Time</span>
            <button type="button" className="select-btn" onClick={() => setSheet('time')}>
              <Clock size={20} strokeWidth={2.2} />
              <span className="ellipsis">{formatTime(at(0, d.time))}</span>
              <ChevronRight className="chev" size={18} />
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="row between mt-20">
          <span className="field-label" style={{ margin: 0 }}>
            Open spots
          </span>
          <Stepper value={d.spots} min={1} max={20} onChange={(v) => set({ spots: v })} />
        </motion.div>

        <motion.div variants={fadeUp} className="field mt-20">
          <span className="field-label">Audience</span>
          <div className="list" style={{ gap: 8 }}>
            {[
              { v: 'nearby', label: 'People nearby', sub: 'Anyone in your area can request to join' },
              { v: 'friends', label: 'Friends', sub: 'Only your Fryyday friends can see it' },
            ].map((o) => (
              <button key={o.v} type="button" className={cx('option-row', d.audience === o.v && 'is-on')} onClick={() => set({ audience: o.v })}>
                <Radio on={d.audience === o.v} />
                <span className="grow">
                  {o.label}
                  <small className="t-cap" style={{ display: 'block', marginTop: 2 }}>
                    {o.sub}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <motion.label variants={fadeUp} className="field mt-20">
          <span className="field-label">
            About <small>optional</small>
          </span>
          <textarea className="input textarea" rows={3} maxLength={200} value={d.about} onChange={(e) => set({ about: e.target.value, titleTouched: true })} />
        </motion.label>

        <AnimatePresence>
          {error && (
            <motion.p className="field-error mt-12" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <VenueSheet
        open={sheet === 'venue'}
        onClose={() => setSheet(null)}
        activity={d.activity}
        value={d.venue}
        onPick={(v) => {
          set({ venue: v });
          setError('');
          setSheet(null);
        }}
      />
      <DateSheet
        open={sheet === 'date'}
        onClose={() => setSheet(null)}
        value={d.dayOffset}
        onPick={(v) => {
          set({ dayOffset: v });
          setSheet(null);
        }}
      />
      <TimeSheet
        open={sheet === 'time'}
        onClose={() => setSheet(null)}
        value={d.time}
        onPick={(v) => {
          set({ time: v });
          setSheet(null);
        }}
      />
    </Screen>
  );
}

/** 09 — Review plan · step 2 of 2 */
export function ReviewPlan() {
  const nav = useNav();
  const toast = useToast();
  const { state, createPlan } = useStore();
  const d = state.draft;
  const [publishing, setPublishing] = useState(false);
  const venue = useMemo(() => (d ? resolveVenue(d.venue, d.venueArea || state.user.area) : null), [d, state.user.area]);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!d) {
    return (
      <Screen header={<TopBar back backTo="/create" />}>
        <div className="empty">
          <h3>Nothing to review yet</h3>
          <p>Start with the basics first.</p>
          <button type="button" className="btn btn-primary mt-24" onClick={() => nav.replace('/create')}>
            Create a plan
          </button>
        </div>
      </Screen>
    );
  }

  const act = ACTIVITIES[d.activity] || ACTIVITIES.coffee;
  const start = at(d.dayOffset, d.time);

  const publish = () => {
    setPublishing(true);
    timer.current = setTimeout(() => {
      const id = createPlan(d);
      haptic(25);
      nav.replace(`/plan/${id}/published`);
      setTimeout(() => toast.show({ title: 'Your plan is live!', body: 'We’ll let you know when people request to join.', icon: 'check' }), 900);
    }, 650);
  };

  return (
    <Screen
      softGlow
      header={
        <div className="create-head">
          <TopBar back backTo="/create" center={<span className="topbar-title">Review your plan</span>} />
          <div className="create-progress">
            <p>
              <span className="t-accent">Step 2 of 2</span> · Review your plan
            </p>
            <ProgressBar value={1} from={0.5} />
          </div>
        </div>
      }
      footer={
        <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={publish} disabled={publishing}>
          {publishing ? <span className="spinner" /> : null}
          {publishing ? 'Publishing…' : 'Publish plan'}
        </button>
      }
    >
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="review-hero">
          <Img src={act.people || act.cover} alt="" activity={d.activity} style={{ position: 'absolute', inset: 0 }} scrim eager />
          <motion.h2 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            {d.title}
          </motion.h2>
        </motion.div>

        <motion.div variants={fadeUp} className="group info-rows mt-16">
          <div className="list-row">
            <CalendarDays className="row-icon" size={21} strokeWidth={2.1} />
            <span className="row-text">{formatWhen(start)}</span>
          </div>
          <div className="list-row">
            <MapPin className="row-icon" size={21} strokeWidth={2.1} />
            <span className="row-text">
              {venue.name}
              <small>
                {venue.custom ? `Your own place · ${venue.area}` : `${venue.area} · ${venue.km} km`}
              </small>
            </span>
          </div>
          <div className="list-row">
            <Users className="row-icon" size={21} strokeWidth={2.1} />
            <span className="row-text">
              {d.spots} open spot{d.spots === 1 ? '' : 's'}
            </span>
          </div>
          <div className="list-row">
            <span className="row-icon">
              <span className="aud-dot" />
            </span>
            <span className="row-text">{d.audience === 'friends' ? 'Friends only' : 'People nearby'}</span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="row between mt-24">
          <h3 className="t-h3">About</h3>
          <button type="button" className="link-accent" onClick={() => nav.back('/create')}>
            <Pencil size={15} strokeWidth={2.4} /> Edit details
          </button>
        </motion.div>
        <motion.p variants={fadeUp} className="t-body mt-8">
          {d.about || act.defaultAbout}
        </motion.p>

        <motion.div variants={fadeUp} className="note mt-20">
          <Users size={21} strokeWidth={2.1} />
          People request to join. You decide who comes.
        </motion.div>
      </motion.div>
    </Screen>
  );
}
