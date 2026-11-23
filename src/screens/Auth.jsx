import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Check, Lock, MessageSquareText, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';

function formatPhone(digits) {
  const d = digits.slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

/** 02 — Sign up / Log in with a mobile number */
export function AuthPhone() {
  const nav = useNav();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'login' ? 'login' : 'signup';
  const [digits, setDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = /^[6-9]\d{9}$/.test(digits);
  const shake = useAnimationControls();

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) {
      shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
      return;
    }
    nav.go(`/auth/verify?mode=${mode}`, { state: { phone: digits } });
  };

  return (
    <Screen
      header={<TopBar back backTo="/welcome" center={<Logo size={22} />} />}
      footer={
        <button type="submit" form="phone-form" className={cx('btn btn-primary btn-block btn-lg', valid && 'shine')} disabled={!digits}>
          Continue
        </button>
      }
    >
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-12">
          {mode === 'login' ? 'Welcome back' : 'Let’s get you started'}
        </motion.h1>
        <motion.p variants={fadeUp} className="t-body mt-8">
          Enter your mobile number. We’ll text you a code to {mode === 'login' ? 'log you in' : 'verify it’s you'}.
        </motion.p>

        <motion.form id="phone-form" variants={fadeUp} onSubmit={submit} className="mt-28" noValidate>
          <label className="field-label" htmlFor="phone">
            Mobile number
          </label>
          <motion.div className="phone-input" animate={shake}>
            <span className="phone-cc">
              <span aria-hidden="true">🇮🇳</span> +91
            </span>
            <input
              id="phone"
              className="input"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={formatPhone(digits)}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={() => setTouched(true)}
              autoFocus
            />
          </motion.div>
          <AnimatePresence>
            {touched && digits && !valid && (
              <motion.p className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                Enter a valid 10-digit Indian mobile number.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>

        <motion.div variants={fadeUp} className="note mt-20">
          <ShieldCheck size={20} strokeWidth={2.2} />
          Your number is never shown to other members.
        </motion.div>

        <motion.p variants={fadeUp} className="t-cap mt-20" style={{ lineHeight: 1.6 }}>
          By continuing you agree to our{' '}
          <button type="button" className="text-link" style={{ fontSize: 'inherit' }} onClick={() => nav.go('/legal/terms')}>
            Terms
          </button>{' '}
          and{' '}
          <button type="button" className="text-link" style={{ fontSize: 'inherit' }} onClick={() => nav.go('/legal/privacy')}>
            Privacy Policy
          </button>
          .
        </motion.p>
      </motion.div>
    </Screen>
  );
}

/** 02 — Verify the code */
export function AuthVerify() {
  const nav = useNav();
  const location = useLocation();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'login' ? 'login' : 'signup';
  const phone = location.state?.phone || '9876543210';
  const { state, startSession } = useStore();
  const toast = useToast();
  const [code, setCode] = useState(['', '', '', '']);
  const [status, setStatus] = useState('idle'); // idle | checking | done
  const [seconds, setSeconds] = useState(30);
  const inputs = useRef([]);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const verify = (digits) => {
    setStatus('checking');
    const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
    later(() => {
      setStatus('done');
      later(() => {
        startSession(phone);
        if (mode === 'login' && state.session.onboarded) {
          toast.show({ title: `Welcome back${state.user.name ? `, ${state.user.name.split(' ')[0]}` : ''}!`, icon: 'heart' });
          nav.replace('/home');
        } else {
          nav.replace('/setup/profile');
        }
      }, 650);
    }, 900);
    return digits;
  };

  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, '');
    if (!clean) {
      const next = [...code];
      next[i] = '';
      setCode(next);
      return;
    }
    const next = [...code];
    // support pasting all four digits
    clean
      .slice(0, 4 - i)
      .split('')
      .forEach((d, k) => {
        next[i + k] = d;
      });
    setCode(next);
    const filled = next.findIndex((x) => !x);
    if (filled === -1) {
      inputs.current[3]?.blur();
      verify(next.join(''));
    } else {
      inputs.current[Math.min(filled, 3)]?.focus();
    }
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const next = [...code];
      next[i - 1] = '';
      setCode(next);
    }
  };

  const masked = `+91 ${phone.slice(0, 2)}•••••${phone.slice(-3)}`;

  return (
    <Screen header={<TopBar back backTo="/auth" center={<Logo size={22} />} />}>
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="verify-ic mt-12">
          <MessageSquareText size={26} strokeWidth={2.2} />
        </motion.div>
        <motion.h1 variants={fadeUp} className="t-h1 mt-16">
          Enter the code
        </motion.h1>
        <motion.p variants={fadeUp} className="t-body mt-8">
          We sent a 4-digit code to <strong style={{ color: 'var(--text)' }}>{masked}</strong>.
        </motion.p>

        <motion.div variants={fadeUp} className="otp mt-28">
          {code.map((d, i) => (
            <motion.input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              className={cx('otp-box', d && 'filled', status === 'done' && 'ok')}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1}`}
              value={d}
              disabled={status !== 'idle'}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              animate={d ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.p key="hint" className="t-cap mt-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Demo: any 4 digits will work.
            </motion.p>
          )}
          {status === 'checking' && (
            <motion.p key="chk" className="verify-state mt-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="spinner" /> Verifying…
            </motion.p>
          )}
          {status === 'done' && (
            <motion.p key="ok" className="verify-state ok mt-16" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Check size={18} strokeWidth={3} /> Verified
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div variants={fadeUp} className="row between mt-28">
          <span className="t-sub">Didn’t get it?</span>
          <button
            type="button"
            className="text-link"
            disabled={seconds > 0}
            style={{ opacity: seconds > 0 ? 0.5 : 1 }}
            onClick={() => {
              setSeconds(30);
              toast.show({ title: 'New code sent', body: `Check your messages on ${masked}`, icon: 'chat' });
            }}
          >
            {seconds > 0 ? `Resend in 0:${String(seconds).padStart(2, '0')}` : 'Resend code'}
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="note mt-24">
          <Lock size={19} strokeWidth={2.2} />
          Fryyday will never ask for this code in chat.
        </motion.div>
      </motion.div>
    </Screen>
  );
}
