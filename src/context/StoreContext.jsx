import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ACTIVITIES, PEOPLE, REPLIES, resolveVenue } from '../data/catalog';
import { createSeed, defaultSettings, defaultUser, ME, STATE_VERSION } from '../data/seed';
import { at, DAY, dayKey, daysFromToday, isWeekend, startOfDay } from '../lib/dates';
import { load, remove, save } from '../lib/storage';
import { createAccount, deleteAccountRecord, stateKeyFor, verifyLogin } from '../lib/accounts';
import { firstName, haptic, pick, uid } from '../lib/utils';
import { useToast } from './ToastContext';

const SESSION_KEY = 'fryyday:session'; // id of the account that is logged in on this device
const keyFor = (state) => stateKeyFor(state.session?.accountId);
const StoreContext = createContext(null);

/* --------------------------------------------------------------------------
   State bootstrapping
   -------------------------------------------------------------------------- */

function freshState(keep = {}) {
  return {
    version: STATE_VERSION,
    session: { onboarded: false, loggedIn: false },
    user: defaultUser(),
    settings: defaultSettings(),
    ...createSeed(),
    votes: {},
    views: {},
    ...keep,
  };
}

function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Demo data is relative to "today". When the app is opened on a later day, slide every timestamp forward. */
function rebase(state) {
  const today = dayKey();
  if (!state.seedDay || state.seedDay === today) return state;
  const delta = startOfDay().getTime() - parseDayKey(state.seedDay).getTime();
  const days = Math.round(delta / DAY);
  if (!days) return { ...state, seedDay: today };
  const shift = days * DAY;
  const s = structuredClone(state);
  Object.values(s.plans).forEach((p) => {
    p.start += shift;
    if (p.change) p.change.at += shift;
  });
  Object.values(s.chats).forEach((c) => c.messages.forEach((m) => (m.at += shift)));
  s.notifications.forEach((n) => (n.at += shift));
  s.requests.forEach((r) => (r.at += shift));
  s.invites.forEach((i) => (i.at += shift));
  s.seedDay = today;
  return s;
}

/** Load a saved state blob, or null when it is missing / from an older app version. */
function restore(key) {
  const saved = load(key, null);
  if (!saved || saved.version !== STATE_VERSION || !saved.plans || !saved.session) return null;
  try {
    // Older saves (before voting existed) have no `votes` map — add it without wiping the user's data.
    // Same for `views` (added later).
    return rebase({
      ...saved,
      votes: saved.votes && typeof saved.votes === 'object' ? saved.votes : {},
      views: saved.views && typeof saved.views === 'object' ? saved.views : {},
    });
  } catch {
    return null;
  }
}

function initState() {
  const accountId = load(SESSION_KEY, null);
  if (typeof accountId === 'string' && accountId) {
    const mine = restore(stateKeyFor(accountId));
    if (mine) return { ...mine, session: { ...mine.session, accountId, loggedIn: true } };
    remove(SESSION_KEY);
  }
  return restore(stateKeyFor(null)) || freshState();
}

/** Write a state blob to its own slot right now (used before switching accounts). */
function persist(state) {
  const key = keyFor(state);
  if (!save(key, state)) {
    // Storage full (e.g. a very large photo) — save without the photo.
    save(key, { ...state, user: { ...state.user, photo: null } });
  }
}

const sys = (text) => ({ id: uid('m'), from: 'system', kind: 'system', text, at: Date.now() });
const message = (from, text, extra = {}) => ({ id: uid('m'), from, text, at: Date.now(), ...extra });

/* --------------------------------------------------------------------------
   Selectors (pure helpers — import and call with state)
   -------------------------------------------------------------------------- */

export function getPerson(state, id) {
  if (id === ME) {
    return {
      id: ME,
      name: state.user.name || 'You',
      avatar: state.user.photo,
      area: state.user.area,
      bio: state.user.bio,
      interests: state.user.interests,
      isMe: true,
    };
  }
  return PEOPLE[id] || { id, name: 'Member', avatar: null };
}

