import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Ellipsis,
  Flag,
  Hourglass,
  LogOut,
  MapPin,
  MessageCircle,
  Navigation,
  Pencil,
  Share2,
  ShieldCheck,
  Star,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { ACTIVITIES } from '../data/catalog';
import { getPerson, myRole, spotsLeft, useStore, ME } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useStatusTone } from '../context/FrameContext';
import { daysFromToday, formatWhen } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import VoteControl, { VoteSummary } from '../components/Vote';
import { cx, downloadFile, firstName, mapsUrl, openExternal, planToIcs, shareOrCopy } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { ActivityIcon, Avatar, Img, Sheet } from '../components/ui';

const QUICK = ['Would love to join you!', 'Count me in 🙌', 'First time on Fryyday 👋', 'Can I bring a friend?'];

export function NotFound({ what = 'plan' }) {
  const nav = useNav();
  return (
    <Screen header={<TopBar back />}>
      <div className="empty">
        <h3>That {what} isn’t here</h3>
        <p>It may have been removed.</p>
        <button type="button" className="btn btn-primary mt-24" onClick={() => nav.go('/discover')}>
          Discover plans
        </button>
      </div>
    </Screen>
  );
}

export default function PlanDetails() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const nav = useNav();
  const toast = useToast();
  const store = useStore();
  const { state } = store;
  const plan = state.plans[id];
  const [requestOpen, setRequestOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(params.get('cancel') === '1');
  const [hostOpen, setHostOpen] = useState(false);
  const [note, setNote] = useState(QUICK[0]);
  const [reason, setReason] = useState('');
  const scrollY = useMotionValue(0);
  const imgY = useTransform(scrollY, (v) => (v > 0 ? v * 0.45 : v * 0.2));
  const imgScale = useTransform(scrollY, (v) => (v < 0 ? 1 + -v / 400 : 1));
  const barOpacity = useTransform(scrollY, [180, 260], [0, 1]);
  const [solid, setSolid] = useState(false);
  useStatusTone(solid ? 'auto' : 'light');

  useEffect(() => {
    if (params.get('cancel') === '1') setParams({}, { replace: true });
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!plan) return <NotFound />;

  const role = myRole(state, plan);
  const host = getPerson(state, plan.hostId);
  const left = spotsLeft(plan);
  const isToday = daysFromToday(plan.start) === 0;
  const saved = state.saved.includes(plan.id);
  const attendees = plan.attendees.map((a) => getPerson(state, a));
  const pendingIn = state.requests.filter((r) => r.dir === 'in' && r.planId === plan.id && r.status === 'pending').length;
  const reviewed = Boolean(state.reviews[plan.id]);
  const checkedIn = Boolean(state.checkins[plan.id]);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#/plan/${plan.id}`;
    const res = await shareOrCopy({ title: plan.title, text: `Join me for “${plan.title}” on Fryyday`, url });
    if (res === 'copied') toast.show({ title: 'Link copied', body: 'Share it anywhere.', icon: 'link' });
  };

  const addToCalendar = () => {
    downloadFile(`${plan.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`, planToIcs(plan), 'text/calendar');
    toast.show({ title: 'Added to calendar', body: 'Open the downloaded file to save it.', icon: 'check' });
  };

  const directions = () => {
    if (!openExternal(mapsUrl(`${plan.venue}, ${plan.area}, Hyderabad`))) {
      toast.show({ title: 'Pop-up blocked', body: 'Allow pop-ups to open directions.', icon: 'alert' });
    }
  };

  const sendRequest = () => {
    const res = store.requestJoin(plan.id, note.trim() || QUICK[0]);
    setRequestOpen(false);
    if (res === 'waitlist') nav.go(`/plan/${plan.id}/waitlist`);
    else toast.show({ title: 'Request sent', body: `${firstName(host.name)} will review it shortly.`, avatar: host.avatar, icon: 'bell' });
  };

  const footer = (() => {
    if (plan.status === 'cancelled') {
      return (
        <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => nav.go('/discover')}>
          Find another plan
        </button>
      );
    }
    if (plan.status === 'past') {
      return reviewed ? (
        <div className="cta-note">
          <Star size={18} strokeWidth={2.4} fill="currentColor" /> You rated this meetup {state.reviews[plan.id].rating}/5
        </div>
      ) : (
        <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={() => nav.go(`/plan/${plan.id}/review`)}>
          <Star size={19} strokeWidth={2.4} /> Rate this meetup
        </button>
      );
    }
    if (role === 'host') {
      return (
        <div className="row gap-10">
          <button type="button" className="btn btn-outline btn-lg" style={{ flex: 'none', width: 58, padding: 0 }} aria-label="Invite friends" onClick={() => nav.go(`/plan/${plan.id}/invite`)}>
            <UserPlus size={20} strokeWidth={2.3} />
          </button>
          <button type="button" className="btn btn-primary btn-lg grow shine" onClick={() => nav.go('/inbox')}>
            Manage requests{pendingIn ? ` (${pendingIn})` : ''}
          </button>
        </div>
      );
    }
    if (role === 'joined') {
      return (
        <div className="row gap-10">
          <button type="button" className="btn btn-outline btn-lg grow" onClick={() => nav.go(`/chat/${plan.chatId}`)}>
            <MessageCircle size={19} strokeWidth={2.3} /> Group chat
          </button>
          {isToday ? (
            <button type="button" className="btn btn-primary btn-lg grow shine" onClick={() => nav.go(`/plan/${plan.id}/checkin`)}>
              {checkedIn ? 'Checked in ✓' : 'Check in'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg grow" onClick={() => nav.go(`/plan/${plan.id}/invite`)}>
              <UserPlus size={19} strokeWidth={2.3} /> Invite
            </button>
          )}
        </div>
      );
    }
    if (role === 'pending') {
      return (
        <div className="col gap-8" style={{ alignItems: 'center' }}>
          <div className="btn btn-soft btn-block btn-lg pending-btn" aria-live="polite">
            <motion.span animate={{ rotate: [0, 180, 180, 360] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'grid' }}>
              <Hourglass size={19} strokeWidth={2.3} />
            </motion.span>
            Waiting for {firstName(host.name)}…
          </div>
          <button type="button" className="text-link" style={{ fontSize: 13.5 }} onClick={() => store.cancelRequest(plan.id)}>
            Cancel request
          </button>
        </div>
      );
    }
    if (role === 'waitlist') {
      return (
        <button type="button" className="btn btn-soft btn-block btn-lg" onClick={() => nav.go(`/plan/${plan.id}/waitlist`)}>
          <Hourglass size={19} strokeWidth={2.3} /> You’re on the waitlist · #{state.waitlist[plan.id] || 2}
        </button>
      );
    }
    return left > 0 ? (
      <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={() => setRequestOpen(true)}>
        Request to join
      </button>
    ) : (
      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        onClick={() => {
          store.requestJoin(plan.id, 'Please add me to the waitlist!');
          nav.go(`/plan/${plan.id}/waitlist`);
        }}
      >
        Join waitlist
      </button>
    );
  })();

  const statusPill =
    plan.status === 'cancelled' ? (
      <span className="pill pill-danger">Cancelled</span>
    ) : plan.status === 'past' ? (
      <span className="pill pill-glass">Past plan</span>
    ) : role === 'host' ? (
      <span className="pill pill-accent">You’re hosting</span>
    ) : role === 'joined' ? (
      <span className="pill pill-accent">You’re in</span>
    ) : role === 'pending' ? (
      <span className="pill pill-glass">Request sent</span>
    ) : left <= 0 ? (
      <span className="pill pill-glass">Full · waitlist open</span>
    ) : left <= 3 ? (
      <span className="pill pill-accent">{left} spots left</span>
    ) : null;

  return (
    <Screen
      glow={false}
      noBody
      onScroll={(e) => {
        const y = e.currentTarget.scrollTop;
        scrollY.set(y);
        if (y > 240 !== solid) setSolid(y > 240);
      }}
      overlay={
        <>
          <motion.div className="detail-bar-bg" style={{ opacity: barOpacity }} />
          <TopBar
            overlay
            back
            glass
            backTo="/discover"
            center={<Logo size={22} variant="plain" />}
            right={
              <div className="row gap-6">
                <motion.button
                  type="button"
                  className={cx('save-btn', saved && 'on')}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const now = store.toggleSave(plan.id);
                    toast.show({ title: now ? 'Saved' : 'Removed from saved', body: plan.title, icon: 'heart' });
                  }}
                  aria-pressed={saved}
                >
                  <motion.span key={String(saved)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 15 }} style={{ display: 'grid' }}>
                    <Bookmark size={17} strokeWidth={2.4} fill={saved ? 'currentColor' : 'none'} />
                  </motion.span>
                  {saved ? 'Saved' : 'Save'}
                </motion.button>
                {(role === 'host' || role === 'joined' || role === 'none' || role === 'pending') && plan.status !== 'cancelled' && (
                  <button type="button" className="icon-btn glass" style={{ width: 38, height: 38 }} aria-label="More options" onClick={() => setMenuOpen(true)}>
                    <Ellipsis size={20} strokeWidth={2.4} />
                  </button>
                )}
              </div>
            }
          />
        </>
      }
      footer={footer}
    >
      <div className="detail-hero">
        <motion.div className="detail-hero-img" style={{ y: imgY, scale: imgScale }}>
          <Img src={plan.heroImage || plan.image} alt="" activity={plan.activity} eager style={{ position: 'absolute', inset: 0 }} />
        </motion.div>
        <div className="detail-hero-shade" />
        <motion.div className="detail-hero-text" variants={stagger(0.08, 0.15)} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="row gap-8">
            <span className="pill pill-glass">
              <ActivityIcon activity={plan.activity} size={14} strokeWidth={2.4} />
              {ACTIVITIES[plan.activity]?.label || 'Plan'}
            </span>
            {statusPill}
          </motion.div>
          <motion.h1 variants={fadeUp} className="detail-title">
            {plan.title}
          </motion.h1>
        </motion.div>
      </div>

      <motion.div className="detail-body" variants={stagger(0.06, 0.2)} initial="hidden" animate="show">
        {plan.status === 'cancelled' && (
          <motion.div variants={fadeUp} className="note" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,92,92,.5)' }}>
            <XCircle size={20} strokeWidth={2.2} style={{ color: 'var(--danger)' }} />
            This plan was cancelled{plan.cancelReason ? ` — ${plan.cancelReason}` : ''}.
          </motion.div>
        )}

        {plan.status !== 'cancelled' && (
          <motion.div variants={fadeUp} className="vote-panel">
            <div style={{ minWidth: 0 }}>
              <h4>{plan.hostId === ME ? 'How people rate your plan' : 'Worth going?'}</h4>
              <VoteSummary plan={plan} />
            </div>
            <VoteControl plan={plan} variant="solid" />
          </motion.div>
        )}

        <motion.button variants={fadeUp} type="button" className="host-row" onClick={() => (host.isMe ? nav.go('/profile') : setHostOpen(true))}>
          <Avatar person={host} size={46} ring />
          <span className="grow" style={{ textAlign: 'left' }}>
            <strong>Hosted by {host.isMe ? 'you' : firstName(host.name)}</strong>
            {!host.isMe && host.rating && (
              <span className="t-cap row gap-4">
                <Star size={13} strokeWidth={2.4} fill="var(--accent)" color="var(--accent)" /> {host.rating} · {host.plansHosted} plans hosted
              </span>
            )}
          </span>
          {!host.isMe && <ChevronRight size={20} className="t-muted" />}
        </motion.button>

        <motion.div variants={fadeUp} className="group info-rows">
          <button type="button" className="list-row" onClick={addToCalendar}>
            <CalendarDays className="row-icon" size={21} strokeWidth={2.1} />
            <span className="row-text">
              {formatWhen(plan.start, { long: true })}
              <small>Add to calendar</small>
            </span>
            <ChevronRight className="chev" size={20} />
          </button>
          <button type="button" className="list-row" onClick={directions}>
            <MapPin className="row-icon" size={21} strokeWidth={2.1} />
            <span className="row-text">
              {plan.venue}
              <small>
                {plan.area} · {plan.km} km · Directions
              </small>
            </span>
            <ChevronRight className="chev" size={20} />
          </button>
          <button type="button" className="list-row" onClick={() => document.getElementById('joining')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <Users className="row-icon" size={21} strokeWidth={2.1} />
            <span className="row-text">
              {left > 0 ? `${left} open spot${left === 1 ? '' : 's'}` : 'Full — waitlist open'}
              <small>
                {plan.attendees.length + 1} of {plan.capacity + 1} going
              </small>
            </span>
            <ChevronRight className="chev" size={20} />
          </button>
        </motion.div>

        <motion.section variants={fadeUp} className="mt-24">
          <h3 className="t-h3">About</h3>
          <p className="t-body mt-8">{plan.about}</p>
        </motion.section>

        <motion.section variants={fadeUp} className="mt-24" id="joining">
          <h3 className="t-h3">Who’s joining ({attendees.length})</h3>
          {attendees.length ? (
            <div className="joiners mt-12">
              {attendees.map((p, i) => (
                <motion.button
                  key={p.id}
                  type="button"
                  className="joiner"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.06, type: 'spring', stiffness: 380, damping: 22 }}
                  onClick={() => (p.isMe ? nav.go('/profile') : nav.go(`/person/${p.id}`))}
                >
                  <Avatar person={p} size={62} ring={p.id === ME} />
                  <span>{p.isMe ? 'You' : firstName(p.name)}</span>
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="t-sub mt-8">No one yet — be the first to join.</p>
          )}
        </motion.section>

        <motion.div variants={fadeUp} className="note mt-24">
          <ShieldCheck size={20} strokeWidth={2.2} />
          Public place · the host approves every request.
        </motion.div>
      </motion.div>

      {/* Request to join */}
      <Sheet
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title={`Say hi to ${firstName(host.name)}`}
        subtitle="A short note helps the host say yes."
        footer={
          <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={sendRequest}>
            Send request
          </button>
        }
      >
        <div className="chip-wrap">
          {QUICK.map((qr) => (
            <button key={qr} type="button" className={cx('chip sm', note === qr && 'is-active')} onClick={() => setNote(qr)}>
              {note === qr && <span className="chip-fill" />}
              {qr}
            </button>
          ))}
        </div>
        <textarea className="input textarea mt-12" rows={3} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Message to the host" />
        <p className="t-cap mt-8">The group chat opens once you’re accepted.</p>
      </Sheet>

      {/* More menu */}
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={plan.title}>
        <div className="list">
          <button type="button" className="list-row" onClick={() => { setMenuOpen(false); share(); }}>
            <Share2 className="row-icon" size={20} /> <span className="row-text">Share plan</span>
          </button>
          <button type="button" className="list-row" onClick={() => { setMenuOpen(false); addToCalendar(); }}>
            <CalendarPlus className="row-icon" size={20} /> <span className="row-text">Add to calendar</span>
          </button>
          <button type="button" className="list-row" onClick={() => { setMenuOpen(false); directions(); }}>
            <Navigation className="row-icon" size={20} /> <span className="row-text">Directions</span>
          </button>
          {role === 'host' && (
            <>
              <button type="button" className="list-row" onClick={() => { setMenuOpen(false); nav.go(`/plan/${plan.id}/edit`); }}>
                <Pencil className="row-icon" size={20} /> <span className="row-text">Edit plan</span>
              </button>
              <button type="button" className="list-row" onClick={() => { setMenuOpen(false); nav.go(`/plan/${plan.id}/invite`); }}>
                <UserPlus className="row-icon" size={20} /> <span className="row-text">Invite friends</span>
              </button>
              <button type="button" className="list-row danger" onClick={() => { setMenuOpen(false); setCancelOpen(true); }}>
                <Trash2 className="row-icon" size={20} /> <span className="row-text">Cancel plan</span>
              </button>
            </>
          )}
          {role === 'joined' && (
            <button
              type="button"
              className="list-row danger"
              onClick={() => {
                setMenuOpen(false);
                store.leavePlan(plan.id);
                toast.show({ title: 'You left the plan', body: plan.title, icon: 'check' });
              }}
            >
              <LogOut className="row-icon" size={20} /> <span className="row-text">Leave plan</span>
            </button>
          )}
          {role !== 'host' && (
            <button type="button" className="list-row danger" onClick={() => { setMenuOpen(false); nav.go(`/report?person=${plan.hostId}&plan=${plan.id}`); }}>
              <Flag className="row-icon" size={20} /> <span className="row-text">Report</span>
            </button>
          )}
        </div>
      </Sheet>

      {/* 26 — Cancel plan */}
      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <div className="t-center">
          <h3 className="t-h2">Cancel this plan?</h3>
          <p className="t-sub mt-8">Everyone who joined will be notified.</p>
        </div>
        <label className="field mt-20">
          <span className="field-label">
            Reason <small>optional</small>
          </span>
          <textarea className="input textarea" rows={3} placeholder="e.g., Schedule changed…" value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="col gap-10 mt-20">
          <button type="button" className="btn btn-outline btn-block btn-lg" onClick={() => setCancelOpen(false)}>
            Keep plan
          </button>
          <button
            type="button"
            className="btn btn-danger btn-block btn-lg"
            onClick={() => {
              store.cancelPlan(plan.id, reason.trim());
              setCancelOpen(false);
              toast.show({ title: 'Plan cancelled', body: `${plan.attendees.length} ${plan.attendees.length === 1 ? 'person was' : 'people were'} notified.`, icon: 'alert', tone: 'danger' });
            }}
          >
            Cancel plan
          </button>
        </div>
      </Sheet>

      {/* Host mini profile */}
      <Sheet open={hostOpen} onClose={() => setHostOpen(false)}>
        <div className="col" style={{ alignItems: 'center', textAlign: 'center' }}>
          <Avatar person={host} size={92} ring />
          <h3 className="t-h2 mt-12">{host.name}</h3>
          <p className="t-sub mt-4">
            <MapPin size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {host.area}
          </p>
          <p className="t-body mt-8">{host.bio}</p>
          <div className="row gap-8 mt-16">
            <span className="pill pill-soft">
              <Star size={13} strokeWidth={2.4} fill="currentColor" /> {host.rating}
            </span>
            <span className="pill pill-muted">{host.plansHosted} plans hosted</span>
          </div>
          <button type="button" className="btn btn-outline btn-block mt-20" onClick={() => { setHostOpen(false); nav.go(`/person/${host.id}`); }}>
            View profile
          </button>
        </div>
      </Sheet>
    </Screen>
  );
}
