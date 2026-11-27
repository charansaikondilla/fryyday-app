# Fryyday backend plan

Today Fryyday is **frontend only**: every plan, chat, request and vote lives in the browser's
`localStorage` (`src/context/StoreContext.jsx`), and the "other people" are simulated with timers.
That is great for a demo, but nobody can see anyone else's plans or votes. This document is the plan
for a real backend, sized for a small team launching in one city (Hyderabad).

---

## 1. Recommended stack

| Layer | Choice | Why |
| --- | --- | --- |
| Database + Auth + Realtime + Storage | **Supabase** (Postgres) | Phone OTP login, row-level security, live chat over websockets, photo storage — one service, generous free tier, no server to run on day one |
| Server logic | **Supabase Edge Functions** (TypeScript) | Join approvals, notifications, moderation — things the client must not do itself |
| Push notifications | **Web Push** (VAPID) from an Edge Function | The app is already an installable PWA |
| Hosting (frontend) | GitHub Pages (as now) | No change |

Alternative if you want your own server: **Node.js + Fastify + PostgreSQL (Prisma) + Socket.IO**,
hosted on Render/Railway, with OTP via MSG91 or Twilio. Same tables and endpoints as below.

---

## 2. Database tables

```sql
profiles        (id uuid pk -> auth.users, name, photo_url, bio, city, area,
                 interests text[], discoverable bool, created_at)
plans           (id uuid pk, host_id -> profiles, title, activity, about,
                 venue_id -> venues, starts_at timestamptz, duration_min int,
                 capacity int, audience text, status text  -- upcoming | past | cancelled
                 cancel_reason, cover_url, created_at, updated_at)
venues          (id, name, area, city, lat, lng)        -- public places only
plan_members    (plan_id, user_id, role text            -- host | member
                 , joined_at, checked_in_at, pk(plan_id,user_id))
join_requests   (id, plan_id, user_id, message, status   -- pending | accepted | declined | waitlist
                 , created_at, decided_at, unique(plan_id,user_id))
plan_votes      (plan_id, user_id, value smallint check (value in (-1, 1)),
                 created_at, pk(plan_id, user_id))       -- one vote per person per plan
messages        (id, chat_plan_id -> plans, sender_id, kind, text, created_at)
notifications   (id, user_id, type, plan_id, actor_id, read bool, created_at)
friendships     (user_a, user_b, status text, created_at)
blocks          (blocker_id, blocked_id)
reports         (id, reporter_id, target_user_id, plan_id, reason, details, created_at)
reviews         (plan_id, user_id, stars, went_well text[], note, created_at)
saved_plans     (user_id, plan_id)
push_subscriptions (user_id, endpoint, keys jsonb)
```

### Upvotes & downvotes

* `plan_votes` has primary key `(plan_id, user_id)`, so a person can only ever have **one** vote per
  plan. Changing your vote is an `upsert`; removing it is a `delete`.
* Keep fast counters on `plans` (`ups int`, `downs int`) updated by a trigger on `plan_votes`, so
  Discover can sort by **Top voted** (`order by ups - downs desc, starts_at`) without counting rows.
* Rule: a host can't vote on their own plan (enforced in a row-level-security policy, mirrors the app).
* The frontend already uses exactly this shape: `ups`, `downs` and "my vote" (`1`, `-1` or none) —
  see `voteTally()` in `StoreContext.jsx` — so wiring it up is a swap of the data source.

---

## 3. API (what the app calls)

| Action in the app | Call |
| --- | --- |
| Send / verify OTP | `auth.signInWithOtp({ phone })`, `auth.verifyOtp(...)` |
| Discover list | `GET plans?status=upcoming&city=…&activity=…&starts_at=range&order=soon|top` |
| Plan details | `GET plans/:id` (+ host profile, member avatars, my vote, my request) |
| **Vote** | `POST /plans/:id/vote { value: 1 \| -1 }` · `DELETE /plans/:id/vote` → returns `{ ups, downs, mine }` |
| Request to join | `POST /plans/:id/requests { message }` (waitlist automatically when full) |
| Host accepts / declines | `PATCH /requests/:id { status }` — Edge Function adds member, opens chat, notifies |
| Create / edit / cancel plan | `POST /plans`, `PATCH /plans/:id`, `POST /plans/:id/cancel` |
| Group chat | `messages` table + Realtime subscription on `chat_plan_id` |
| Check-in, review | `POST /plans/:id/checkin`, `POST /plans/:id/review` |
| Friends, block, report | `friendships`, `blocks`, `reports` inserts |
| Notifications | `GET notifications`, `PATCH notifications/read` + Web Push |

---

## 4. Security rules (row-level security)

* Anyone signed in can **read** upcoming public plans in their city; venue is shown, never people's location.
* Only the host can edit/cancel a plan or decide its join requests.
* Only plan members can read/send that plan's chat messages.
* Users can only write their own vote, request, review, check-in and profile.
* Blocked users never see each other's plans, profiles or messages.
* Rate limits: votes and join requests per user per minute (Edge Function or Postgres function).

---

## 5. Rollout steps

1. **Supabase project + schema** — create the tables above, triggers for vote counters, RLS policies.
2. **Auth** — replace the demo OTP screen with real phone OTP; create `profiles` on first sign-in.
3. **Data layer** — add `src/lib/api.js`; make `StoreContext` load plans/votes from the API and keep
   `localStorage` only as an offline cache. Start with read-only Discover + plan details + **votes**.
4. **Joining & hosting** — requests, approvals, waitlist, create/edit/cancel through Edge Functions.
5. **Chat & notifications** — Realtime chat, notification feed, Web Push.
6. **Safety** — reports dashboard, blocking, moderation of plan text and photos.
7. **Ship** — environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) as GitHub
   Actions secrets; never commit the service-role key.

Each step keeps the app working: anything not yet on the backend still runs on the local demo data.
