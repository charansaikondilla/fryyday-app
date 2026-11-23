import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Ban,
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  LayoutGrid,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Paintbrush,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UserRound,
  UserRoundPlus,
  UsersRound,
  WifiOff,
} from 'lucide-react';
import { getPerson, useStore } from '../context/StoreContext';
import { originFromEvent, useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { cx, firstName } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Avatar, Radio, Sheet, Toggle } from '../components/ui';
import { OFFLINE_PREVIEW_EVENT } from '../components/OfflineOverlay';
import { IMG } from '../data/images';

function Row({ icon: Icon, label, value, onClick, danger, sub }) {
  return (
    <motion.button variants={fadeUp} type="button" className={cx('list-row', danger && 'danger')} onClick={onClick}>
      <Icon className="row-icon" size={22} strokeWidth={2} />
      <span className="row-text">
        {label}
        {sub && <small>{sub}</small>}
      </span>
      {value && <span className="value">{value}</span>}
      <ChevronRight className="chev" size={20} />
    </motion.button>
  );
}

/** 21 — Settings */
export function Settings() {
  const nav = useNav();
  const toast = useToast();
  const { state, logout, resetDemo } = useStore();
  const { pref } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [statesOpen, setStatesOpen] = useState(false);
  const appearance = pref === 'system' ? 'System' : pref === 'light' ? 'Light' : 'Dark';
  const myPlan = Object.values(state.plans).find((p) => p.hostId === 'me' && p.status === 'upcoming');

  return (
    <Screen header={<TopBar back backTo="/profile" center={<Logo size={22} />} />}>
      <motion.div variants={stagger(0.04)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4 mb-16">
          Settings
        </motion.h1>
        <div className="list">
          <Row icon={UserRound} label="Edit profile" onClick={() => nav.go('/profile/edit')} />
          <Row icon={Paintbrush} label="Appearance" value={appearance} onClick={() => nav.go('/settings/appearance')} />
          <Row icon={Bell} label="Notifications" onClick={() => nav.go('/settings/notifications')} />
          <Row icon={ShieldCheck} label="Privacy" onClick={() => nav.go('/settings/privacy')} />
          <Row icon={CircleHelp} label="Help" onClick={() => nav.go('/help')} />
          <Row icon={FileText} label="Terms" onClick={() => nav.go('/legal/terms')} />
          <Row icon={ShieldCheck} label="Privacy policy" onClick={() => nav.go('/legal/privacy')} />
          <Row icon={LogOut} label="Log out" onClick={() => setLogoutOpen(true)} />
          <Row icon={Trash2} label="Delete account" onClick={() => nav.go('/settings/account')} />
        </div>

        <motion.h3 variants={fadeUp} className="t-cap mt-28 mb-12" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Demo tools
        </motion.h3>
        <div className="list">
          <Row icon={Sparkles} label="Preview app states" sub="Offline, no plans, waitlist, plan change…" onClick={() => setStatesOpen(true)} />
          <Row
            icon={RotateCcw}
            label="Reset demo data"
            sub="Keeps your profile and settings"
            onClick={() => {
              resetDemo();
              toast.show({ title: 'Demo data refreshed', icon: 'check' });
            }}
          />
        </div>
        <motion.p variants={fadeUp} className="t-cap t-center mt-24">
          Fryyday · v1.0.0
        </motion.p>
      </motion.div>

      <Sheet open={logoutOpen} onClose={() => setLogoutOpen(false)} title="Log out?" subtitle="You can log back in anytime with your number.">
        <div className="col gap-10">
          <button type="button" className="btn btn-outline btn-block" onClick={() => setLogoutOpen(false)}>
            Stay logged in
          </button>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              setLogoutOpen(false);
              logout();
              nav.replace('/welcome');
            }}
          >
            Log out
          </button>
        </div>
      </Sheet>

      <Sheet open={statesOpen} onClose={() => setStatesOpen(false)} title="Preview app states" subtitle="Conditional screens appear only when needed.">
        <div className="list">
          {[
            { icon: WifiOff, label: 'Offline', run: () => window.dispatchEvent(new Event(OFFLINE_PREVIEW_EVENT)) },
            { icon: Info, label: 'No plans (empty state)', to: '/discover?filter=movies&when=tomorrow' },
            { icon: UsersRound, label: 'Waitlist', to: '/plan/p-pickle-sat/waitlist' },
            { icon: MapPin, label: 'Plan change notice', to: '/plan/p-satcoffee/changed' },
            { icon: Trash2, label: 'Cancel plan', to: myPlan ? `/plan/${myPlan.id}?cancel=1` : null },
            { icon: Sparkles, label: 'After the meetup', to: '/plan/p-boardgames/review' },
          ]
            .filter((x) => x.to !== null)
            .map((x) => (
              <button
                key={x.label}
                type="button"
                className="list-row"
                onClick={() => {
                  setStatesOpen(false);
                  if (x.run) setTimeout(x.run, 250);
                  else nav.go(x.to);
                }}
              >
                <x.icon className="row-icon" size={20} />
                <span className="row-text">{x.label}</span>
                <ChevronRight className="chev" size={20} />
              </button>
            ))}
        </div>
      </Sheet>
    </Screen>
  );
}

