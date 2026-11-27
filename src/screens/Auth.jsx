import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Check, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { MIN_PASSWORD, passwordProblem } from '../lib/accounts';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, firstName, haptic } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Segmented } from '../components/ui';

function formatPhone(digits) {
  const d = digits.slice(0, 10);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)} ${d.slice(5)}`;
}

const MODES = [
  { value: 'signup', label: 'Sign up' },
  { value: 'login', label: 'Log in' },
];

/** Password input with a show / hide eye. */
export function PasswordInput({ id, value, onChange, placeholder, autoComplete, invalid, onBlur }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap pw-wrap">
      <Lock size={19} strokeWidth={2.2} />
      <input
        id={id}
        className={cx('input', invalid && 'is-invalid')}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        maxLength={64}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
      />
      <button type="button" className="pw-eye" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={19} strokeWidth={2.2} /> : <Eye size={19} strokeWidth={2.2} />}
      </button>
    </div>
  );
}

/** Live checklist under "Create a password". */
export function PasswordRules({ value }) {
  const rules = [
    { ok: value.length >= MIN_PASSWORD, label: `${MIN_PASSWORD}+ characters` },
    { ok: /[A-Za-z]/.test(value), label: 'A letter' },
    { ok: /\d/.test(value), label: 'A number' },
  ];
  return (
    <div className="pw-rules">
      {rules.map((r) => (
        <span key={r.label} className={cx('pw-rule', r.ok && 'ok')}>
          <span className="pw-rule-dot">{r.ok && <Check size={11} strokeWidth={3.4} />}</span>
          {r.label}
        </span>
      ))}
    </div>
  );
}

/** 02 — Sign up / Log in with mobile number + password */
export function AuthPhone() {
  const nav = useNav();
  const toast = useToast();
  const { signUp, logIn } = useStore();
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'login' ? 'login' : 'signup';
  const [digits, setDigits] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // { phone, password }
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const phoneOk = /^[6-9]\d{9}$/.test(digits);
  const pwOk = mode === 'login' ? password.length > 0 : !passwordProblem(password);

  const switchMode = (m) => {
    setErrors({});
    setParams({ mode: m }, { replace: true });
  };

  const fail = (errs) => {
    setErrors(errs);
    haptic(20);
    shake.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
  };

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    const errs = {};
    if (!phoneOk) errs.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (mode === 'login' && !password) errs.password = 'Enter your password.';
    if (mode === 'signup' && passwordProblem(password)) errs.password = passwordProblem(password);
    if (errs.phone || errs.password) return fail(errs);

    setBusy(true);
    timer.current = setTimeout(() => {
      const res = mode === 'signup' ? signUp(digits, password) : logIn(digits, password);
      setBusy(false);
      if (!res.ok) {
        fail({ [res.field]: res.error });
        return;
      }
      haptic(18);
      if (mode === 'login' && res.onboarded) {
        toast.show({ title: `Welcome back${res.name ? `, ${firstName(res.name)}` : ''}!`, icon: 'heart' });
        nav.replace('/home');
      } else {
        if (mode === 'signup') toast.show({ title: 'Account created', body: 'Now let’s set up your profile.', icon: 'check' });
        nav.replace('/setup/profile');
      }
    }, 450);
  };

  return (
    <Screen
      header={<TopBar back backTo="/welcome" center={<Logo size={22} />} />}
      footer={
        <button type="submit" form="auth-form" className={cx('btn btn-primary btn-block btn-lg', phoneOk && pwOk && 'shine')} disabled={busy}>
          {busy && <span className="spinner" />}
          {busy ? (mode === 'login' ? 'Logging in…' : 'Creating account…') : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      }
    >
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="mt-8">
          <Segmented value={mode} onChange={switchMode} options={MODES} />
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
            <h1 className="t-h1 mt-24">{mode === 'login' ? 'Welcome back' : 'Let’s get you started'}</h1>
            <p className="t-body mt-8">
              {mode === 'login' ? 'Log in with your mobile number and password.' : 'Create your account with your mobile number and a password.'}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.form id="auth-form" variants={fadeUp} onSubmit={submit} className="mt-24" noValidate>
          <motion.div animate={shake}>
            <label className="field-label" htmlFor="phone">
              Mobile number
            </label>
            <div className="phone-input">
              <span className="phone-cc">
                <span aria-hidden="true">🇮🇳</span> +91
              </span>
              <input
                id="phone"
                className={cx('input', errors.phone && 'is-invalid')}
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                value={formatPhone(digits)}
                onChange={(e) => {
                  setDigits(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (errors.phone) setErrors((x) => ({ ...x, phone: '' }));
                }}
                aria-invalid={!!errors.phone || undefined}
                autoFocus
              />
            </div>
            <AnimatePresence>
              {errors.phone && (
                <motion.p className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {errors.phone}
                  {/Sign up|Log in/.test(errors.phone) && (
                    <>
                      {' '}
                      <button type="button" className="text-link" style={{ fontSize: 'inherit' }} onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                      </button>
                    </>
                  )}
                </motion.p>
              )}
            </AnimatePresence>

            <label className="field-label mt-20" htmlFor="password" style={{ display: 'block' }}>
              {mode === 'login' ? 'Password' : 'Create a password'}
            </label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (errors.password) setErrors((x) => ({ ...x, password: '' }));
              }}
              placeholder={mode === 'login' ? 'Your password' : 'At least 6 characters'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              invalid={!!errors.password}
            />
            {mode === 'signup' && <PasswordRules value={password} />}
            <AnimatePresence>
              {errors.password && (
                <motion.p className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {errors.password}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
          {/* lets the keyboard "Go" key submit */}
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </motion.form>

        <motion.div variants={fadeUp} className="note mt-24">
          <ShieldCheck size={20} strokeWidth={2.2} />
          Your number is never shown to other members.
        </motion.div>
        <motion.div variants={fadeUp} className="note mt-10">
          <KeyRound size={20} strokeWidth={2.2} />
          Your password is stored only as a secure hash on this device.
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
