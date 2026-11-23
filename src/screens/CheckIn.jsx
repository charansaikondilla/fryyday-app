import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { CalendarDays, ChevronRight, Eye, MapPin, Navigation, Phone, Star, Users } from 'lucide-react';
import { getPerson, myRole, useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatTime, formatWhen } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { firstName, mapsUrl, openExternal } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Avatar, AvatarStack, Img } from '../components/ui';
import { SuccessTick } from '../components/Illustrations';
import Confetti from '../components/Confetti';
import { NotFound } from './PlanDetails';

/** 30 — Meetup check-in (optional) */
export default function CheckIn() {
  const { id } = useParams();
  const nav = useNav();
  const toast = useToast();
  const { state, checkIn, undoCheckIn } = useStore();
  const plan = state.plans[id];
  if (!plan) return <NotFound />;
  const host = getPerson(state, plan.hostId);
  const group = [plan.hostId, ...plan.attendees].map((a) => getPerson(state, a));
  const done = Boolean(state.checkins[id]);
  const role = myRole(state, plan);
  const canCheckIn = role === 'joined' || role === 'host';

  return (
    <Screen
      header={<TopBar back backTo={`/plan/${id}`} center={<Logo size={22} />} />}
      footer={
        <div className="row gap-10">
          <button
            type="button"
            className="btn btn-outline btn-md grow"
            onClick={() => {
              if (!openExternal(mapsUrl(`${plan.venue}, ${plan.area}, Hyderabad`))) toast.show({ title: 'Pop-up blocked', body: 'Allow pop-ups to open directions.', icon: 'alert' });
            }}
          >
            <Navigation size={18} strokeWidth={2.3} /> Directions
          </button>
          <button type="button" className="btn btn-outline btn-md grow" onClick={() => nav.go(plan.chatId ? `/chat/${plan.chatId}` : `/person/${host.id}`)}>
            <Phone size={18} strokeWidth={2.3} /> Contact host
          </button>
        </div>
      }
    >
      {done && <Confetti fire={state.checkins[id]} origin={{ x: 0.5, y: 0.62 }} count={90} />}
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Meetup check-in
        </motion.h1>

        <motion.div variants={fadeUp} className="checkin-hero mt-16">
          <Img src={plan.image} alt="" activity={plan.activity} style={{ position: 'absolute', inset: 0 }} eager />
          <span className="wait-hero-shade" />
          <span className="wait-hero-text">
            <strong>{plan.title}</strong>
            <span>
              <CalendarDays size={15} strokeWidth={2.2} /> {formatWhen(plan.start)}
            </span>
            <span>
              <MapPin size={15} strokeWidth={2.2} /> {plan.venue}, Hyderabad
            </span>
          </span>
        </motion.div>

        <motion.button variants={fadeUp} type="button" className="card card-pad row gap-12 mt-12 pressable" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.go(host.isMe ? '/profile' : `/person/${host.id}`)}>
          <Avatar person={host} size={50} />
          <span className="grow">
            <small className="t-cap">Host</small>
            <strong className="t-h4" style={{ display: 'block' }}>
              {host.isMe ? 'You' : host.name}
            </strong>
          </span>
          <ChevronRight size={20} className="t-muted" />
        </motion.button>

        <motion.button variants={fadeUp} type="button" className="card card-pad row gap-12 mt-12 pressable" style={{ width: '100%' }} onClick={() => plan.chatId && nav.go(`/chat/${plan.chatId}`)}>
          <span className="row gap-8 grow t-h4">
            <Users size={20} strokeWidth={2.2} className="t-accent" />
            Group ({group.length})
          </span>
          <AvatarStack people={group} size={34} max={4} />
          <ChevronRight size={20} className="t-muted" />
        </motion.button>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" className="checkin-done mt-20" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <SuccessTick size={76} />
              <h3 className="t-h2 mt-8">You’re checked in</h3>
              <p className="t-sub mt-4">at {formatTime(state.checkins[id])} · your group can see you’ve arrived.</p>
              <div className="row gap-8 mt-16">
                <button type="button" className="btn btn-soft btn-sm" onClick={() => undoCheckIn(id)}>
                  Undo
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => nav.go(`/plan/${id}/review`)}>
                  <Star size={16} strokeWidth={2.4} /> Rate later
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-20">
              <button
                type="button"
                className="btn btn-primary btn-block btn-lg shine checkin-btn"
                disabled={!canCheckIn}
                onClick={() => {
                  checkIn(id);
                  toast.show({ title: 'Checked in 📍', body: `${firstName(host.name)} and the group know you’re here.`, icon: 'check' });
                }}
              >
                <MapPin size={21} strokeWidth={2.4} />
                I’m here <span style={{ fontWeight: 550, opacity: 0.7, fontSize: 15 }}>(optional)</span>
              </button>
              <p className="row center gap-8 t-sub mt-12">
                <Eye size={17} strokeWidth={2.2} /> Only your group can see your check-in.
              </p>
              {!canCheckIn && <p className="t-cap t-center mt-8">Join the plan to check in.</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Screen>
  );
}
