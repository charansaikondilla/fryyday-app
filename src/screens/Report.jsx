import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getPerson, useStore } from '../context/StoreContext';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, firstName } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Avatar, Checkbox, Radio } from '../components/ui';
import { SuccessTick } from '../components/Illustrations';

const REASONS = ['Spam', 'Harassment', 'Misleading profile', 'Unsafe behaviour', 'Other'];

/** 23 — Report */
export default function Report() {
  const nav = useNav();
  const [params] = useSearchParams();
  const { state, report } = useStore();
  const personId = params.get('person');
  const planId = params.get('plan');
  const urgent = params.get('urgent') === '1';
  const person = personId ? getPerson(state, personId) : null;
  const plan = planId ? state.plans[planId] : null;
  const [reason, setReason] = useState(urgent ? 'Unsafe behaviour' : 'Harassment');
  const [details, setDetails] = useState('');
  const [block, setBlock] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = () => {
    report({ personId, planId, reason, details: details.trim(), block: block && Boolean(personId), urgent });
    setSent(true);
  };

  return (
    <Screen
      header={<TopBar back center={<Logo size={22} />} />}
      footer={
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.button key="done" type="button" className="btn btn-primary btn-block btn-lg" onClick={() => nav.back('/home')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              Done
            </motion.button>
          ) : (
            <motion.div key="submit" className="col gap-8" style={{ alignItems: 'center' }} exit={{ opacity: 0 }}>
              <button type="button" className="btn btn-primary btn-block btn-lg" onClick={submit}>
                Submit report
              </button>
              <p className="t-cap">Reports are reviewed by our team.</p>
            </motion.div>
          )}
        </AnimatePresence>
      }
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="sent" className="col" style={{ alignItems: 'center', textAlign: 'center' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mt-28">
              <SuccessTick size={104} />
            </div>
            <h1 className="t-h1 mt-20">Thanks for telling us</h1>
            <p className="t-body mt-8">
              Our safety team will review this {urgent ? 'right away' : 'within 24 hours'}.
              {block && person ? ` ${firstName(person.name)} has been blocked.` : ''}
            </p>
            {urgent && <div className="note accent mt-20">If you are in immediate danger, call 112.</div>}
          </motion.div>
        ) : (
          <motion.div key="form" variants={stagger(0.05)} initial="hidden" animate="show" exit={{ opacity: 0 }}>
            <motion.h1 variants={fadeUp} className="t-h1 mt-4">
              {urgent ? 'Report an urgent concern' : 'Report'}
            </motion.h1>
            {(person || plan) && (
              <motion.div variants={fadeUp} className="card card-pad row gap-12 mt-16">
                {person && <Avatar person={person} size={42} />}
                <span className="grow" style={{ minWidth: 0 }}>
                  <strong className="ellipsis" style={{ display: 'block' }}>
                    {person ? person.name : plan.title}
                  </strong>
                  {plan && person && <small className="t-cap">{plan.title}</small>}
                </span>
              </motion.div>
            )}
            <motion.h3 variants={fadeUp} className="t-h4 mt-20 mb-12">
              Reason for reporting
            </motion.h3>
            <div className="list" style={{ gap: 8 }}>
              {REASONS.map((r) => (
                <motion.button variants={fadeUp} key={r} type="button" className={cx('option-row', reason === r && 'is-on')} onClick={() => setReason(r)} style={{ minHeight: 48 }}>
                  <Radio on={reason === r} />
                  <span className="grow">{r}</span>
                </motion.button>
              ))}
            </div>
            <motion.label variants={fadeUp} className="field mt-20">
              <span className="field-label">
                Details <small>(optional)</small>
              </span>
              <textarea className="input textarea" rows={3} placeholder="Add a few details…" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} />
            </motion.label>
            {person && (
              <motion.button variants={fadeUp} type="button" className="row gap-12 mt-16" onClick={() => setBlock((b) => !b)} style={{ fontSize: 15.5, fontWeight: 600 }}>
                <Checkbox on={block} />
                Also block this member
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}
