import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Globe, Share2, Users } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Steps } from '../components/ui';
import { HighFive } from '../components/Illustrations';
import Confetti from '../components/Confetti';
import { PlanSummary } from '../components/PlanCards';
import { NotFound } from './PlanDetails';
import { ViewCount } from '../components/Vote';
import { formatWhen } from '../lib/dates';

/** 10 — Plan published */
export default function Published() {
  const { id } = useParams();
  const nav = useNav();
  const { state } = useStore();
  const plan = state.plans[id];
  if (!plan) return <NotFound />;

  return (
    <Screen
      header={
        <div>
          <TopBar back backTo="/home" onBack={() => nav.replace('/home')} center={<Logo size={22} />} />
          <div style={{ padding: '0 var(--pad) 6px' }}>
            <Steps total={3} current={3} />
          </div>
        </div>
      }
      footer={
        <div className="col gap-10" style={{ alignItems: 'center' }}>
          <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={() => nav.go(`/plan/${id}/invite`)}>
            <Share2 size={19} strokeWidth={2.4} /> Share invite
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => nav.go(`/plan/${id}`)}>
            View my plan
          </button>
          <button type="button" className="text-link" onClick={() => nav.replace('/home')}>
            Back to home
          </button>
        </div>
      }
    >
      <Confetti fire={1} origin={{ x: 0.5, y: 0.22 }} />
      <motion.div variants={stagger(0.08, 0.2)} initial="hidden" animate="show" className="col" style={{ alignItems: 'center', textAlign: 'center' }}>
        <motion.div variants={fadeUp} style={{ marginTop: 4 }}>
          <HighFive size={270} />
        </motion.div>
        <motion.h1 variants={fadeUp} className="t-h1 mt-8" style={{ fontSize: 34 }}>
          Your plan is live!
        </motion.h1>
        <motion.p variants={fadeUp} className="t-body mt-8" style={{ maxWidth: 300 }}>
          “{plan.title}” is published for {formatWhen(plan.start)}. Share it to get more views and requests.
        </motion.p>
        <motion.div variants={fadeUp} className="publish-meta mt-12">
          <span className="pill pill-accent">
            {plan.audience === 'friends' ? <Users size={14} strokeWidth={2.4} /> : <Globe size={14} strokeWidth={2.4} />}
            {plan.audience === 'friends' ? 'Friends only' : 'Visible nearby'}
          </span>
          <span className="pill pill-muted">
            <ViewCount plan={plan} size={14} />
          </span>
        </motion.div>
      </motion.div>
      <motion.div variants={stagger(0.08, 0.6)} initial="hidden" animate="show" className="mt-20">
        <PlanSummary plan={plan} onClick={() => nav.go(`/plan/${id}`)} />
      </motion.div>
    </Screen>
  );
}
