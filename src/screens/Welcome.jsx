import { motion } from 'framer-motion';
import { ArrowRight, Coffee, Sparkles } from 'lucide-react';
import { setupPath, useStore } from '../context/StoreContext';
import { IMG } from '../data/images';
import { useStatusTone } from '../context/FrameContext';
import { useNav } from '../lib/nav';
import { EASE } from '../lib/motion';
import Logo from '../components/Logo';
import { Img } from '../components/ui';
import { PickleballIcon } from '../components/icons';

const words = (text, delay) =>
  text.split(' ').map((w, i) => (
    <motion.span
      key={`${w}${i}`}
      style={{ display: 'inline-block', marginRight: '0.24em' }}
      initial={{ y: '0.6em', opacity: 0, filter: 'blur(6px)' }}
      animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
      transition={{ delay: delay + i * 0.07, duration: 0.7, ease: EASE }}
    >
      {w}
    </motion.span>
  ));

/** 01 — Welcome and first impression */
export default function Welcome() {
  const nav = useNav();
  const { state, logout } = useStore();
  // Signed up but setup not finished (e.g. went back from step 1): offer to continue instead of signing up again.
  const midSetup = state.session.loggedIn && !state.session.onboarded;
  useStatusTone('light');

  return (
    <div className="screen welcome">
      <div className="welcome-hero">
        <motion.div
          className="welcome-hero-inner"
          initial={{ scale: 1.18 }}
          animate={{ scale: 1.04 }}
          transition={{ duration: 6, ease: 'easeOut' }}
        >
          <Img src={IMG['welcome-hero']} alt="Friends high-fiving over coffee" eager style={{ position: 'absolute', inset: 0 }} />
        </motion.div>
        <div className="welcome-hero-shade" />
        <motion.span
          className="float-chip"
          style={{ left: 18, top: '34%' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
          transition={{ opacity: { delay: 1 }, x: { delay: 1, type: 'spring' }, y: { delay: 1.6, duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <Coffee size={15} strokeWidth={2.4} /> Coffee at 5?
        </motion.span>
        <motion.span
          className="float-chip"
          style={{ right: 18, top: '54%' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
          transition={{ opacity: { delay: 1.2 }, x: { delay: 1.2, type: 'spring' }, y: { delay: 1.9, duration: 4.4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <PickleballIcon size={15} strokeWidth={2.4} /> 3 spots left
        </motion.span>
      </div>

      <div className="welcome-body">
        <motion.div
          className="welcome-logo"
          initial={{ y: 20, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Logo size={34} variant="badge" animate />
        </motion.div>

        <h1 className="welcome-title">
          <span style={{ display: 'block' }}>{words('Good plans.', 0.45)}</span>
          <span style={{ display: 'block' }}>{words('Great company.', 0.62)}</span>
        </h1>
        <motion.p className="welcome-sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6 }}>
          Find people for the things you love.
        </motion.p>

        <motion.div
          className="welcome-actions"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.7, ease: EASE }}
        >
          {midSetup ? (
            <>
              <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={() => nav.go(setupPath(state))}>
                Continue setting up
                <ArrowRight size={19} strokeWidth={2.4} />
              </button>
              <p className="welcome-login">
                Not your number?{' '}
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    logout();
                    nav.go('/auth?mode=signup');
                  }}
                >
                  Use a different one
                </button>
              </p>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={() => nav.go('/auth?mode=signup')}>
                <Sparkles size={19} strokeWidth={2.4} />
                Find my people
              </button>
              <p className="welcome-login">
                Already a member?{' '}
                <button type="button" className="text-link" onClick={() => nav.go('/auth?mode=login')}>
                  Log in
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