/** Where a signed-up user should continue profile setup (resumes at the first unfinished step). */
export function setupPath(state) {
  const u = state.user || {};
  const hasName = !!u.name && u.name.trim().length >= 2;
  // setupStep is saved as each step is finished (1 = profile, 2 = interests, 3 = area).
  const step = Math.min(hasName ? Number(u.setupStep) || 2 : 1, 3);
  if (step <= 1) return '/setup/profile';
  if (step === 2 || !Array.isArray(u.interests) || u.interests.length < 3) return '/setup/interests';
  return '/setup/area';
}

/** Where the app should open for this session. */
export function homePath(state) {
  if (!state.session.loggedIn) return '/welcome';
  if (!state.session.onboarded) return setupPath(state);
  return '/home';
}

export function spotsLeft(plan) {
  return Math.max(0, plan.capacity - plan.attendees.length);
}

export function myRole(state, plan) {
  if (!plan) return 'none';
  if (plan.hostId === ME) return 'host';
  return state.joins[plan.id] || 'none';
}

export function isMine(state, plan) {
  const r = myRole(state, plan);
  return r === 'host' || r === 'joined';
}

export function myChats(state) {
  return Object.values(state.chats)
    .filter((c) => c.members.includes(ME))
    .sort((a, b) => (b.messages.at(-1)?.at || 0) - (a.messages.at(-1)?.at || 0));
}

export function inboxBadge(state) {
  const reqs = state.requests.filter((r) => r.dir === 'in' && r.status === 'pending').length;
  const unread = myChats(state).reduce((n, c) => n + (c.unread || 0), 0);
  return reqs + unread;
}

export function unreadNotifications(state) {
  return state.notifications.filter((n) => !n.read).length;
}

export function myUpcoming(state) {
  return Object.values(state.plans)
    .filter((p) => p.status === 'upcoming' && isMine(state, p))
    .sort((a, b) => a.start - b.start);
}

export function myPast(state) {
  return Object.values(state.plans)
    .filter((p) => p.status === 'past' && isMine(state, p))
    .sort((a, b) => b.start - a.start);
}

export function matchesWhen(plan, when) {
  const d = daysFromToday(plan.start);
  if (when === 'today') return d === 0;
  if (when === 'tomorrow') return d === 1;
  if (when === 'weekend') return d >= 0 && d <= 6 && isWeekend(plan.start);
  return d >= 0;
}

export function discoverPlans(state, { filter = 'all', when = 'any', q = '', sort = 'soon' } = {}) {
  if (state.user.city && state.user.city !== 'Hyderabad') return [];
  const query = q.trim().toLowerCase();
  return Object.values(state.plans)
    .filter((p) => p.status === 'upcoming')
    .filter((p) => !state.blocked.includes(p.hostId))
    .filter((p) => {
      if (!filter || filter === 'all') return true;
      if (filter === 'sports') return p.activity === 'sports' || p.activity === 'pickleball';
      return p.activity === filter;
    })
    .filter((p) => matchesWhen(p, when))
    .filter(
      (p) =>
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.venue.toLowerCase().includes(query) ||
        p.area.toLowerCase().includes(query) ||
        (ACTIVITIES[p.activity]?.label || '').toLowerCase().includes(query),
    )
    .sort((a, b) => (sort === 'top' ? voteTally(state, b).score - voteTally(state, a).score : 0) || a.start - b.start);
}

/* ---------- voting ---------- */

