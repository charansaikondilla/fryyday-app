# Fryyday — Good plans. Great company.

A complete, working React frontend for **Fryyday**, the social meetup app from your design
("The app in the right order" flow + all screen mockups). Dark mode is the default, light mode
is fully supported, and every screen is animated.

## Live app

**https://charansaikondilla.github.io/fryyday-app/**

Open the link on any phone or computer. Every push to `main` rebuilds and redeploys it
automatically (GitHub Actions → GitHub Pages).

### Install it on your phone (works like a native app)

| Phone | How |
| --- | --- |
| **iPhone** (Safari) | Open the link → tap **Share** → **Add to Home Screen** → **Add** |
| **Android** (Chrome) | Open the link → tap **⋮** menu → **Add to Home screen** / **Install app** → **Install** |

The installed app opens full-screen from its own icon (no browser bar), keeps the iPhone
notch / Android status bar clear, and works offline after the first visit.

---

## Run it

Requirements: **Node.js 20 or newer** (check with `node -v`).

```bash
npm install
npm run dev
```

The app opens at **http://localhost:5173**.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app with hot reload |
| `npm run dev:phone` | Same, but reachable from your phone on the same Wi-Fi (open the "Network" URL it prints) |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |

The build uses relative paths and hash routing (`/#/home`), so the `dist/` folder works on any
static host — Netlify, Vercel, GitHub Pages, Firebase, S3 — with no extra server config.

---

## What you get

**On a laptop/desktop** the app is presented inside a realistic phone on a lit stage, with a
light/dark switch and a "Jump to a screen" panel for quick reviews. **On a phone** it runs
full-screen like a native app.

### The flow (in the order from the PDF)

1. **First open** — splash, Welcome (Find my people / Log in)
2. **First-time setup** — mobile number → 4-digit code (any digits work in the demo) → name & photo
   (real photo upload) → interests (pick at least 3) → area (uses device location, or choose manually)
3. **Home & Discover** — activity grid home, Discover list with search, filters and
   Today / Tomorrow / Weekend, plus the **map view** (public venues only, area-level radius)
4. **Join a plan** — plan details → Request to join (with a note) → the host approves a few seconds
   later → group chat opens
5. **Meetup day** — directions, chat, optional check-in
6. **After meetup** — star review, "what went well", then add people as friends
7. **Host path** — Create a plan (2 steps) → Review → Publish (confetti) → share invite →
   incoming requests arrive → accept/decline in Inbox → edit or cancel the plan

**Conditional screens** appear only when needed: waitlist (full plans), no plans (empty filters or
another city), offline (when the device loses connection), plan-change notice, cancellation,
report, help center, account controls. You can preview all of them from
**Profile → Settings → Preview app states**.

**One bottom menu everywhere:** Home | Discover | + Add Event | Inbox | Profile.

### Four home layouts
All four home designs are built. Switch in **Settings → Appearance → Home layout**:
Activity grid (launch default), Today's picks, Quick start, Your circle.

### It's alive
Everything works and reacts: hosts accept your requests, people reply in group chats (with typing
indicators), new join requests arrive after you publish, notifications appear in the
"dynamic island", badges update, and everything is saved in the browser (refresh-safe).
**Settings → Reset demo data** restores the sample plans; **Delete account** starts over from the
Welcome screen.

---

## Project structure

```
src/
  App.jsx                 routes + iOS-style page transitions (push, modal, fade, tab)
  main.jsx                entry, fonts and styles
  styles/                 tokens.css (dark/light colors), base.css, ui.css, screens.css
  context/
    StoreContext.jsx      all app data + actions (join, accept, chat, create, edit, cancel…)
    ThemeContext.jsx      dark / light / system with circular reveal animation
    ToastContext.jsx      dynamic-island notifications
    FrameContext.jsx      phone frame + status-bar tone
  data/
    seed.js               sample plans, chats, requests, notifications (relative to "today")
    catalog.js            activities, public venues, areas, cities, people
    images.js             auto-imports every photo in src/assets/img
  components/             Logo, TabBar, Screen/TopBar, Sheet, PlanCards, map, illustrations…
  screens/                one file per screen / flow
  assets/img/             optimized WebP photos (taken from your mockups)
```

### Common changes
- **Brand color:** `--accent` in `src/styles/tokens.css` (currently `#EAFF00`).
- **Sample content:** edit `src/data/seed.js` and `src/data/catalog.js`.
- **Photos:** drop a `.webp`/`.jpg` into `src/assets/img/` and reference it as `IMG['file-name']`.
- **Connecting a backend:** every user action lives in `StoreContext.jsx` (`requestJoin`,
  `respondRequest`, `sendMessage`, `createPlan`, `updatePlan`, `cancelPlan`, …). Replace the
  simulated parts (the `schedule(...)` calls) with your API calls and real-time events.

---

## Tech

React 18 · React Router 7 · Framer Motion 12 · Lucide icons · Plus Jakarta Sans · Vite 6.
No UI kit — all styling is hand-written CSS with design tokens.

Photos and avatars are taken from your concept mockups (cleaned up and upscaled); the people,
plans and messages are illustrative sample content. Legal pages contain placeholder text — replace
it before launch.
