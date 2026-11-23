import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarDays, ChevronRight, Plus, UserPlus } from 'lucide-react';
import { ACTIVITIES, HOME_TILES, PEOPLE } from '../data/catalog';
import { discoverPlans, getPerson, myUpcoming, unreadNotifications, useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { daysFromToday, formatWhen } from '../lib/dates';
import { useNav } from '../lib/nav';
import { fadeUp, pop, stagger } from '../lib/motion';
import { cx, firstName } from '../lib/utils';
import Logo, { YYMark } from '../components/Logo';
import { Screen } from '../components/Screen';
import { Avatar, Img, LocationButton, Segmented, ActivityIcon } from '../components/ui';
import { PlanNearbyRow, PlanPhotoCard, PlanRow } from '../components/PlanCards';
import { CitySheet } from '../components/Sheets';
import { EmptyCup } from '../components/Illustrations';
import { ACTIVITY_ICONS } from '../components/icons';

const tileFilter = (id) => (id === 'pickleball' ? 'sports' : id);

function Bellbutton() {
  const nav = useNav();
  const { state } = useStore();
  const unread = unreadNotifications(state);
  return (
    <motion.button type="button" className="icon-btn soft" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => nav.go('/notifications')} whileTap={{ scale: 0.9 }}>
      <motion.span
        style={{ display: 'grid' }}
        animate={unread ? { rotate: [0, -14, 12, -8, 6, 0] } : {}}
        transition={{ duration: 0.9, delay: 1.2, repeat: unread ? Infinity : 0, repeatDelay: 6 }}
      >
        <Bell size={22} strokeWidth={2.1} />
      </motion.span>
      {unread > 0 && <span className="dot-badge" />}
    </motion.button>
  );
}

function HomeHeader({ stacked = false }) {
  const { state } = useStore();
  const [cityOpen, setCityOpen] = useState(false);
  return (
    <div className="home-head">
      <div className="row between">
        <Logo size={27} />
        <div className="row gap-6">
          {!stacked && <LocationButton city={state.user.city} onClick={() => setCityOpen(true)} boxed />}
          <Bellbutton />
        </div>
      </div>
      {stacked && (
        <div style={{ marginLeft: -10, marginTop: 2 }}>
          <LocationButton city={state.user.city} onClick={() => setCityOpen(true)} />
        </div>
      )}
      <CitySheet open={cityOpen} onClose={() => setCityOpen(false)} />
    </div>
  );
}

function UpNext() {
  const nav = useNav();
  const { state } = useStore();
  const next = myUpcoming(state)[0];
  if (!next) return null;
  const today = daysFromToday(next.start) === 0;
  return (
    <motion.button variants={fadeUp} type="button" className="upnext pressable" onClick={() => nav.go(`/plan/${next.id}`)}>
      <span className="upnext-ic">
        <ActivityIcon activity={next.activity} size={20} strokeWidth={2.3} />
      </span>
      <span className="grow" style={{ minWidth: 0 }}>
        <small>Up next</small>
        <strong className="ellipsis">{next.title}</strong>
        <span className="t-cap">{formatWhen(next.start)}</span>
      </span>
      <span className="pill pill-accent">{today ? 'Check in' : 'View'}</span>
    </motion.button>
  );
}

function NearbyEmpty() {
  const nav = useNav();
  return (
    <motion.div variants={fadeUp} className="card card-pad t-center" style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
      <EmptyCup size={120} />
      <strong className="t-h4">A quiet day nearby.</strong>
      <p className="t-sub">Try another city or start a plan.</p>
      <button type="button" className="btn btn-primary btn-sm mt-8" onClick={() => nav.go('/create')}>
        <Plus size={17} strokeWidth={2.6} /> Create a plan
      </button>
    </motion.div>
  );
}

/* --------------------------------------------------------------------------
   A — Activity grid (launch default)
   -------------------------------------------------------------------------- */