/* --------------------------------------------------------------------------
   Appearance — theme + home layout
   -------------------------------------------------------------------------- */
const LAYOUTS = [
  { id: 'grid', label: 'Activity grid', sub: 'Big tiles for every mood', img: IMG['tile-coffee'] },
  { id: 'picks', label: 'Today’s picks', sub: 'A featured plan for today', img: IMG['coffee-crew'] },
  { id: 'quick', label: 'Quick start', sub: '“Free for an hour?” shortcut', img: IMG['daily-bean'] },
  { id: 'circle', label: 'Your circle', sub: 'Friends and invites first', img: IMG['people-walk'] },
];

export function Appearance() {
  const { pref, setTheme } = useTheme();
  const { state, setSetting } = useStore();
  const toast = useToast();
  const themes = [
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'system', label: 'System', Icon: Monitor },
  ];
  return (
    <Screen header={<TopBar back backTo="/settings" title="Appearance" />}>
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show">
        <motion.h3 variants={fadeUp} className="t-h3 mt-8">
          Theme
        </motion.h3>
        <motion.div variants={fadeUp} className="theme-cards mt-12">
          {themes.map(({ id, label, Icon }) => (
            <button key={id} type="button" className={cx('theme-card', pref === id && 'is-on')} onClick={(e) => setTheme(id, originFromEvent(e))}>
              <span className={cx('theme-preview', `tp-${id}`)}>
                <span className="tp-bar" />
                <span className="tp-line" />
                <span className="tp-line short" />
                <span className="tp-btn" />
              </span>
              <span className="row gap-6">
                <Icon size={16} strokeWidth={2.3} />
                {label}
              </span>
              <Radio on={pref === id} />
            </button>
          ))}
        </motion.div>

        <motion.h3 variants={fadeUp} className="t-h3 mt-28">
          Home layout
        </motion.h3>
        <motion.p variants={fadeUp} className="t-sub mt-4">
          Four ways to come home. Activity grid is the launch default.
        </motion.p>
        <div className="list mt-12">
          {LAYOUTS.map((l) => (
            <motion.button
              variants={fadeUp}
              key={l.id}
              type="button"
              className={cx('option-row layout-opt', state.settings.homeLayout === l.id && 'is-on')}
              onClick={() => {
                setSetting('homeLayout', l.id);
                toast.show({ title: `Home: ${l.label}`, body: 'Open the Home tab to see it.', icon: 'check', to: '/home' });
              }}
            >
              <img src={l.img} alt="" className="layout-thumb" />
              <span className="grow">
                {l.label}
                <small className="t-cap" style={{ display: 'block', marginTop: 2 }}>
                  {l.sub}
                </small>
              </span>
              <Radio on={state.settings.homeLayout === l.id} />
            </motion.button>
          ))}
        </div>
        <motion.div variants={fadeUp} className="note mt-16">
          <LayoutGrid size={20} />
          Every screen supports both light and dark mode.
        </motion.div>
      </motion.div>
    </Screen>
  );
}

/* --------------------------------------------------------------------------
   22 — Privacy
   -------------------------------------------------------------------------- */
