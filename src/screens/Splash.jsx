import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { useNav } from '../lib/nav';
import Logo from '../components/Logo';

export default function Splash() {
  const { state } = useStore();
  const nav = useNav();
  const target = state.session.loggedIn && state.session.onboarded ? '/home' : state.session.loggedIn ? '/setup/profile' : '/welcome';

  useEffect(() => {
    const t = setTimeout(() => nav.replace(target), 1900);
    return () => clearTimeout(t);
  }, [nav, target]);

  return (
    <div className="screen splash" onClick={() => nav.replace(target)}>
      <div className="splash-orb" aria-hidden="true" />
      <motion.div
        className="splash-logo"
        initial={{ scale: 0.82, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo size={52} variant="auto" animate />
      </motion.div>
      <motion.p
        className="splash-tag"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        Good plans. Great company.
      </motion.p>
      <motion.div className="splash-bar" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 1.5, ease: [0.65, 0, 0.35, 1] }} />
    </div>
  );
}
