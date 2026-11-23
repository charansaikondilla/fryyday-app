import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Ban, Check, Flag, MapPin, Star, UserPlus } from 'lucide-react';
import { ACTIVITIES } from '../data/catalog';
import { getPerson, useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { useNav } from '../lib/nav';
import { fadeUp, pop, stagger } from '../lib/motion';
import { firstName } from '../lib/utils';
import { Screen, TopBar } from '../components/Screen';
import { Avatar } from '../components/ui';
import { PlanRow } from '../components/PlanCards';
import { ACTIVITY_ICONS } from '../components/icons';
import { NotFound } from './PlanDetails';

/** Another member's profile */
export default function PersonProfile() {
  const { id } = useParams();
  const nav = useNav();
  const toast = useToast();
  const { state, sendFriendRequest, acceptFriend, block, unblock } = useStore();
  const person = getPerson(state, id);
  if (!person || person.name === 'Member') return <NotFound what="profile" />;
  const friend = state.friends.includes(id);
  const sent = state.sentFriendRequests.includes(id);
  const incoming = state.friendRequests.includes(id);
  const blocked = state.blocked.includes(id);
  const hosting = Object.values(state.plans).filter((p) => p.hostId === id && p.status === 'upcoming');

  return (
    <Screen header={<TopBar back title={firstName(person.name)} />}>
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.div variants={pop} className="profile-top">
          <div className="profile-av">
            <span className="profile-av-glow" />
            <Avatar person={person} size={112} ring />
          </div>
          <h1 className="t-h2 mt-12">{person.name}</h1>
          <p className="row gap-4 t-sub mt-4">
            <MapPin size={15} strokeWidth={2.3} />
            {person.area}, Hyderabad
          </p>
          {person.bio && <p className="t-body mt-8 t-center">{person.bio}</p>}
          <div className="row gap-8 mt-12">
            {person.rating && (
              <span className="pill pill-soft">
                <Star size={13} strokeWidth={2.4} fill="currentColor" /> {person.rating}
              </span>
            )}
            {person.plansHosted ? <span className="pill pill-muted">{person.plansHosted} plans hosted</span> : null}
            {person.mutual ? <span className="pill pill-muted">{person.mutual} mutual friends</span> : null}
          </div>
          <div className="row gap-10 mt-16">
            {blocked ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  unblock(id);
                  toast.show({ title: `${firstName(person.name)} unblocked`, icon: 'check' });
                }}
              >
                Unblock
              </button>
            ) : friend ? (
              <span className="btn btn-soft btn-sm" aria-disabled="true">
                <Check size={16} strokeWidth={3} /> Friends
              </span>
            ) : incoming ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  acceptFriend(id);
                  toast.show({ title: 'You’re now friends', body: person.name, avatar: person.avatar, icon: 'heart' });
                }}
              >
                Accept request
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={sent}
                onClick={() => {
                  sendFriendRequest(id);
                  toast.show({ title: 'Friend request sent', body: person.name, avatar: person.avatar, icon: 'user' });
                }}
              >
                <UserPlus size={16} strokeWidth={2.5} /> {sent ? 'Requested' : 'Add friend'}
              </button>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => nav.go(`/report?person=${id}`)}>
              <Flag size={15} strokeWidth={2.4} /> Report
            </button>
          </div>
        </motion.div>

        {person.interests?.length > 0 && (
          <motion.div variants={fadeUp} className="chip-row center-row mt-20">
            {person.interests.map((i) => {
              const Icon = ACTIVITY_ICONS[i];
              return (
                <span key={i} className="chip sm">
                  {Icon && <Icon size={15} className="t-accent" />}
                  {ACTIVITIES[i]?.label}
                </span>
              );
            })}
          </motion.div>
        )}

        <motion.h3 variants={fadeUp} className="t-h3 mt-24">
          Hosting soon
        </motion.h3>
        <motion.div className="list mt-12" variants={stagger(0.06)}>
          {hosting.map((p) => (
            <PlanRow key={p.id} plan={p} />
          ))}
          {!hosting.length && (
            <motion.p variants={fadeUp} className="t-sub">
              No upcoming plans right now.
            </motion.p>
          )}
        </motion.div>

        {!blocked && (
          <motion.button
            variants={fadeUp}
            type="button"
            className="btn btn-ghost btn-sm mt-24"
            style={{ color: 'var(--danger)' }}
            onClick={() => {
              block(id);
              toast.show({ title: `${firstName(person.name)} blocked`, body: 'They won’t see your plans or message you.', icon: 'alert', tone: 'danger' });
            }}
          >
            <Ban size={16} strokeWidth={2.4} /> Block {firstName(person.name)}
          </motion.button>
        )}
      </motion.div>
    </Screen>
  );
}
