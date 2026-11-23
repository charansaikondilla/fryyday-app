import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { CalendarDays, Check, ChevronRight, Copy, Link2, MapPin, Search, Share2, UserPlus, X } from 'lucide-react';
import { PEOPLE } from '../data/catalog';
import { getPerson, myUpcoming, useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatWhen } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, stagger } from '../lib/motion';
import { copyText, cx, firstName, shareOrCopy } from '../lib/utils';
import Logo from '../components/Logo';
import { Screen, TopBar } from '../components/Screen';
import { Avatar, Img, Sheet } from '../components/ui';
import { NotFound } from './PlanDetails';

function InviteButton({ invited, onClick }) {
  return (
    <motion.button type="button" className={cx('btn btn-xs', invited ? 'btn-soft' : 'btn-primary')} onClick={onClick} disabled={invited} whileTap={{ scale: 0.9 }} style={{ minWidth: 84 }}>
      <AnimatePresence mode="wait" initial={false}>
        {invited ? (
          <motion.span key="ok" className="row gap-4" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Check size={14} strokeWidth={3} /> Invited
          </motion.span>
        ) : (
          <motion.span key="inv" exit={{ opacity: 0, scale: 0.6 }}>
            Invite
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** 27 — Invite friends to a plan */
export function InviteFriends() {
  const { id } = useParams();
  const toast = useToast();
  const { state, invite } = useStore();
  const plan = state.plans[id];
  if (!plan) return <NotFound />;
  const url = `${window.location.origin}${window.location.pathname}#/plan/${plan.id}`;
  const invited = state.invited[id] || [];
  const candidates = [...['ananyaR', 'rohan', 'meeraI'], ...state.friends.filter((f) => !['ananyaR', 'rohan', 'meeraI'].includes(f))]
    .filter((pid) => !plan.attendees.includes(pid) && pid !== plan.hostId && !state.blocked.includes(pid))
    .map((pid) => getPerson(state, pid));

  return (
    <Screen header={<TopBar back backTo={`/plan/${id}`} center={<Logo size={22} />} />}>
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Invite Friends
        </motion.h1>
        <motion.div variants={fadeUp} className="invite-plan mt-16">
          <Img src={plan.image} alt="" activity={plan.activity} style={{ position: 'absolute', inset: 0 }} />
          <span className="edit-hero-shade" />
          <span className="invite-plan-text">
            <strong>{plan.title}</strong>
            <span>
              <CalendarDays size={15} strokeWidth={2.2} /> {formatWhen(plan.start)}
            </span>
            <span>
              <MapPin size={15} strokeWidth={2.2} /> {plan.venue}, Hyderabad
            </span>
          </span>
        </motion.div>

        <motion.div variants={fadeUp} className="card card-pad row gap-14 mt-12">
          <span className="link-ic">
            <Link2 size={26} strokeWidth={2.2} />
          </span>
          <span className="grow">
            <strong className="t-h4">Shareable invite</strong>
            <small className="t-sub" style={{ display: 'block' }}>
              Anyone with the link can view the plan and request to join.
            </small>
          </span>
        </motion.div>
        <motion.div variants={fadeUp} className="row gap-10 mt-12">
          <button
            type="button"
            className="btn btn-outline btn-md grow"
            onClick={async () => {
              const ok = await copyText(url);
              toast.show({ title: ok ? 'Link copied' : 'Couldn’t copy link', body: ok ? 'Paste it anywhere to share.' : url, icon: ok ? 'link' : 'alert' });
            }}
          >
            <Copy size={18} strokeWidth={2.3} /> Copy link
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md grow"
            onClick={async () => {
              const res = await shareOrCopy({ title: plan.title, text: `Join me for “${plan.title}” on Fryyday`, url });
              if (res === 'copied') toast.show({ title: 'Link copied', body: 'Sharing isn’t available here — paste the link instead.', icon: 'link' });
            }}
          >
            <Share2 size={18} strokeWidth={2.3} /> Share invite
          </button>
        </motion.div>

        <motion.h3 variants={fadeUp} className="t-h3 mt-24 mb-12">
          Invite friends
        </motion.h3>
        <div className="list" style={{ gap: 8 }}>
          {candidates.map((p) => (
            <motion.div variants={fadeUp} key={p.id} className="person-row card">
              <Avatar person={p} size={50} />
              <span className="grow" style={{ minWidth: 0 }}>
                <strong className="ellipsis" style={{ display: 'block' }}>
                  {p.name}
                </strong>
                <small className="t-cap">{state.friends.includes(p.id) ? 'Friend on Fryyday' : `${p.mutual || 3} mutual friends`}</small>
              </span>
              <InviteButton
                invited={invited.includes(p.id)}
                onClick={() => {
                  invite(id, p.id);
                  toast.show({ title: `Invited ${firstName(p.name)}`, body: plan.title, avatar: p.avatar, icon: 'check' });
                }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Screen>
  );
}

/** 28 — Friends */
export function Friends() {
  const nav = useNav();
  const toast = useToast();
  const { state, acceptFriend, ignoreFriend, sendFriendRequest, invite } = useStore();
  const [q, setQ] = useState('');
  const [reqOpen, setReqOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState(null);
  const query = q.trim().toLowerCase();
  const friends = state.friends.map((id) => getPerson(state, id)).filter((p) => !query || p.name.toLowerCase().includes(query));
  const requests = state.friendRequests.map((id) => getPerson(state, id));
  const suggestions = useMemo(
    () =>
      Object.keys(PEOPLE)
        .filter((id) => !state.friends.includes(id) && !state.friendRequests.includes(id) && !state.blocked.includes(id))
        .map((id) => getPerson(state, id)),
    [state.friends, state.friendRequests, state.blocked, state],
  );
  const myPlans = myUpcoming(state);

  return (
    <Screen
      header={<TopBar back backTo="/profile" center={<Logo size={22} />} />}
      footer={
        <button type="button" className="btn btn-primary btn-block btn-lg shine" onClick={() => setFindOpen(true)}>
          <UserPlus size={20} strokeWidth={2.4} /> Find friends
        </button>
      }
    >
      <motion.div variants={stagger(0.06)} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="t-h1 mt-4">
          Friends
        </motion.h1>
        <motion.div variants={fadeUp} className="input-wrap mt-16">
          <Search size={20} strokeWidth={2.2} />
          <input className="input search" placeholder="Search friends by name" value={q} onChange={(e) => setQ(e.target.value)} />
        </motion.div>

        {requests.length > 0 && (
          <motion.button variants={fadeUp} type="button" className="req-banner mt-12" onClick={() => setReqOpen(true)}>
            <UserPlus size={22} strokeWidth={2.2} />
            <span className="grow">
              Friend requests <span className="t-accent">({requests.length})</span>
            </span>
            <ChevronRight size={20} />
          </motion.button>
        )}

        <motion.h3 variants={fadeUp} className="t-h3 mt-24 mb-12">
          Your friends ({state.friends.length})
        </motion.h3>
        <div className="list" style={{ gap: 8 }}>
          <AnimatePresence>
            {friends.map((p) => (
              <motion.div layout variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.95 }} key={p.id} className="person-row card">
                <button type="button" className="row gap-12 grow" style={{ minWidth: 0, textAlign: 'left' }} onClick={() => nav.go(`/person/${p.id}`)}>
                  <Avatar person={p} size={50} />
                  <span className="grow" style={{ minWidth: 0 }}>
                    <strong className="ellipsis" style={{ display: 'block' }}>
                      {p.name}
                    </strong>
                    <small className="t-cap">Friend on Fryyday</small>
                  </span>
                </button>
                <button type="button" className="btn btn-primary btn-xs" onClick={() => setInviteFor(p)}>
                  Invite
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {!friends.length && <p className="t-sub">{query ? `No friends match “${q}”.` : 'No friends yet — find people you’ve met.'}</p>}
        </div>
      </motion.div>

      <Sheet open={reqOpen} onClose={() => setReqOpen(false)} title={`Friend requests (${requests.length})`}>
        <div className="list" style={{ gap: 8 }}>
          <AnimatePresence>
            {requests.map((p) => (
              <motion.div layout key={p.id} exit={{ opacity: 0, x: -40 }} className="person-row card">
                <Avatar person={p} size={46} />
                <span className="grow" style={{ minWidth: 0 }}>
                  <strong className="ellipsis" style={{ display: 'block' }}>
                    {p.name}
                  </strong>
                  <small className="t-cap">{p.mutual || 2} mutual friends</small>
                </span>
                <button
                  type="button"
                  className="icon-btn soft"
                  aria-label="Ignore"
                  style={{ width: 36, height: 36 }}
                  onClick={() => ignoreFriend(p.id)}
                >
                  <X size={17} />
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  onClick={() => {
                    acceptFriend(p.id);
                    toast.show({ title: 'You’re now friends', body: p.name, avatar: p.avatar, icon: 'heart' });
                  }}
                >
                  Accept
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {!requests.length && <p className="t-sub t-center">No pending requests.</p>}
        </div>
      </Sheet>

      <Sheet open={findOpen} onClose={() => setFindOpen(false)} title="Find friends" subtitle="People you’ve met at plans and nearby members.">
        <div className="list" style={{ gap: 8 }}>
          {suggestions.map((p) => {
            const sent = state.sentFriendRequests.includes(p.id);
            return (
              <div key={p.id} className="person-row card">
                <Avatar person={p} size={46} />
                <span className="grow" style={{ minWidth: 0 }}>
                  <strong className="ellipsis" style={{ display: 'block' }}>
                    {p.name}
                  </strong>
                  <small className="t-cap">{p.area}</small>
                </span>
                <button
                  type="button"
                  className={cx('btn btn-xs', sent ? 'btn-soft' : 'btn-primary')}
                  disabled={sent}
                  onClick={() => {
                    sendFriendRequest(p.id);
                    toast.show({ title: 'Friend request sent', body: p.name, avatar: p.avatar, icon: 'user' });
                  }}
                >
                  {sent ? 'Requested' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      </Sheet>

      <Sheet open={Boolean(inviteFor)} onClose={() => setInviteFor(null)} title={inviteFor ? `Invite ${firstName(inviteFor.name)} to…` : ''}>
        <div className="list">
          {myPlans.map((p) => {
            const done = (state.invited[p.id] || []).includes(inviteFor?.id) || p.attendees.includes(inviteFor?.id);
            return (
              <div key={p.id} className="person-row card">
                <Img src={p.image} alt="" activity={p.activity} className="mini-thumb" />
                <span className="grow" style={{ minWidth: 0 }}>
                  <strong className="ellipsis" style={{ display: 'block' }}>
                    {p.title}
                  </strong>
                  <small className="t-cap">{formatWhen(p.start)}</small>
                </span>
                <InviteButton
                  invited={done}
                  onClick={() => {
                    invite(p.id, inviteFor.id);
                    toast.show({ title: `Invited ${firstName(inviteFor.name)}`, body: p.title, avatar: inviteFor.avatar, icon: 'check' });
                  }}
                />
              </div>
            );
          })}
          {!myPlans.length && (
            <div className="t-center">
              <p className="t-sub">You don’t have upcoming plans yet.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-12"
                onClick={() => {
                  setInviteFor(null);
                  nav.go('/create');
                }}
              >
                Create a plan
              </button>
            </div>
          )}
        </div>
      </Sheet>
    </Screen>
  );
}
