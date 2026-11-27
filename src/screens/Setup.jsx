import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, Lock, MapPin, Navigation, Trash2 } from 'lucide-react';
import { INTERESTS, ACTIVITIES } from '../data/catalog';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, pop, stagger } from '../lib/motion';
import { cx, firstName, initials, resizeImageFile } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Sheet, Steps } from '../components/ui';
import { ACTIVITY_ICONS } from '../components/icons';
import { CityPin } from '../components/Illustrations';
import { AreaSheet } from '../components/Sheets';

const STEP_NAMES = ['About you', 'Interests', 'Your area'];
const STEP_PATHS = ['/welcome', '/setup/profile', '/setup/interests'];

function SetupHeader({ step }) {
  return (
    <TopBar
      back
      // Previous screen in history; if the app was reopened mid-setup there is none, so go to the previous step.
      backTo={STEP_PATHS[step - 1]}
      center={<Logo size={22} />}
      className="setup-top"
      right={<span className="t-cap">{step}/3</span>}
    />
  );
}

function StepLabel({ step }) {
  return (
    <p className="setup-step-label">
      <span className="t-accent">Step {step} of 3</span> · {STEP_NAMES[step - 1]}
    </p>
  );
}

/* --------------------------------------------------------------------------
   Name & photo
   -------------------------------------------------------------------------- */
