import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { CalendarCheck, CalendarDays, ChevronDown, Clock, FileText, Info, MapPin, MessageCircle, Users } from 'lucide-react';
import { getPerson, myRole, useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { at, daysFromToday, formatDateLong, formatDay, formatTime, hhmm } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { firstName } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Img, Stepper } from '../components/ui';
import { Burst } from '../components/Illustrations';
import { DateSheet, TimeSheet, VenueSheet } from '../components/Sheets';
import { NotFound } from './PlanDetails';

/** 31 — Edit plan (host) */
export function EditPlan() {
  const { id } = useParams();
  const nav = useNav();
  const toast = useToast();
  const { state, updatePlan } = useStore();
  const plan = state.plans[id];
  const [dayOffset, setDayOffset] = useState(() => (plan ? Math.max(0, daysFromToday(plan.start)) : 0));
  const [time, setTime] = useState(() => (plan ? hhmm(plan.start) : '17:30'));
  const [venue, setVenue] = useState(plan?.venue || '');
  const [capacity, setCapacity] = useState(plan?.capacity || 4);
  const [about, setAbout] = useState(plan?.about || '');
  const [sheet, setSheet] = useState(null);
  const start = useMemo(() => at(dayOffset, time), [dayOffset, time]);

  if (!plan) return <NotFound />;
  if (myRole(state, plan) !== 'host') {
    return <NotFound what="plan to edit" />;
  }

  const minCap = Math.max(1, plan.attendees.length);
  const dirty = start !== plan.start || venue !== plan.venue || capacity !== plan.capacity || about.trim() !== plan.about;

  const save = () => {
    const notified = updatePlan(id, { start, venue, capacity, about: about.trim() });
    toast.show({
      title: 'Changes saved',
      body: notified ? `${notified} ${notified === 1 ? 'person was' : 'people were'} notified.` : 'Your plan is up to date.',
      icon: 'check',
    });
    nav.back(`/plan/${id}`);
  };

  return (
    <Screen
      header={<TopBar back backTo={`/plan/${id}`} center={<Logo size={22} />} />}
      footer={
        <button type="button" className="btn btn-primary btn-block btn-lg" disabled={!dirty} onClick={save}>
          Save changes
        </button>
      }
    >
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Edit Plan
        </motion.h1>
        <motion.div variants={fadeUp} className="edit-hero mt-16">
          <Img src={plan.image} alt="" activity={plan.activity} style={{ position: 'absolute', inset: 0 }} />
          <span className="edit-hero-shade" />
          <strong>{plan.title}</strong>
        </motion.div>

        <div className="list mt-16" style={{ gap: 10 }}>
          <motion.button variants={fadeUp} type="button" className="edit-row" onClick={() => setSheet('date')}>
            <CalendarDays size={20} strokeWidth={2.2} />
            <span className="edit-label">Date</span>
            <span className="edit-value">{formatDateLong(start)}</span>
            <ChevronDown size={18} className="t-muted" />
          </motion.button>
          <motion.button variants={fadeUp} type="button" className="edit-row" onClick={() => setSheet('time')}>
            <Clock size={20} strokeWidth={2.2} />
            <span className="edit-label">Time</span>
            <span className="edit-value">{formatTime(start)}</span>
            <ChevronDown size={18} className="t-muted" />
          </motion.button>
          <motion.button variants={fadeUp} type="button" className="edit-row" onClick={() => setSheet('venue')}>
            <MapPin size={20} strokeWidth={2.2} />
            <span className="edit-label">Public venue</span>
            <span className="edit-value ellipsis">{venue}</span>
            <ChevronDown size={18} className="t-muted" />
          </motion.button>
          <motion.div variants={fadeUp} className="edit-row">
            <Users size={20} strokeWidth={2.2} />
            <span className="edit-label">Capacity</span>
            <span className="grow" />
            <Stepper value={capacity} min={minCap} max={30} onChange={setCapacity} />
          </motion.div>
          <motion.label variants={fadeUp} className="edit-desc">
            <span className="row gap-10 edit-label">
              <FileText size={20} strokeWidth={2.2} /> Description
            </span>
            <textarea className="input textarea mt-8" rows={3} value={about} maxLength={220} onChange={(e) => setAbout(e.target.value)} />
          </motion.label>
        </div>

        <motion.div variants={fadeUp} className="note accent mt-16">
          <Info size={20} strokeWidth={2.2} />
          Attendees will be notified when time or place changes.
        </motion.div>
      </motion.div>

      <DateSheet
        open={sheet === 'date'}
        onClose={() => setSheet(null)}
        value={dayOffset}
        onPick={(v) => {
          setDayOffset(v);
          setSheet(null);
        }}
      />
      <TimeSheet
        open={sheet === 'time'}
        onClose={() => setSheet(null)}
        value={time}
        onPick={(v) => {
          setTime(v);
          setSheet(null);
        }}
      />
      <VenueSheet
        open={sheet === 'venue'}
        onClose={() => setSheet(null)}
        activity={plan.activity}
        value={venue}
        onPick={(v) => {
          setVenue(v);
          setSheet(null);
        }}
      />
    </Screen>
  );
}