/** Stable pseudo-random number for a plan id, so demo vote counts never jump between reloads. */
function hashId(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Votes from everyone else. New plans start at 0; demo plans get believable counts. */
export function baseVotes(plan) {
  if (Number.isFinite(plan.ups) || Number.isFinite(plan.downs)) return { ups: plan.ups || 0, downs: plan.downs || 0 };
  if (plan.hostId === ME) return { ups: 0, downs: 0 };
  const h = hashId(plan.id);
  return { ups: 8 + (h % 54), downs: (h >>> 8) % 7 };
}

export function myVote(state, planId) {
  const v = state.votes?.[planId];
  return v === 1 || v === -1 ? v : 0;
}

export function voteTally(state, plan) {
  const base = baseVotes(plan);
  const mine = myVote(state, plan.id);
  const ups = base.ups + (mine === 1 ? 1 : 0);
  const downs = base.downs + (mine === -1 ? 1 : 0);
  const total = ups + downs;
  return { ups, downs, score: ups - downs, mine, percent: total ? Math.round((ups / total) * 100) : 0 };
}

/* ---------- views ---------- */

/**
 * How many people have looked at a plan.
 * Demo plans get a stable believable count; your own new plans start at 0 and pick up
 * views over the first hours after publishing. Opening someone else's plan adds your view once.
 */
export function planViews(state, plan) {
  if (!plan) return 0;
  let base;
  if (Number.isFinite(plan.views)) base = plan.views;
  else if (plan.hostId === ME) {
    const mins = Math.max(0, (Date.now() - (plan.createdAt || Date.now())) / 60000);
    base = Math.min(480, Math.floor(Math.sqrt(mins) * 7));
  } else {
    const h = hashId(plan.id);
    base = 40 + ((h >>> 4) % 320);
  }
  const mine = plan.hostId !== ME && state.views?.[plan.id] ? 1 : 0;
  return base + mine;
}

export function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k views`;
  return `${n} view${n === 1 ? '' : 's'}`;
}

export function chatForPlan(state, plan) {
  return plan?.chatId ? state.chats[plan.chatId] : null;
}

/* --------------------------------------------------------------------------
   Provider
   -------------------------------------------------------------------------- */

export function StoreProvider({ children }) {
  const toast = useToast();
  const [state, setState] = useState(initState);
  const [typing, setTyping] = useState({}); // chatId -> personId (not persisted)
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const timers = useRef(new Set());
  const activeChat = useRef(null);

  /* Persist (debounced) */
  useEffect(() => {
    const t = setTimeout(() => persist(state), 250);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((t) => clearTimeout(t));
      set.clear();
    };
  }, []);

  const set = useCallback((mutate) => {
    setState((prev) => {
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
  }, []);

  const schedule = useCallback((fn, ms) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  const notify = useCallback((t) => toastRef.current.show(t), []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    setTyping({});
  }, []);

  /* ---------- simulated "other people" ---------- */

  const incomingMessage = useCallback(
    (chatId, from, text) => {
      const chat = stateRef.current.chats[chatId];
      if (!chat) return;
      const viewing = activeChat.current === chatId;
      set((s) => {
        const c = s.chats[chatId];
        if (!c) return;
        c.messages.push(message(from, text));
        if (!viewing) c.unread = (c.unread || 0) + 1;
      });
      if (!viewing && stateRef.current.settings.notifications.messages) {
        const p = getPerson(stateRef.current, from);
        notify({ title: `${firstName(p.name)} · ${chat.title}`, body: text, avatar: p.avatar, icon: 'chat', to: `/chat/${chatId}` });
      }
    },
    [set, notify],
  );

  const simulateReply = useCallback(
    (chatId, delay = 1300) => {
      const chat = stateRef.current.chats[chatId];
      if (!chat) return;
      const others = chat.members.filter((m) => m !== ME && !stateRef.current.blocked.includes(m));
      if (!others.length) return;
      const who = pick(others);
      schedule(() => setTyping((t) => ({ ...t, [chatId]: who })), delay);
      schedule(() => {
        setTyping((t) => {
          const n = { ...t };
          delete n[chatId];
          return n;
        });
        incomingMessage(chatId, who, pick(REPLIES));
      }, delay + 2100);
    },
    [schedule, incomingMessage],
  );

  const approveMyRequest = useCallback(
    (planId, reqId) => {
      const s0 = stateRef.current;
      if (s0.joins[planId] !== 'pending') return;
      const plan = s0.plans[planId];
      if (!plan) return;
      const host = getPerson(s0, plan.hostId);
      const chatId = plan.chatId || `c-${planId}`;
      set((s) => {
        const pl = s.plans[planId];
        s.joins[planId] = 'joined';
        const req = s.requests.find((r) => r.id === reqId);
        if (req) req.status = 'accepted';
        if (!pl.attendees.includes(ME)) pl.attendees.push(ME);
        pl.chatId = chatId;
        if (!s.chats[chatId]) {
          s.chats[chatId] = {
            id: chatId,
            planId,
            title: pl.title,
            members: [pl.hostId, ...pl.attendees.filter((a) => a !== ME)],
            unread: 0,
            messages: [message(pl.hostId, `Hey everyone! Excited for ${pl.title} 🙌`, { at: Date.now() - 60000 })],
          };
        }
        const c = s.chats[chatId];
        if (!c.members.includes(ME)) c.members.push(ME);
        c.messages.push(sys(`${firstName(host.name)} accepted your request — say hi 👋`));
        c.unread = (c.unread || 0) + 1;
        s.notifications.unshift({ id: uid('n'), type: 'accepted', planId, personId: pl.hostId, at: Date.now(), read: false });
      });
      haptic(18);
      notify({
        title: 'You’re in!',
        body: `${firstName(host.name)} accepted your request.`,
        avatar: host.avatar,
        icon: 'check',
        to: `/chat/${chatId}`,
      });
    },
    [set, notify],
  );

  const incomingRequest = useCallback(
    (planId, personId, text) => {
      const s0 = stateRef.current;
      const plan = s0.plans[planId];
      if (!plan || plan.status !== 'upcoming') return;
      if (s0.requests.some((r) => r.planId === planId && r.personId === personId)) return;
      const person = getPerson(s0, personId);
      set((s) => {
        s.requests.unshift({ id: uid('r'), planId, personId, message: text, status: 'pending', dir: 'in', at: Date.now() });
        s.notifications.unshift({ id: uid('n'), type: 'request', planId, personId, at: Date.now(), read: false });
      });
      if (s0.settings.notifications.requests) {
        notify({ title: `${firstName(person.name)} wants to join`, body: plan.title, avatar: person.avatar, icon: 'user', to: '/inbox' });
      }
    },
    [set, notify],
  );

  /* Resume pending join requests after a reload. */
  useEffect(() => {
    if (!stateRef.current.session.loggedIn) return;
    stateRef.current.requests
      .filter((r) => r.dir === 'out' && r.status === 'pending')
      .forEach((r, i) => schedule(() => approveMyRequest(r.planId, r.id), 2500 + i * 1500));
    // run on mount and whenever a different account logs in
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.session.accountId]);

  /* ---------- public API ---------- */

  const api = useMemo(
    () => ({
      /* session & profile */
      startSession(phone) {
        set((s) => {
          s.session.loggedIn = true;
          if (phone) s.user.phone = phone;
        });
      },
      completeOnboarding() {
        set((s) => {
          s.session.onboarded = true;
          s.session.loggedIn = true;
        });
      },
      updateUser(fields) {
        set((s) => {
          Object.assign(s.user, fields);
        });
      },
      setSetting(key, value) {
        set((s) => {
          s.settings[key] = value;
        });
      },
      setNotificationSetting(key, value) {
        set((s) => {
          s.settings.notifications[key] = value;
        });
      },
      /** Create an account on this device. Returns { ok } or { ok: false, field, error }. */
      signUp(phone, password) {
        const res = createAccount(phone, password);
        if (!res.ok) return res;
        persist(stateRef.current);
        clearTimers();
        const next = freshState({
          session: { loggedIn: true, onboarded: false, accountId: res.account.id },
          user: { ...defaultUser(), phone },
        });
        save(SESSION_KEY, res.account.id);
        persist(next);
        setState(next);
        return { ok: true, onboarded: false };
      },
      /** Log in with phone + password. Returns { ok, onboarded } or { ok: false, field, error }. */
      logIn(phone, password) {
        const res = verifyLogin(phone, password);
        if (!res.ok) return res;
        const id = res.account.id;
        persist(stateRef.current);
        clearTimers();
        const saved = restore(stateKeyFor(id));
        const next = saved
          ? { ...saved, session: { ...saved.session, loggedIn: true, accountId: id } }
          : freshState({ session: { loggedIn: true, onboarded: false, accountId: id }, user: { ...defaultUser(), phone } });
        save(SESSION_KEY, id);
        setState(next);
        return { ok: true, onboarded: !!next.session.onboarded, name: next.user.name, setupPath: setupPath(next) };
      },
      logout() {
        const cur = stateRef.current;
        if (!cur.session.accountId) {
          set((s) => {
            s.session.loggedIn = false;
          });
          return;
        }
        persist({ ...cur, draft: null });
        clearTimers();
        remove(SESSION_KEY);
        // Back to the signed-out "guest" slot (keeps any older pre-accounts data on this device intact).
        const guest = restore(stateKeyFor(null));
        setState(guest ? { ...guest, session: { onboarded: false, loggedIn: false } } : freshState());
      },
      deleteAccount() {
        clearTimers();
        const id = stateRef.current.session.accountId;
        if (id) {
          deleteAccountRecord(id);
          remove(SESSION_KEY);
        } else {
          remove(stateKeyFor(null));
        }
        setState(freshState());
      },
      resetDemo() {
        timers.current.forEach((t) => clearTimeout(t));
        timers.current.clear();
        setState((prev) => freshState({ session: prev.session, user: prev.user, settings: prev.settings }));
      },

      /* plans */
      toggleSave(planId) {
        const saved = stateRef.current.saved.includes(planId);
        set((s) => {
          s.saved = saved ? s.saved.filter((x) => x !== planId) : [planId, ...s.saved];
        });
        return !saved;
      },
      requestJoin(planId, text) {
        const plan = stateRef.current.plans[planId];
        if (!plan) return 'missing';
        const reqId = uid('r');
        if (spotsLeft(plan) <= 0) {
          set((s) => {
            s.joins[planId] = 'waitlist';
            s.waitlist[planId] = 2;
            s.requests.unshift({ id: reqId, planId, personId: plan.hostId, message: text, status: 'waitlist', dir: 'out', at: Date.now() });
          });
          return 'waitlist';
        }
        set((s) => {
          s.joins[planId] = 'pending';
          s.requests.unshift({ id: reqId, planId, personId: plan.hostId, message: text, status: 'pending', dir: 'out', at: Date.now() });
        });
        schedule(() => approveMyRequest(planId, reqId), 3800);
        return 'pending';
      },
      cancelRequest(planId) {
        set((s) => {
          delete s.joins[planId];
          s.requests = s.requests.filter((r) => !(r.dir === 'out' && r.planId === planId && r.status === 'pending'));
        });
      },
      leavePlan(planId) {
        set((s) => {
          const pl = s.plans[planId];
          delete s.joins[planId];
          if (pl) {
            pl.attendees = pl.attendees.filter((a) => a !== ME);
            const c = pl.chatId && s.chats[pl.chatId];
            if (c) {
              c.members = c.members.filter((m) => m !== ME);
              c.messages.push(sys(`${firstName(s.user.name || 'A member')} left the plan`));
            }
          }
          s.requests = s.requests.filter((r) => !(r.dir === 'out' && r.planId === planId));
          delete s.checkins[planId];
        });
      },
      leaveWaitlist(planId) {
        set((s) => {
          delete s.joins[planId];
          delete s.waitlist[planId];
          s.requests = s.requests.filter((r) => !(r.dir === 'out' && r.planId === planId));
        });
      },
      acceptInvite(inviteId) {
        const inv = stateRef.current.invites.find((i) => i.id === inviteId);
        if (!inv) return null;
        const plan = stateRef.current.plans[inv.planId];
        const chatId = plan.chatId || `c-${plan.id}`;
        set((s) => {
          const i = s.invites.find((x) => x.id === inviteId);
          i.status = 'accepted';
          const pl = s.plans[i.planId];
          s.joins[pl.id] = 'joined';
          if (!pl.attendees.includes(ME)) pl.attendees.push(ME);
          pl.chatId = chatId;
          if (!s.chats[chatId]) {
            s.chats[chatId] = {
              id: chatId,
              planId: pl.id,
              title: pl.title,
              members: [pl.hostId, ...pl.attendees.filter((a) => a !== ME)],
              unread: 0,
              messages: [message(pl.hostId, `So glad you can make it! 🍿`, { at: Date.now() - 60000 })],
            };
          }
          const c = s.chats[chatId];
          if (!c.members.includes(ME)) c.members.push(ME);
          c.messages.push(sys(`${firstName(s.user.name || 'You')} joined via invite`));
        });
        haptic(18);
        return plan.id;
      },
      declineInvite(inviteId) {
        set((s) => {
          const i = s.invites.find((x) => x.id === inviteId);
          if (i) i.status = 'declined';
        });
      },
      respondRequest(reqId, accept) {
        const s0 = stateRef.current;
        const r = s0.requests.find((x) => x.id === reqId);
        if (!r) return false;
        const plan = s0.plans[r.planId];
        const person = getPerson(s0, r.personId);
        if (accept && plan && spotsLeft(plan) <= 0) {
          notify({ title: 'This plan is full', body: 'Add an open spot before accepting.', icon: 'alert', tone: 'danger' });
          return false;
        }
        set((s) => {
          const req = s.requests.find((x) => x.id === reqId);
          req.status = accept ? 'accepted' : 'declined';
          if (!accept) return;
          const pl = s.plans[req.planId];
          if (!pl) return;
          if (!pl.attendees.includes(req.personId)) pl.attendees.push(req.personId);
          const chatId = pl.chatId || `c-${pl.id}`;
          pl.chatId = chatId;
          if (!s.chats[chatId]) {
            s.chats[chatId] = { id: chatId, planId: pl.id, title: pl.title, members: [ME], unread: 0, messages: [] };
          }
          const c = s.chats[chatId];
          if (!c.members.includes(req.personId)) c.members.push(req.personId);
          c.messages.push(sys(`${firstName(person.name)} joined the plan`));
        });
        if (accept) {
          haptic(18);
          notify({
            title: `${firstName(person.name)} is in!`,
            body: `Group chat is open for ${plan.title}.`,
            avatar: person.avatar,
            icon: 'check',
            to: `/chat/${plan.chatId || `c-${plan.id}`}`,
          });
          schedule(() => incomingMessage(plan.chatId || `c-${plan.id}`, r.personId, 'Thanks for having me! 😊'), 2600);
        }
        return true;
      },
      setDraft(draft) {
        set((s) => {
          s.draft = draft;
        });
      },
      clearDraft() {
        set((s) => {
          s.draft = null;
        });
      },
      createPlan(draft) {
        const id = uid('p');
        const chatId = `c-${id}`;
        const v = resolveVenue(draft.venue, draft.venueArea || stateRef.current.user.area || 'Jubilee Hills');
        const act = ACTIVITIES[draft.activity] || ACTIVITIES.coffee;
        const plan = {
          id,
          title: draft.title.trim() || act.defaultTitle,
          activity: draft.activity,
          hostId: ME,
          start: at(draft.dayOffset, draft.time),
          durationMin: 90,
          venue: v.name,
          area: v.area,
          km: v.km,
          map: v.map,
          capacity: draft.spots,
          attendees: [],
          image: act.cover,
          about: draft.about?.trim() || act.defaultAbout,
          chatId,
          status: 'upcoming',
          audience: draft.audience,
          createdAt: Date.now(),
        };
        set((s) => {
          s.plans[id] = plan;
          s.chats[chatId] = {
            id: chatId,
            planId: id,
            title: plan.title,
            members: [ME],
            unread: 0,
            messages: [sys('You created this plan. Requests will appear in your inbox.')],
          };
          s.draft = null;
        });
        schedule(() => incomingRequest(id, 'rahul', 'Would love to join you!'), 7000);
        schedule(() => incomingRequest(id, 'meera', 'Count me in! 😊'), 16000);
        return id;
      },
      updatePlan(planId, changes) {
        const before = stateRef.current.plans[planId];
        if (!before) return 0;
        const parts = [];
        if (changes.venue && changes.venue !== before.venue) parts.push(`venue → ${changes.venue}`);
        if (changes.start && changes.start !== before.start) parts.push('time updated');
        if (changes.capacity && changes.capacity !== before.capacity) parts.push(`${changes.capacity} spots`);
        set((s) => {
          const pl = s.plans[planId];
          const v = changes.venue ? resolveVenue(changes.venue, pl.area) : null;
          if (changes.venue && changes.venue !== pl.venue) {
            pl.change = { field: 'venue', from: pl.venue, to: changes.venue, at: Date.now() };
          } else if (changes.start && changes.start !== pl.start) {
            pl.change = { field: 'time', from: pl.start, to: changes.start, at: Date.now() };
          }
          Object.assign(pl, changes);
          if (v) Object.assign(pl, { area: v.area, km: v.km, map: v.map });
          const c = pl.chatId && s.chats[pl.chatId];
          if (c && parts.length) c.messages.push(sys(`Plan updated: ${parts.join(', ')}`));
        });
        return before.attendees.length;
      },
      cancelPlan(planId, reason) {
        set((s) => {
          const pl = s.plans[planId];
          if (!pl) return;
          pl.status = 'cancelled';
          pl.cancelReason = reason || '';
          const c = pl.chatId && s.chats[pl.chatId];
          if (c) c.messages.push(sys(`Plan cancelled${reason ? ` — ${reason}` : ''}`));
          s.requests.forEach((r) => {
            if (r.planId === planId && r.status === 'pending') r.status = 'declined';
          });
        });
        haptic(12);
      },
      checkIn(planId) {
        set((s) => {
          s.checkins[planId] = Date.now();
          const pl = s.plans[planId];
          const c = pl?.chatId && s.chats[pl.chatId];
          if (c) c.messages.push(sys(`${firstName(s.user.name || 'You')} checked in 📍`));
        });
        haptic(24);
      },
      undoCheckIn(planId) {
        set((s) => {
          delete s.checkins[planId];
        });
      },
      submitReview(planId, review) {
        set((s) => {
          s.reviews[planId] = { ...review, at: Date.now() };
          s.notifications.forEach((n) => {
            if (n.type === 'review' && n.planId === planId) n.read = true;
          });
        });
      },

      /* voting — dir is 1 (up) or -1 (down); tapping the same arrow again removes the vote */
      vote(planId, dir) {
        const s0 = stateRef.current;
        const plan = s0.plans[planId];
        if (!plan || (dir !== 1 && dir !== -1)) return 0;
        if (plan.hostId === ME) return myVote(s0, planId);
        const next = myVote(s0, planId) === dir ? 0 : dir;
        set((s) => {
          if (!s.votes) s.votes = {};
          if (next) s.votes[planId] = next;
          else delete s.votes[planId];
        });
        haptic(next ? 10 : 6);
        return next;
      },

      /* views — counts once per person per plan; hosts don't add views to their own plans */
      recordView(planId) {
        const s0 = stateRef.current;
        const plan = s0.plans[planId];
        if (!plan || plan.hostId === ME || s0.views?.[planId]) return;
        set((s) => {
          if (!s.views) s.views = {};
          s.views[planId] = Date.now();
        });
      },

      /* chat */
      setActiveChat(chatId) {
        activeChat.current = chatId;
      },
      sendMessage(chatId, text, extra = {}) {
        const id = uid('m');
        set((s) => {
          const c = s.chats[chatId];
          if (!c) return;
          c.messages.push({ id, from: ME, text, at: Date.now(), status: 'sent', ...extra });
        });
        schedule(
          () =>
            set((s) => {
              const m = s.chats[chatId]?.messages.find((x) => x.id === id);
              if (m) m.status = 'read';
            }),
          1100,
        );
        simulateReply(chatId);
      },
      markChatRead(chatId) {
        if (!stateRef.current.chats[chatId]?.unread) return;
        set((s) => {
          if (s.chats[chatId]) s.chats[chatId].unread = 0;
          s.notifications.forEach((n) => {
            if (n.type === 'message' && n.chatId === chatId) n.read = true;
          });
        });
      },

      /* notifications */
      markAllRead() {
        if (!stateRef.current.notifications.some((n) => !n.read)) return;
        set((s) => {
          s.notifications.forEach((n) => (n.read = true));
        });
      },
      clearNotification(id) {
        set((s) => {
          s.notifications = s.notifications.filter((n) => n.id !== id);
        });
      },

      /* social */
      sendFriendRequest(personId) {
        set((s) => {
          if (!s.sentFriendRequests.includes(personId)) s.sentFriendRequests.push(personId);
        });
        schedule(() => {
          const p = getPerson(stateRef.current, personId);
          set((s) => {
            s.sentFriendRequests = s.sentFriendRequests.filter((x) => x !== personId);
            if (!s.friends.includes(personId)) s.friends.push(personId);
          });
          notify({ title: `${firstName(p.name)} accepted`, body: 'You’re now friends on Fryyday.', avatar: p.avatar, icon: 'heart', to: '/friends' });
        }, 4200);
      },
      acceptFriend(personId) {
        set((s) => {
          s.friendRequests = s.friendRequests.filter((x) => x !== personId);
          if (!s.friends.includes(personId)) s.friends.push(personId);
        });
        haptic(14);
      },
      ignoreFriend(personId) {
        set((s) => {
          s.friendRequests = s.friendRequests.filter((x) => x !== personId);
        });
      },
      removeFriend(personId) {
        set((s) => {
          s.friends = s.friends.filter((x) => x !== personId);
        });
      },
      invite(planId, personId) {
        set((s) => {
          const list = s.invited[planId] || [];
          if (!list.includes(personId)) s.invited[planId] = [...list, personId];
        });
        haptic(10);
      },
      block(personId) {
        set((s) => {
          if (!s.blocked.includes(personId)) s.blocked.push(personId);
          s.friends = s.friends.filter((x) => x !== personId);
        });
      },
      unblock(personId) {
        set((s) => {
          s.blocked = s.blocked.filter((x) => x !== personId);
        });
      },
      report(payload) {
        set((s) => {
          s.reports.push({ id: uid('rep'), at: Date.now(), ...payload });
          if (payload.block && payload.personId && !s.blocked.includes(payload.personId)) {
            s.blocked.push(payload.personId);
            s.friends = s.friends.filter((x) => x !== payload.personId);
          }
        });
      },
      setCity(city) {
        set((s) => {
          s.user.city = city;
        });
      },
    }),
    [set, schedule, notify, clearTimers, approveMyRequest, incomingRequest, incomingMessage, simulateReply],
  );

  const value = useMemo(() => ({ state, typing, ...api }), [state, typing, api]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export { ME };
