import { useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion, useIsPresent } from 'framer-motion';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { StoreProvider, useStore } from './context/StoreContext';
import DeviceFrame from './components/DeviceFrame';
import TabBar from './components/TabBar';
import OfflineOverlay from './components/OfflineOverlay';
import { EASE, EASE_IOS } from './lib/motion';
import { routeKind, TAB_PATHS } from './lib/nav';

import Splash from './screens/Splash';
import Welcome from './screens/Welcome';
import { AuthPhone } from './screens/Auth';
import { SetupProfile, SetupInterests, SetupArea } from './screens/Setup';
import Home from './screens/Home';
import Discover from './screens/Discover';
import PlanDetails from './screens/PlanDetails';
import Waitlist from './screens/Waitlist';
import { CreatePlan, ReviewPlan } from './screens/CreatePlan';
import Published from './screens/Published';
import Notifications from './screens/Notifications';
import Inbox from './screens/Inbox';
import GroupChat from './screens/GroupChat';
import CheckIn from './screens/CheckIn';
import ReviewMeetup from './screens/ReviewMeetup';
import { Profile, EditProfile } from './screens/Profile';
import { Settings, Appearance, Privacy, NotificationSettings, BlockedAccounts, Legal } from './screens/Settings';
import Report from './screens/Report';
import { HelpCenter, HelpTopic } from './screens/Help';
import AccountControls from './screens/AccountControls';
import { EditPlan, PlanChange } from './screens/EditPlan';
import { InviteFriends, Friends } from './screens/Friends';
import PersonProfile from './screens/PersonProfile';

/* --------------------------------------------------------------------------
   Page transitions (iOS-style push / modal / fade / tab cross-fade)
   -------------------------------------------------------------------------- */

const PUSH = { duration: 0.5, ease: EASE_IOS };
const MODAL = { duration: 0.55, ease: EASE_IOS };
const instantZ = { zIndex: { duration: 0 } };

const pageVariants = {
  initial: (t) => {
    const base = { x: 0, y: 0, scale: 1, opacity: 1 };
    if (t.mode === 'forward') {
      if (t.kind === 'push') return { ...base, x: '100%', zIndex: 3 };
      if (t.kind === 'modal') return { ...base, y: '100%', zIndex: 3 };
      if (t.kind === 'zoom') return { ...base, scale: 0.9, opacity: 0, zIndex: 3 };
      return { ...base, opacity: 0, scale: 0.985, zIndex: 3 };
    }
    if (t.mode === 'back') {
      if (t.kind === 'push') return { ...base, x: '-28%', zIndex: 1 };
      if (t.kind === 'modal') return { ...base, scale: 0.94, opacity: 0.6, zIndex: 1 };
      return { ...base, opacity: 0, zIndex: 1 };
    }
    if (t.mode === 'tab') return { ...base, opacity: 0, y: 12, zIndex: 3 };
    return { ...base, opacity: 0, zIndex: 3 };
  },
  animate: (t) => {
    let transition = { duration: 0.32, ease: EASE };
    if (t.mode === 'forward' && t.kind === 'push') transition = PUSH;
    else if (t.mode === 'forward' && t.kind === 'modal') transition = MODAL;
    else if (t.mode === 'forward' && t.kind === 'zoom') transition = { type: 'spring', stiffness: 260, damping: 26 };
    else if (t.mode === 'back' && t.kind === 'push') transition = PUSH;
    else if (t.mode === 'back' && t.kind === 'modal') transition = MODAL;
    else if (t.mode === 'tab') transition = { duration: 0.34, ease: EASE };
    return { x: 0, y: 0, scale: 1, opacity: 1, transition: { ...transition, ...instantZ } };
  },
  exit: (t) => {
    if (t.mode === 'forward') {
      if (t.kind === 'push') return { x: '-28%', opacity: 1, zIndex: 1, transition: { ...PUSH, ...instantZ } };
      if (t.kind === 'modal') return { scale: 0.94, opacity: 0.6, zIndex: 1, transition: { ...MODAL, ...instantZ } };
      return { opacity: 0, zIndex: 1, transition: { duration: 0.3, ...instantZ } };
    }
    if (t.mode === 'back') {
      if (t.kind === 'push') return { x: '100%', zIndex: 3, transition: { ...PUSH, ...instantZ } };
      if (t.kind === 'modal') return { y: '100%', zIndex: 3, transition: { ...MODAL, ...instantZ } };
      return { opacity: 0, scale: 0.985, zIndex: 3, transition: { duration: 0.28, ...instantZ } };
    }
    if (t.mode === 'tab') return { opacity: 0, zIndex: 1, transition: { duration: 0.16, ...instantZ } };
    return { opacity: 0, zIndex: 1, transition: { duration: 0.25, ...instantZ } };
  },
};

/* --------------------------------------------------------------------------
   Route guards
   -------------------------------------------------------------------------- */