export function Privacy() {
  const nav = useNav();
  const { state, setSetting } = useStore();
  const [locOpen, setLocOpen] = useState(false);
  const s = state.settings;
  return (
    <Screen header={<TopBar back backTo="/settings" center={<Logo size={22} />} />}>
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4 mb-16">
          Privacy
        </motion.h1>
        <div className="list">
          <motion.div variants={fadeUp} className="list-row">
            <UsersRound className="row-icon" size={22} strokeWidth={2} />
            <span className="row-text">Show my profile in discovery</span>
            <Toggle on={s.discoverable} onChange={(v) => setSetting('discoverable', v)} label="Show my profile in discovery" />
          </motion.div>
          <motion.div variants={fadeUp} className="list-row">
            <UserRoundPlus className="row-icon" size={22} strokeWidth={2} />
            <span className="row-text">Friend requests</span>
            <Toggle on={s.friendRequests} onChange={(v) => setSetting('friendRequests', v)} label="Allow friend requests" />
          </motion.div>
          <Row icon={MapPin} label="Location" value={s.location === 'area' ? 'Area only' : 'Off'} onClick={() => setLocOpen(true)} />
          <Row icon={Ban} label="Blocked accounts" value={state.blocked.length ? String(state.blocked.length) : undefined} onClick={() => nav.go('/settings/blocked')} />
        </div>
        <motion.div variants={fadeUp} className="note mt-20">
          <Info size={22} strokeWidth={2.2} />
          Your exact location stays private.
        </motion.div>
      </motion.div>
      <Sheet open={locOpen} onClose={() => setLocOpen(false)} title="Location" subtitle="Used only to suggest nearby plans.">
        <div className="list">
          {[
            { v: 'area', label: 'Area only', sub: 'Recommended — e.g. “Jubilee Hills”' },
            { v: 'off', label: 'Off', sub: 'You’ll pick your area manually' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              className={cx('option-row', s.location === o.v && 'is-on')}
              onClick={() => {
                setSetting('location', o.v);
                setLocOpen(false);
              }}
            >
              <Radio on={s.location === o.v} />
              <span className="grow">
                {o.label}
                <small className="t-cap" style={{ display: 'block' }}>
                  {o.sub}
                </small>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  );
}

/* --------------------------------------------------------------------------
   Notification preferences
   -------------------------------------------------------------------------- */
export function NotificationSettings() {
  const { state, setNotificationSetting } = useStore();
  const n = state.settings.notifications;
  const rows = [
    { k: 'requests', label: 'Join requests', sub: 'When someone wants to join your plan' },
    { k: 'messages', label: 'Group messages', sub: 'New messages in your plan chats' },
    { k: 'reminders', label: 'Reminders', sub: 'An hour before your plans start' },
    { k: 'updates', label: 'Plan updates', sub: 'Time, venue changes and cancellations' },
    { k: 'tips', label: 'Tips & news', sub: 'New features and ideas for plans' },
  ];
  return (
    <Screen header={<TopBar back backTo="/settings" title="Notifications" />}>
      <motion.div className="list mt-8" variants={stagger(0.05)} initial="hidden" animate="show">
        {rows.map((r) => (
          <motion.div variants={fadeUp} key={r.k} className="list-row">
            <span className="row-text">
              {r.label}
              <small>{r.sub}</small>
            </span>
            <Toggle on={n[r.k]} onChange={(v) => setNotificationSetting(r.k, v)} label={r.label} />
          </motion.div>
        ))}
      </motion.div>
    </Screen>
  );
}

/* --------------------------------------------------------------------------
   Blocked accounts
   -------------------------------------------------------------------------- */
export function BlockedAccounts() {
  const { state, unblock } = useStore();
  const toast = useToast();
  return (
    <Screen header={<TopBar back backTo="/settings/privacy" title="Blocked accounts" />}>
      <motion.div className="list mt-8" variants={stagger(0.05)} initial="hidden" animate="show">
        {state.blocked.map((id) => {
          const p = getPerson(state, id);
          return (
            <motion.div layout variants={fadeUp} key={id} className="list-row">
              <Avatar person={p} size={44} />
              <span className="row-text">{p.name}</span>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => {
                  unblock(id);
                  toast.show({ title: `${firstName(p.name)} unblocked`, icon: 'check' });
                }}
              >
                Unblock
              </button>
            </motion.div>
          );
        })}
        {!state.blocked.length && (
          <div className="empty">
            <span className="empty-ic">
              <Ban size={28} strokeWidth={2.2} />
            </span>
            <h3 style={{ fontSize: 22 }}>No blocked accounts</h3>
            <p>People you block can’t see your plans or message you.</p>
          </div>
        )}
      </motion.div>
    </Screen>
  );
}

/* --------------------------------------------------------------------------
   Terms / Privacy policy
   -------------------------------------------------------------------------- */
const DOCS = {
  terms: {
    title: 'Terms',
    sections: [
      ['Meeting safely', 'Plans happen in public places. Hosts approve every request, and anyone can leave a plan at any time.'],
      ['Be kind', 'Treat people with respect. Harassment, hate or unsafe behaviour leads to removal from Fryyday.'],
      ['Your content', 'You own what you post. You give Fryyday permission to show it to the people you share it with.'],
      ['Sample text', 'This is placeholder copy for the prototype — replace it with your final legal terms before launch.'],
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      ['Location', 'We keep your area (for example “Jubilee Hills”) — never your precise location — to suggest nearby plans.'],
      ['Your number', 'Your phone number is used to log in and is never shown to other members.'],
      ['Your data', 'Download or delete your data anytime from Account controls.'],
      ['Sample text', 'This is placeholder copy for the prototype — replace it with your final privacy policy before launch.'],
    ],
  },
};

export function Legal() {
  const { doc } = useParams();
  const d = DOCS[doc] || DOCS.terms;
  return (
    <Screen header={<TopBar back backTo="/settings" title={d.title} />}>
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        {d.sections.map(([h, p]) => (
          <motion.section key={h} variants={fadeUp} className="card card-pad mt-12">
            <h3 className="t-h4">{h}</h3>
            <p className="t-sub mt-8">{p}</p>
          </motion.section>
        ))}
      </motion.div>
    </Screen>
  );
}