export function SetupProfile() {
  const nav = useNav();
  const { state, updateUser } = useStore();
  const toast = useToast();
  const [name, setName] = useState(state.user.name || '');
  const [bio, setBio] = useState(state.user.bio || '');
  const [photo, setPhoto] = useState(state.user.photo || null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const [touched, setTouched] = useState(false);
  const clean = name.trim();
  const nameError = !clean ? 'Enter your name to continue.' : clean.length < 2 ? 'Name needs at least 2 letters.' : !/\p{L}/u.test(clean) ? 'Use letters in your name.' : '';
  const valid = !nameError;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      setPhoto(await resizeImageFile(file));
    } catch (err) {
      toast.show({ title: 'Couldn’t use that photo', body: err.message, icon: 'alert', tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setTouched(true);
    if (!valid || busy) return;
    updateUser({ name: clean.replace(/\s+/g, ' '), bio: bio.trim(), photo, setupStep: Math.max(2, state.user.setupStep || 0) });
    nav.go('/setup/interests');
  };

  return (
    <Screen
      header={
        <div className="setup-head">
          <SetupHeader step={1} />
          <div className="setup-steps">
            <Steps total={3} current={1} />
          </div>
        </div>
      }
      footer={
        <button type="button" className={cx('btn btn-primary btn-block btn-lg', valid && 'shine')} disabled={busy} onClick={next}>
          Continue
        </button>
      }
    >
      <motion.div variants={stagger(0.07)} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <StepLabel step={1} />
        </motion.div>
        <motion.h1 variants={fadeUp} className="t-h1 mt-8">
          Add your name and photo
        </motion.h1>
        <motion.p variants={fadeUp} className="t-body mt-8">
          This is how people will see you on plans.
        </motion.p>

        <motion.div variants={pop} className="photo-pick">
          <button type="button" className="photo-pick-btn" onClick={() => fileRef.current?.click()} aria-label="Add a profile photo">
            <AnimatePresence mode="wait">
              {photo ? (
                <motion.img key="img" src={photo} alt="Your profile" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} />
              ) : (
                <motion.span key="mono" className="photo-pick-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {name.trim() ? initials(name) : <Camera size={34} strokeWidth={2} />}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="photo-pick-badge">{busy ? <span className="spinner" /> : <Camera size={17} strokeWidth={2.4} />}</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <div className="row gap-8 mt-12">
            <button type="button" className="btn btn-soft btn-xs" onClick={() => fileRef.current?.click()}>
              {photo ? 'Change photo' : 'Upload photo'}
            </button>
            {photo && (
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setPhoto(null)}>
                <Trash2 size={14} strokeWidth={2.4} /> Remove
              </button>
            )}
          </div>
        </motion.div>

        <motion.label variants={fadeUp} className="field mt-8">
          <span className="field-label">Your name</span>
          <input
            className={cx('input', touched && nameError && 'is-invalid')}
            placeholder="e.g. Ananya Rao"
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => clean && setTouched(true)}
            onKeyDown={(e) => e.key === 'Enter' && next()}
            autoComplete="name"
            enterKeyHint="next"
            aria-invalid={(touched && !!nameError) || undefined}
          />
          <AnimatePresence>
            {touched && nameError && (
              <motion.span className="field-error" role="alert" style={{ display: 'block' }} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {nameError}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="t-cap" style={{ display: 'block', marginTop: 6 }}>
            Photo is optional — you can add it later.
          </span>
        </motion.label>
        <motion.label variants={fadeUp} className="field">
          <span className="field-label">
            Short bio <small>optional</small>
          </span>
          <input className="input" placeholder="Coffee, long walks & good company." value={bio} maxLength={80} onChange={(e) => setBio(e.target.value)} />
        </motion.label>
      </motion.div>
    </Screen>
  );
}

/* --------------------------------------------------------------------------
   07 — Your interests
   -------------------------------------------------------------------------- */
export function SetupInterests() {
  const nav = useNav();
  const { state, updateUser } = useStore();
  const [picked, setPicked] = useState(() => state.user.interests || []);
  const valid = picked.length >= 3;

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Screen
      header={
        <div className="setup-head">
          <SetupHeader step={2} />
          <div className="setup-steps">
            <Steps total={3} current={2} />
          </div>
        </div>
      }
      footer={
        <div className="col gap-12" style={{ alignItems: 'center' }}>
          <motion.p key={picked.length} className="pick-count" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {valid ? `${picked.length} selected · looking good!` : `${picked.length} selected · pick ${3 - picked.length} more`}
          </motion.p>
          <button
            type="button"
            className={cx('btn btn-primary btn-block btn-lg', valid && 'shine')}
            disabled={!valid}
            onClick={() => {
              updateUser({ interests: picked, setupStep: 3 });
              nav.go('/setup/area');
            }}
          >
            Continue
          </button>
        </div>
      }
    >
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="t-center">
          <StepLabel step={2} />
        </motion.div>
        <motion.h1 variants={fadeUp} className="t-h1 mt-8 t-center">
          What brings you out?
        </motion.h1>
        <motion.p variants={fadeUp} className="t-body mt-8 t-center">
          Pick at least 3 — we’ll show you plans you’ll actually enjoy.
        </motion.p>
        <div className="interest-grid mt-24">
          {INTERESTS.map((id) => {
            const Icon = ACTIVITY_ICONS[id];
            const on = picked.includes(id);
            return (
              <motion.button
                key={id}
                variants={pop}
                type="button"
                whileTap={{ scale: 0.93 }}
                className={cx('interest', on && 'is-on')}
                onClick={() => toggle(id)}
                aria-pressed={on}
              >
                <AnimatePresence>
                  {on && (
                    <motion.span
                      className="interest-check"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                    >
                      <Check size={14} strokeWidth={3.4} />
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.span animate={{ scale: on ? 1.1 : 1, y: on ? -2 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                  <Icon size={34} strokeWidth={1.8} />
                </motion.span>
                <span>{ACTIVITIES[id].label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </Screen>
  );
}

/* --------------------------------------------------------------------------
   08 — Your area
   -------------------------------------------------------------------------- */
export function SetupArea() {
  const nav = useNav();
  const toast = useToast();
  const { state, updateUser, completeOnboarding } = useStore();
  const [locating, setLocating] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const done = useRef(false);
  const finish = (area, how) => {
    if (done.current) return;
    done.current = true;
    updateUser({ area, city: 'Hyderabad' });
    completeOnboarding();
    nav.replace('/home');
    setTimeout(() => {
      toast.show({
        title: `You’re all set, ${firstName(state.user.name) || 'friend'}! 🎉`,
        body: how === 'gps' ? `Showing plans around ${area}.` : `Showing plans around ${area}. You can change it anytime in your profile.`,
        icon: 'heart',
        duration: 4800,
      });
    }, 450);
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setAreaOpen(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        // Only the area is kept — the precise position is never stored or shared.
        finish('Jubilee Hills', 'gps');
      },
      (err) => {
        setLocating(false);
        toast.show({
          title: err && err.code === 1 ? 'Location is turned off' : 'Couldn’t find your location',
          body: 'No problem — pick your area instead. It only takes a second.',
          icon: 'alert',
        });
        setAreaOpen(true);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <Screen
      header={
        <div className="setup-head">
          <SetupHeader step={3} />
          <div className="setup-steps">
            <Steps total={3} current={3} />
          </div>
        </div>
      }
      footer={
        <div className="col gap-12">
          <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={locateMe} disabled={locating}>
            {locating ? <span className="spinner" /> : <Navigation size={19} strokeWidth={2.4} />}
            {locating ? 'Finding your area…' : 'Use my location'}
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => setAreaOpen(true)}>
            Choose area manually
          </button>
          <button type="button" className="text-link t-center" style={{ fontSize: 14 }} onClick={() => setInfoOpen(true)}>
            Location settings
          </button>
        </div>
      }
    >
      <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <StepLabel step={3} />
        </motion.div>
        <motion.div variants={fadeUp} className="row center mt-4">
          <CityPin size={280} />
        </motion.div>
        <motion.h1 variants={fadeUp} className="t-display mt-12" style={{ fontSize: 38 }}>
          Find plans
          <br />
          around you.
        </motion.h1>
        <motion.p variants={fadeUp} className="t-body mt-8">
          Use your location to discover nearby plans.
        </motion.p>
        <motion.div variants={fadeUp} className="note mt-16">
          <Lock size={20} strokeWidth={2.2} />
          Your precise location is not shown to other members.
        </motion.div>
      </motion.div>

      <AreaSheet
        open={areaOpen}
        onClose={() => setAreaOpen(false)}
        value={state.user.area}
        onPick={(a) => {
          setAreaOpen(false);
          finish(a, 'manual');
        }}
      />
      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="How we use location">
        <div className="list">
          <div className="note">
            <MapPin size={20} strokeWidth={2.2} />
            We only keep your area (like “Jubilee Hills”) to suggest plans nearby.
          </div>
          <div className="note">
            <Lock size={20} strokeWidth={2.2} />
            Your exact position is never stored or shown on the map.
          </div>
        </div>
        <button type="button" className="btn btn-primary btn-block mt-16" onClick={() => setInfoOpen(false)}>
          Got it
        </button>
      </Sheet>
    </Screen>
  );
}