function HomeGrid() {
  const nav = useNav();
  const { state } = useStore();
  const nearby = discoverPlans(state, { when: 'today' })
    .filter((p) => p.hostId !== 'me')
    .slice(0, 3);
  const nearbyAll = nearby.length ? nearby : discoverPlans(state, {}).slice(0, 3);

  return (
    <motion.div variants={stagger(0.06, 0.05)} initial="hidden" animate="show">
      <motion.h1 variants={fadeUp} className="t-h1 mt-8">
        What are you up for?
      </motion.h1>
      <motion.p variants={fadeUp} className="t-sub mt-4">
        A little plan. A great connection.
      </motion.p>

      <div className="tile-grid mt-16">
        {HOME_TILES.map((id, i) => (
          <motion.button
            key={id}
            type="button"
            variants={pop}
            whileTap={{ scale: 0.96 }}
            className={cx('tile', `tile-${id}`)}
            onClick={() => nav.go(`/discover?filter=${tileFilter(id)}`)}
          >
            <Img src={ACTIVITIES[id].tile} alt="" activity={id} className="tile-img" eager={i < 3} />
            <span className="tile-shade" />
            <span className="tile-label">{ACTIVITIES[id].label}</span>
          </motion.button>
        ))}
      </div>

      <motion.button variants={fadeUp} type="button" className="btn btn-primary btn-block btn-lg shine mt-16" onClick={() => nav.go('/create')}>
        <Plus size={22} strokeWidth={2.6} /> Create a plan
      </motion.button>

      <div className="mt-16">
        <UpNext />
      </div>

      <motion.div variants={fadeUp} className="section-head">
        <h3>Happening nearby</h3>
        <button type="button" className="link-accent" onClick={() => nav.go('/discover')}>
          See all
        </button>
      </motion.div>
      <motion.div className="list" variants={stagger(0.06)}>
        {nearbyAll.length ? nearbyAll.map((p) => <PlanNearbyRow key={p.id} plan={p} />) : <NearbyEmpty />}
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------------------------------------------------
   B — Today's picks
   -------------------------------------------------------------------------- */
function HomePicks() {
  const nav = useNav();
  const { state } = useStore();
  const [when, setWhen] = useState('today');
  const plans = discoverPlans(state, { when }).filter((p) => p.hostId !== 'me');
  const [hero, ...rest] = plans;

  return (
    <motion.div variants={stagger(0.06, 0.05)} initial="hidden" animate="show">
      <motion.h1 variants={fadeUp} className="t-h1 mt-8">
        Make today a<br />
        good day.
      </motion.h1>
      <motion.div variants={fadeUp} className="mt-16">
        <Segmented
          value={when}
          onChange={setWhen}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'tomorrow', label: 'Tomorrow' },
            { value: 'weekend', label: 'Weekend' },
          ]}
        />
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div key={when} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
          {hero ? (
            <>
              <button type="button" className="picks-hero pressable mt-16" onClick={() => nav.go(`/plan/${hero.id}`)}>
                <Img src={hero.image} alt="" activity={hero.activity} style={{ position: 'absolute', inset: 0 }} scrim />
                <span className="picks-hero-info">
                  <strong>{hero.title}</strong>
                  <span>
                    <CalendarDays size={15} strokeWidth={2.2} />
                    {formatWhen(hero.start)}
                  </span>
                </span>
                <span className="btn btn-primary btn-sm picks-hero-btn">View plan</span>
              </button>
              <div className="list mt-12">
                {rest.slice(0, 3).map((p) => (
                  <PlanRow key={p.id} plan={p} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-16">
              <NearbyEmpty />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <motion.button variants={fadeUp} type="button" className="btn btn-outline btn-block mt-16 accent-outline-btn" onClick={() => nav.go('/create')}>
        <Plus size={20} strokeWidth={2.6} /> Create a plan
      </motion.button>
    </motion.div>
  );
}

/* --------------------------------------------------------------------------
   C — Quick start
   -------------------------------------------------------------------------- */
const MOODS = ['coffee', 'walk', 'sports', 'food', 'movies', 'travel'];

function HomeQuick() {
  const nav = useNav();
  const { state } = useStore();
  const nearby = discoverPlans(state, { when: 'today' })
    .filter((p) => p.hostId !== 'me')
    .slice(0, 3);
  return (
    <motion.div variants={stagger(0.06, 0.05)} initial="hidden" animate="show">
      <motion.div variants={pop} className="quick-hero mt-8">
        <div>
          <h2>
            Free for
            <br />
            an hour?
          </h2>
          <button type="button" className="btn btn-dark btn-sm mt-16" onClick={() => nav.go('/discover?when=today')}>
            Find a plan <ChevronRight size={17} strokeWidth={2.6} />
          </button>
        </div>
        <span className="quick-hero-mark">
          <YYMark animate />
        </span>
      </motion.div>

      <motion.h3 variants={fadeUp} className="t-h3 mt-24">
        Choose your mood
      </motion.h3>
      <div className="mood-grid mt-12">
        {MOODS.map((id) => {
          const Icon = ACTIVITY_ICONS[id];
          return (
            <motion.button
              key={id}
              type="button"
              variants={pop}
              whileTap={{ scale: 0.93 }}
              className="mood"
              onClick={() => (id === 'travel' ? nav.go('/discover') : nav.go(`/discover?filter=${id}`))}
            >
              <Icon size={30} strokeWidth={1.8} />
              <span>{ACTIVITIES[id].label}</span>
            </motion.button>
          );
        })}
      </div>

      <motion.div variants={fadeUp} className="section-head">
        <h3>Nearby plans</h3>
        <button type="button" className="link-accent" onClick={() => nav.go('/discover')}>
          See all <ChevronRight size={16} strokeWidth={2.4} />
        </button>
      </motion.div>
      <motion.div className="list" variants={stagger(0.06)}>
        {nearby.length ? nearby.map((p) => <PlanRow key={p.id} plan={p} showGoing />) : <NearbyEmpty />}
      </motion.div>
      <motion.div variants={fadeUp} className="row center mt-16">
        <button type="button" className="text-link accent" onClick={() => nav.go('/create')}>
          Start your own plan
        </button>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------------------------------------------------
   D — Your circle
   -------------------------------------------------------------------------- */
const CIRCLE = ['rohit', 'ananya', 'karthik', 'megha', 'sid', 'diya', 'aarav'];

function HomeCircle() {
  const nav = useNav();
  const toast = useToast();
  const { state, acceptInvite, declineInvite } = useStore();
  const invite = state.invites.find((i) => i.status === 'pending');
  const invitePlan = invite ? state.plans[invite.planId] : null;
  const from = invite ? getPerson(state, invite.fromId) : null;
  const ideas = useMemo(
    () =>
      discoverPlans(state, {})
        .filter((p) => p.hostId !== 'me' && !state.joins[p.id])
        .slice(0, 6),
    [state],
  );

  return (
    <motion.div variants={stagger(0.06, 0.05)} initial="hidden" animate="show">
      <motion.h1 variants={fadeUp} className="t-h1 mt-8">
        Good plans
        <br />
        start here.
      </motion.h1>
      <motion.div variants={fadeUp} className="circle-row mt-16">
        {CIRCLE.map((id, i) => {
          const p = PEOPLE[id];
          return (
            <motion.button
              key={id}
              type="button"
              className="circle-person"
              onClick={() => nav.go(`/person/${id}`)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              whileTap={{ scale: 0.92 }}
            >
              <Avatar person={p} size={58} ring={i === 0} />
              <span>{firstName(p.name)}</span>
            </motion.button>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {invite && invitePlan && (
          <motion.div
            key={invite.id}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.35 } }}
            className="invite-card mt-16"
          >
            <span className="invite-ic">
              <ActivityIcon activity={invitePlan.activity} size={24} strokeWidth={2} />
            </span>
            <span className="grow" style={{ minWidth: 0 }}>
              <small>You’re invited · {firstName(from.name)}</small>
              <strong className="ellipsis">{invitePlan.title}</strong>
              <span>
                <CalendarDays size={14} strokeWidth={2.2} /> {formatWhen(invitePlan.start)}
              </span>
            </span>
            <span className="col gap-6">
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={() => {
                  const id = acceptInvite(invite.id);
                  toast.show({ title: 'Invite accepted', body: `You’re in for ${invitePlan.title}.`, avatar: from.avatar, icon: 'check', to: `/plan/${id}` });
                }}
              >
                Accept
              </button>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => declineInvite(invite.id)}>
                Not now
              </button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="section-head">
        <h3>Plans you might like</h3>
        <button type="button" className="link-accent" onClick={() => nav.go('/discover')}>
          See all
        </button>
      </motion.div>
      <motion.div className="h-scroll" variants={stagger(0.07)}>
        {ideas.map((p) => (
          <PlanPhotoCard key={p.id} plan={p} />
        ))}
        {!ideas.length && <NearbyEmpty />}
      </motion.div>

      <motion.button variants={fadeUp} type="button" className="btn btn-primary btn-block btn-lg shine mt-20" onClick={() => nav.go('/friends')}>
        <UserPlus size={20} strokeWidth={2.4} /> Bring friends together
      </motion.button>
    </motion.div>
  );
}

const LAYOUTS = { grid: HomeGrid, picks: HomePicks, quick: HomeQuick, circle: HomeCircle };

export default function Home() {
  const { state } = useStore();
  const layout = LAYOUTS[state.settings.homeLayout] ? state.settings.homeLayout : 'grid';
  const Layout = LAYOUTS[layout];
  return (
    <Screen tabs header={<HomeHeader stacked={layout === 'grid'} />}>
      <Layout />
    </Screen>
  );
}

