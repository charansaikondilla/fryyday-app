import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ChevronRight, CircleHelp, Lock, MapPin, MonitorSmartphone, Pencil, Settings, Trash2, UsersRound } from 'lucide-react';
import { ACTIVITIES, INTERESTS } from '../data/catalog';
import { myPast, myUpcoming, useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, pop, stagger } from '../lib/motion';
import { cx, resizeImageFile } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Avatar, Segmented } from '../components/ui';
import { PlanRow } from '../components/PlanCards';
import { ACTIVITY_ICONS } from '../components/icons';
import { AreaSheet } from '../components/Sheets';

/** 06 — Profile */
export function Profile() {
  const nav = useNav();
  const { state } = useStore();
  const { pref } = useTheme();
  const [tab, setTab] = useState('upcoming');
  const me = { id: 'me', name: state.user.name || 'You', avatar: state.user.photo };
  const upcoming = myUpcoming(state);
  const past = myPast(state);
  const list = tab === 'upcoming' ? upcoming : past;
  const appearance = pref === 'system' ? 'System' : pref === 'light' ? 'Light' : 'Dark';

  return (
    <Screen
      tabs
      header={
        <TopBar
          left={<Logo size={26} />}
          right={
            <motion.button type="button" className="icon-btn" aria-label="Settings" onClick={() => nav.go('/settings')} whileTap={{ rotate: 60, scale: 0.9 }}>
              <Settings size={24} strokeWidth={2.1} />
            </motion.button>
          }
        />
      }
    >
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.div variants={pop} className="profile-top">
          <div className="profile-av">
            <span className="profile-av-glow" />
            <Avatar person={me} size={122} ring />
          </div>
          <h1 className="t-h2 mt-12">{me.name}</h1>
          <p className="row gap-4 t-sub mt-4">
            <MapPin size={15} strokeWidth={2.3} />
            {state.user.area ? `${state.user.area}, ` : ''}
            {state.user.city}
          </p>
          {state.user.bio && <p className="t-body mt-8 t-center">{state.user.bio}</p>}
          <button type="button" className="btn btn-outline btn-sm mt-16" style={{ paddingInline: 28 }} onClick={() => nav.go('/profile/edit')}>
            <Pencil size={16} strokeWidth={2.3} /> Edit profile
          </button>
        </motion.div>

        <motion.div variants={fadeUp} className="chip-row center-row mt-20">
          {state.user.interests.map((id) => {
            const Icon = ACTIVITY_ICONS[id];
            return (
              <span key={id} className="chip">
                {Icon && <Icon size={17} strokeWidth={2.1} className="t-accent" />}
                {ACTIVITIES[id]?.label}
              </span>
            );
          })}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-20">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'past', label: 'Past' },
            ]}
          />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="list mt-12" variants={stagger(0.06)} initial="hidden" animate="show" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
            {list.map((p) => (
              <PlanRow key={p.id} plan={p} />
            ))}
            {!list.length && (
              <motion.div variants={fadeUp} className="card card-pad t-center">
                <p className="t-sub">{tab === 'upcoming' ? 'No upcoming plans yet.' : 'Your past plans will show up here.'}</p>
                {tab === 'upcoming' && (
                  <button type="button" className="btn btn-primary btn-sm mt-12" onClick={() => nav.go('/discover')}>
                    Find a plan
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div variants={fadeUp} className="group mt-20">
          <button type="button" className="list-row" onClick={() => nav.go('/friends')}>
            <UsersRound className="row-icon" size={21} strokeWidth={2} />
            <span className="row-text">Friends</span>
            <span className="value">{state.friends.length}</span>
            <ChevronRight className="chev" size={20} />
          </button>
          <button type="button" className="list-row" onClick={() => nav.go('/settings/appearance')}>
            <MonitorSmartphone className="row-icon" size={21} strokeWidth={2} />
            <span className="row-text">Appearance</span>
            <span className="value">{appearance}</span>
            <ChevronRight className="chev" size={20} />
          </button>
          <button type="button" className="list-row" onClick={() => nav.go('/settings/privacy')}>
            <Lock className="row-icon" size={21} strokeWidth={2} />
            <span className="row-text">Privacy & visibility</span>
            <ChevronRight className="chev" size={20} />
          </button>
          <button type="button" className="list-row" onClick={() => nav.go('/help')}>
            <CircleHelp className="row-icon" size={21} strokeWidth={2} />
            <span className="row-text">Help & support</span>
            <ChevronRight className="chev" size={20} />
          </button>
        </motion.div>
      </motion.div>
    </Screen>
  );
}

/** Edit profile */
export function EditProfile() {
  const nav = useNav();
  const toast = useToast();
  const { state, updateUser } = useStore();
  const [name, setName] = useState(state.user.name);
  const [bio, setBio] = useState(state.user.bio);
  const [photo, setPhoto] = useState(state.user.photo);
  const [area, setArea] = useState(state.user.area);
  const [interests, setInterests] = useState(state.user.interests);
  const [areaOpen, setAreaOpen] = useState(false);
  const fileRef = useRef(null);
  const valid = name.trim().length >= 2 && interests.length >= 1;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhoto(await resizeImageFile(file));
    } catch (err) {
      toast.show({ title: 'Couldn’t use that photo', body: err.message, icon: 'alert', tone: 'danger' });
    }
  };

  const save = () => {
    updateUser({ name: name.trim(), bio: bio.trim(), photo, area, interests });
    toast.show({ title: 'Profile updated', icon: 'check' });
    nav.back('/profile');
  };

  return (
    <Screen
      header={<TopBar back backTo="/profile" title="Edit profile" />}
      footer={
        <button type="button" className="btn btn-primary btn-block btn-lg" disabled={!valid} onClick={save}>
          Save changes
        </button>
      }
    >
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.div variants={pop} className="photo-pick">
          <button type="button" className="photo-pick-btn" onClick={() => fileRef.current?.click()} aria-label="Change photo">
            {photo ? <img src={photo} alt="Your profile" /> : <Avatar person={{ name, avatar: null }} size={120} />}
            <span className="photo-pick-badge">
              <Camera size={17} strokeWidth={2.4} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          {photo && (
            <button type="button" className="btn btn-ghost btn-xs mt-8" onClick={() => setPhoto(null)}>
              <Trash2 size={14} strokeWidth={2.4} /> Remove photo
            </button>
          )}
        </motion.div>
        <motion.label variants={fadeUp} className="field mt-8">
          <span className="field-label">Name</span>
          <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </motion.label>
        <motion.label variants={fadeUp} className="field">
          <span className="field-label">Bio</span>
          <input className="input" value={bio} maxLength={80} onChange={(e) => setBio(e.target.value)} placeholder="A line about you" />
        </motion.label>
        <motion.div variants={fadeUp} className="field">
          <span className="field-label">Area</span>
          <button type="button" className="select-btn" onClick={() => setAreaOpen(true)}>
            <MapPin size={20} strokeWidth={2.2} />
            <span>{area || 'Choose your area'}</span>
            <ChevronRight className="chev" size={20} />
          </button>
        </motion.div>
        <motion.div variants={fadeUp} className="field">
          <span className="field-label">Interests</span>
          <div className="chip-wrap">
            {INTERESTS.map((id) => {
              const on = interests.includes(id);
              const Icon = ACTIVITY_ICONS[id];
              return (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  className={cx('chip sm', on && 'is-active')}
                  onClick={() => setInterests((x) => (on ? x.filter((y) => y !== id) : [...x, id]))}
                >
                  {on && <motion.span className="chip-fill" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} />}
                  <Icon size={15} strokeWidth={2.2} />
                  {ACTIVITIES[id].label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
      <AreaSheet
        open={areaOpen}
        onClose={() => setAreaOpen(false)}
        value={area}
        onPick={(a) => {
          setArea(a);
          setAreaOpen(false);
        }}
      />
    </Screen>
  );
}