// Guards only redirect for the page that is entering — never for a page that is animating out.
function RequireAuth({ children }) {
  const { state } = useStore();
  const present = useIsPresent();
  if (!present) return children;
  if (!state.session.loggedIn) return <Navigate to="/welcome" replace />;
  if (!state.session.onboarded) return <Navigate to="/setup/profile" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { state } = useStore();
  const present = useIsPresent();
  if (!present) return children;
  if (state.session.loggedIn && state.session.onboarded) return <Navigate to="/home" replace />;
  return children;
}

// Profile setup needs a logged-in (signed up) account that hasn't finished onboarding yet.
function SetupOnly({ children }) {
  const { state } = useStore();
  const present = useIsPresent();
  if (!present) return children;
  if (!state.session.loggedIn) return <Navigate to="/welcome" replace />;
  if (state.session.onboarded) return <Navigate to="/home" replace />;
  return children;
}

const authed = (el) => <RequireAuth>{el}</RequireAuth>;
const setup = (el) => <SetupOnly>{el}</SetupOnly>;
const guest = (el) => <GuestOnly>{el}</GuestOnly>;

function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<Splash />} />
      <Route path="/welcome" element={guest(<Welcome />)} />
      <Route path="/auth" element={guest(<AuthPhone />)} />
      <Route path="/auth/verify" element={<Navigate to="/auth" replace />} />
      <Route path="/setup/profile" element={setup(<SetupProfile />)} />
      <Route path="/setup/interests" element={setup(<SetupInterests />)} />
      <Route path="/setup/area" element={setup(<SetupArea />)} />

      <Route path="/home" element={authed(<Home />)} />
      <Route path="/discover" element={authed(<Discover />)} />
      <Route path="/inbox" element={authed(<Inbox />)} />
      <Route path="/profile" element={authed(<Profile />)} />

      <Route path="/notifications" element={authed(<Notifications />)} />
      <Route path="/plan/:id" element={authed(<PlanDetails />)} />
      <Route path="/plan/:id/waitlist" element={authed(<Waitlist />)} />
      <Route path="/plan/:id/checkin" element={authed(<CheckIn />)} />
      <Route path="/plan/:id/review" element={authed(<ReviewMeetup />)} />
      <Route path="/plan/:id/edit" element={authed(<EditPlan />)} />
      <Route path="/plan/:id/changed" element={authed(<PlanChange />)} />
      <Route path="/plan/:id/invite" element={authed(<InviteFriends />)} />
      <Route path="/plan/:id/published" element={authed(<Published />)} />
      <Route path="/create" element={authed(<CreatePlan />)} />
      <Route path="/create/review" element={authed(<ReviewPlan />)} />
      <Route path="/chat/:id" element={authed(<GroupChat />)} />
      <Route path="/person/:id" element={authed(<PersonProfile />)} />
      <Route path="/friends" element={authed(<Friends />)} />
      <Route path="/profile/edit" element={authed(<EditProfile />)} />
      <Route path="/settings" element={authed(<Settings />)} />
      <Route path="/settings/appearance" element={authed(<Appearance />)} />
      <Route path="/settings/privacy" element={authed(<Privacy />)} />
      <Route path="/settings/notifications" element={authed(<NotificationSettings />)} />
      <Route path="/settings/blocked" element={authed(<BlockedAccounts />)} />
      <Route path="/settings/account" element={authed(<AccountControls />)} />
      <Route path="/legal/:doc" element={<Legal />} />
      <Route path="/report" element={authed(<Report />)} />
      <Route path="/help" element={authed(<HelpCenter />)} />
      <Route path="/help/:topic" element={authed(<HelpTopic />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const navType = useNavigationType();
  const prev = useRef(location.pathname);

  const transition = useMemo(() => {
    const from = prev.current;
    const to = location.pathname;
    if (from === to) return { mode: 'none', kind: 'fade' };
    const fromKind = routeKind(from);
    const toKind = routeKind(to);
    if (fromKind === 'tab' && toKind === 'tab') return { mode: 'tab', kind: 'tab' };
    if (navType === 'POP') return { mode: 'back', kind: fromKind };
    if (toKind === 'tab' || toKind === 'fade') return { mode: 'fade', kind: 'fade' };
    return { mode: 'forward', kind: toKind };
    // compute once per navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    prev.current = location.pathname;
  }, [location]);

  const showTabs = TAB_PATHS.includes(location.pathname);

  return (
    <>
      <AnimatePresence initial={false} custom={transition}>
        <motion.div
          key={location.pathname}
          className="page-layer"
          custom={transition}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <AppRoutes location={location} />
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>{showTabs && <TabBar key="tabbar" />}</AnimatePresence>
      <OfflineOverlay />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <ToastProvider>
          <StoreProvider>
            <DeviceFrame>
              <AppShell />
            </DeviceFrame>
          </StoreProvider>
        </ToastProvider>
      </HashRouter>
    </ThemeProvider>
  );
}