/** 32 — Plan change notice (attendees) */
export function PlanChange() {
  const { id } = useParams();
  const nav = useNav();
  const { state } = useStore();
  const plan = state.plans[id];
  if (!plan) return <NotFound />;
  const host = getPerson(state, plan.hostId);
  const change = plan.change || { field: 'venue', from: plan.venue, to: plan.venue };
  const isVenue = change.field === 'venue';

  return (
    <Screen
      header={<TopBar back center={<Logo size={22} />} />}
      footer={
        <div className="col gap-10">
          <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={() => nav.go(`/plan/${id}`)}>
            View updated plan
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => nav.go(plan.chatId ? `/chat/${plan.chatId}` : `/person/${host.id}`)}>
            <MessageCircle size={19} strokeWidth={2.3} /> Message host
          </button>
        </div>
      }
    >
      <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Plan Updated
        </motion.h1>
        <motion.div variants={fadeUp} className="row center mt-8">
          <Burst icon={CalendarCheck} size={86} stroke={1.9} />
        </motion.div>
        <motion.h2 variants={fadeUp} className="t-h2 t-center">
          {isVenue ? 'The venue has changed.' : 'The time has changed.'}
        </motion.h2>
        <motion.p variants={fadeUp} className="t-sub t-center mt-8">
          {firstName(host.name)} updated <strong style={{ color: 'var(--text)' }}>{plan.title}</strong>.
        </motion.p>

        <motion.div variants={fadeUp} className="change-card mt-20">
          {isVenue ? (
            <>
              <div className="change-line">
                <MapPin size={20} strokeWidth={2.2} className="t-accent" />
                <span>
                  <small>Old venue</small>
                  <motion.s initial={{ textDecorationColor: 'transparent' }} animate={{ textDecorationColor: 'currentColor' }} transition={{ delay: 0.7 }} className="t-muted">
                    {change.from}
                  </motion.s>
                </span>
              </div>
              <motion.div className="change-line" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
                <MapPin size={20} strokeWidth={2.2} className="t-accent" />
                <span>
                  <small>New venue</small>
                  <strong className="change-new">{change.to}</strong>
                  <small>{plan.area}</small>
                </span>
              </motion.div>
            </>
          ) : (
            <>
              <div className="change-line">
                <Clock size={20} strokeWidth={2.2} className="t-accent" />
                <span>
                  <small>Was</small>
                  <s className="t-muted">
                    {formatDay(change.from)}, {formatTime(change.from)}
                  </s>
                </span>
              </div>
              <div className="change-line">
                <Clock size={20} strokeWidth={2.2} className="t-accent" />
                <span>
                  <small>Now</small>
                  <strong className="change-new">
                    {formatDay(change.to)}, {formatTime(change.to)}
                  </strong>
                </span>
              </div>
            </>
          )}
          <div className="change-meta">
            <span>
              <CalendarDays size={18} strokeWidth={2.2} />
              <span>
                <small>Date</small>
                <strong>{formatDay(plan.start, { long: true })}</strong>
              </span>
            </span>
            <span>
              <Clock size={18} strokeWidth={2.2} />
              <span>
                <small>Time</small>
                <strong>{formatTime(plan.start)}</strong>
              </span>
            </span>
          </div>
        </motion.div>
      </motion.div>
    </Screen>
  );
}
