import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Bell, CalendarDays, MapPin, Users } from 'lucide-react';
import { myRole, useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatWhen } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Img, Sheet } from '../components/ui';
import { Burst } from '../components/Illustrations';
import { NotFound } from './PlanDetails';

/** 29 — Waitlist (only when a plan is full) */
export default function Waitlist() {
  const { id } = useParams();
  const nav = useNav();
  const toast = useToast();
  const { state, leaveWaitlist } = useStore();
  const [confirm, setConfirm] = useState(false);
  const plan = state.plans[id];
  if (!plan) return <NotFound />;
  const role = myRole(state, plan);
  const position = state.waitlist[id] || 2;
  const onList = role === 'waitlist';

  return (
    <Screen
      header={<TopBar back backTo={`/plan/${id}`} center={<Logo size={22} />} />}
      footer={
        onList ? (
          <button type="button" className="btn btn-outline btn-block btn-lg" onClick={() => setConfirm(true)}>
            Leave waitlist
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => nav.go(`/plan/${id}`)}>
            Back to plan
          </button>
        )
      }
    >
      <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Waitlist
        </motion.h1>
        <motion.button variants={fadeUp} type="button" className="wait-hero pressable mt-16" onClick={() => nav.go(`/plan/${id}`)}>
          <Img src={plan.image} alt="" activity={plan.activity} style={{ position: 'absolute', inset: 0 }} />
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
        </motion.button>

        <motion.div variants={fadeUp} className="col mt-24" style={{ alignItems: 'center', textAlign: 'center' }}>
          <Burst icon={Users} size={92} stroke={1.8} />
          <h2 className="t-h2 mt-8">{onList ? 'You’re on the waitlist' : 'You left the waitlist'}</h2>
          {onList && (
            <motion.div className="position-pill mt-16" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 18 }}>
              Position: <strong>{position}</strong>
            </motion.div>
          )}
          <p className="t-body mt-16">{onList ? 'We’ll notify you if a spot opens.' : 'You can rejoin anytime while the plan is open.'}</p>
          {onList && (
            <p className="t-cap row gap-6 mt-8">
              <Bell size={14} /> Notifications are on for this plan
            </p>
          )}
        </motion.div>
      </motion.div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Leave the waitlist?" subtitle="You’ll lose your place in line.">
        <div className="col gap-10">
          <button type="button" className="btn btn-outline btn-block" onClick={() => setConfirm(false)}>
            Stay on waitlist
          </button>
          <button
            type="button"
            className="btn btn-danger btn-block"
            onClick={() => {
              leaveWaitlist(id);
              setConfirm(false);
              toast.show({ title: 'Left the waitlist', body: plan.title, icon: 'check' });
              nav.back(`/plan/${id}`);
            }}
          >
            Leave waitlist
          </button>
        </div>
      </Sheet>
    </Screen>
  );
}
