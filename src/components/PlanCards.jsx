import { motion } from 'framer-motion';
import { Bookmark, CalendarDays, ChevronRight, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPerson, myRole, spotsLeft, useStore } from '../context/StoreContext';
import { formatWhen } from '../lib/dates';
import { fadeUp } from '../lib/motion';
import { cx, firstName } from '../lib/utils';
import { Avatar, Img } from './ui';

export function spotsLabel(plan) {
  const n = spotsLeft(plan);
  if (n <= 0) return 'Full';
  return `${n} spot${n === 1 ? '' : 's'} left`;
}

export function goingLabel(plan) {
  return `${plan.attendees.length + 1} going`;
}

function RoleBadge({ plan }) {
  const { state } = useStore();
  const role = myRole(state, plan);
  if (plan.status === 'cancelled') return <span className="pill pill-danger">Cancelled</span>;
  if (role === 'host') return <span className="pill pill-accent">Hosting</span>;
  if (role === 'joined') return <span className="pill pill-accent">You’re in</span>;
  if (role === 'pending') return <span className="pill pill-glass">Requested</span>;
  if (role === 'waitlist') return <span className="pill pill-glass">Waitlist</span>;
  return null;
}

/** Large photo card — Discover list. */
export function PlanHeroCard({ plan, height = 214 }) {
  const navigate = useNavigate();
  const { state } = useStore();
  const saved = state.saved.includes(plan.id);
  const left = spotsLeft(plan);
  return (
    <motion.article variants={fadeUp} whileTap={{ scale: 0.985 }} className="plan-hero pressable" onClick={() => navigate(`/plan/${plan.id}`)}>
      <Img src={plan.image} alt="" activity={plan.activity} className="plan-hero-img" style={{ height }} scrim>
        <div className="plan-hero-top">
          <RoleBadge plan={plan} />
          {saved && (
            <span className="pill pill-glass" aria-label="Saved">
              <Bookmark size={14} strokeWidth={2.6} fill="currentColor" />
            </span>
          )}
        </div>
        <div className="plan-hero-info">
          <h3>{plan.title}</h3>
          <div className="plan-hero-meta">
            <span>
              <CalendarDays size={16} strokeWidth={2.1} />
              {formatWhen(plan.start)}
            </span>
            <span>
              <MapPin size={16} strokeWidth={2.1} />
              {plan.area} · {plan.km} km
            </span>
          </div>
          <div className="plan-hero-cta">
            {left > 0 && left <= 4 ? (
              <span className="pill pill-accent">{spotsLabel(plan)}</span>
            ) : left <= 0 ? (
              <span className="pill pill-glass">Full · waitlist</span>
            ) : (
              <span className="icon-btn glass" style={{ width: 36, height: 36 }}>
                <ChevronRight size={20} strokeWidth={2.4} />
              </span>
            )}
          </div>
        </div>
      </Img>
    </motion.article>
  );
}

/** Thumbnail row — lists, profile, home. */
export function PlanRow({ plan, action, showGoing = false, onClick, className }) {
  const navigate = useNavigate();
  return (
    <motion.article
      variants={fadeUp}
      whileTap={{ scale: 0.985 }}
      className={cx('plan-row pressable', className)}
      onClick={onClick || (() => navigate(`/plan/${plan.id}`))}
    >
      <Img src={plan.image} alt="" activity={plan.activity} className="plan-row-img" />
      <div className="plan-row-text">
        <h4 className="ellipsis">{plan.title}</h4>
        <p>
          {showGoing ? <Users size={15} strokeWidth={2.2} /> : <CalendarDays size={15} strokeWidth={2.2} />}
          <span className="ellipsis">{showGoing ? `${goingLabel(plan)} · ${formatWhen(plan.start)}` : formatWhen(plan.start)}</span>
        </p>
        {!showGoing && (
          <p>
            <MapPin size={15} strokeWidth={2.2} />
            <span className="ellipsis">{plan.venue}</span>
          </p>
        )}
      </div>
      {action || <ChevronRight className="plan-row-chev" size={20} strokeWidth={2.2} />}
    </motion.article>
  );
}

/** Host avatar row — "Happening nearby". */
export function PlanNearbyRow({ plan }) {
  const navigate = useNavigate();
  const { state } = useStore();
  const host = getPerson(state, plan.hostId);
  return (
    <motion.article variants={fadeUp} whileTap={{ scale: 0.985 }} className="nearby-row pressable" onClick={() => navigate(`/plan/${plan.id}`)}>
      <Avatar person={host} size={54} />
      <div className="grow">
        <h4 className="ellipsis">{plan.title}</h4>
        <p className="ellipsis">
          <MapPin size={14} strokeWidth={2.3} />
          {plan.area} · {formatWhen(plan.start)}
        </p>
      </div>
      <ChevronRight size={22} strokeWidth={2.2} className="plan-row-chev" />
    </motion.article>
  );
}

/** Tall photo card — Home "Your circle" layout. */
export function PlanPhotoCard({ plan, width = 176, height = 214 }) {
  const navigate = useNavigate();
  return (
    <motion.article
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      className="photo-card pressable"
      style={{ width, flex: 'none' }}
      onClick={() => navigate(`/plan/${plan.id}`)}
    >
      <Img src={plan.image} alt="" activity={plan.activity} style={{ height, borderRadius: 20 }} scrim>
        <div className="photo-card-info">
          <h4>{plan.title}</h4>
          <p>
            <Users size={13} strokeWidth={2.4} />
            <span className="ellipsis">
              {goingLabel(plan)} · {formatWhen(plan.start)}
            </span>
          </p>
        </div>
      </Img>
    </motion.article>
  );
}

/** Photo + details summary — published, review, invite. */
export function PlanSummary({ plan, hostLine = false, accent = false, onClick }) {
  const { state } = useStore();
  const host = getPerson(state, plan.hostId);
  return (
    <motion.div variants={fadeUp} className={cx('summary card', accent && 'accent-outline', onClick && 'pressable')} onClick={onClick}>
      <Img src={plan.image} alt="" activity={plan.activity} className="summary-img" />
      <div className="summary-text">
        <h4>{plan.title}</h4>
        {hostLine ? (
          <p className="t-sub">Hosted by {host.isMe ? 'you' : firstName(host.name)}</p>
        ) : (
          <>
            <p>
              <CalendarDays size={15} strokeWidth={2.1} />
              {formatWhen(plan.start)}
            </p>
            <p>
              <MapPin size={15} strokeWidth={2.1} />
              <span className="ellipsis">{plan.venue}</span>
            </p>
            <p>
              <Users size={15} strokeWidth={2.1} />
              {spotsLeft(plan)} open spots
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
