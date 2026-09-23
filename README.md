# Consistency

A simple app for planning your day, tracking how long things actually take,
and building a streak of days where you got everything done.

**Try it here:** [useconsistency.vercel.app](https://useconsistency.vercel.app/)

## What it does

Every day, you write down what you need to get done. As you finish things,
you check them off. When *everything* for the day is checked off, that day
counts toward your streak — a running count of how many days in a row you've
followed through.

A few things make it more than just a checklist:

- **A live timer on any task** — tap start when you begin, pause if you get
  pulled away, and it keeps a running total of how long you actually spent.
  You can look back later and see exactly when you worked on something and
  for how long.

- **Subtasks** — break a bigger task into smaller pieces. For example, a task
  like "read this week" could have each book as its own checkbox underneath.
  Finish the last one and the main task ties itself off automatically.

- **Streak freezes** — life happens. You get 3 free passes a month so one
  rough day doesn't erase a long streak.

- **Repeating tasks** — for things you do most days, mark them as repeating
  once, then tap a button each morning to pull them onto today's list instead
  of retyping them.

- **Reminders** — set up to 4 notification times a day. Each one only
  actually pings your phone if you've still got something left to finish, so
  they never nag you for no reason.

- **A weekly overview** — a calendar-style view of your recent streak, how
  many hours you logged, and what you actually got done, so you can look back
  and notice patterns instead of just guessing.

- **Works like an app on your phone** — open it in your phone's browser, add
  it to your home screen, and it behaves like any other installed app, icon
  and all — no app store needed.

Everything is private to your own account — nobody else can see your tasks,
your timers, or your streak.

## Try it

Open **[useconsistency.vercel.app](https://useconsistency.vercel.app/)**,
create an account with your email and a password, and start adding tasks for
today. On your phone, open the same link in Chrome, tap the menu, and choose
"Add to Home screen" to install it properly.

---

## For developers

The rest of this document is for whoever's running or modifying the code
itself.

### What it's built with

- **Next.js** (React) for the app itself, deployed on **Vercel**
- **Supabase** (Postgres) for the database, accounts, and login
- The **Web Push API** for phone notifications, sent on a schedule by
  Vercel's cron jobs

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free project.
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all the tables, row-level security policies, and the trigger that creates a profile row on signup.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it bypasses row-level security and is only used server-side by the notification cron)
4. Paste all three into `.env.local` (they're currently blank).
5. Optional but recommended: in **Authentication → Providers → Email**, turn off "Confirm email" if you don't want to click a confirmation link the first time you sign up, since this is just for you.

### 2. Run it locally

```bash
npm run dev
```

Open `http://localhost:3000`, sign up with your email/password on the login screen (this creates your one account), and you're in.

### 3. Deploy

1. Push this repo to GitHub, then import it into [Vercel](https://vercel.com).
2. In the Vercel project's **Settings → Environment Variables**, add everything from `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (set this to `mailto:your-real-email`), and `CRON_SECRET`.
3. Deploy. `vercel.json` already defines four daily cron jobs (`/api/cron/notify/1` at 08:00 UTC, `/2` at 12:00, `/3` at 16:00, `/4` at 20:00) that Vercel will call automatically — no extra setup needed.
4. On your phone, open the deployed URL in Chrome, tap the menu → **Add to Home screen**. That's your "app."
5. Open it once installed, go to **Settings → Enable notifications**, and grant permission when Android prompts you.

#### About notification timing

Vercel's free (Hobby) plan only allows cron jobs to run **once a day at a fixed time**, so the four reminders fire at fixed UTC times (08:00 / 12:00 / 16:00 / 20:00), each with up to an hour of flex on Hobby. Settings reflects this honestly — it's 4 on/off toggles showing those times converted to your local time zone, not a free-time picker, since anything more precise isn't actually achievable on this plan. Each slot only sends a notification if there are still unfinished tasks, so an unused slot is harmless. If you want real per-minute control, point a free external pinger (e.g. [cron-job.org](https://cron-job.org)) at `https://your-app.vercel.app/api/cron/notify/1` through `/4` on whatever schedule you like, with an `Authorization: Bearer <CRON_SECRET>` header — same secret you put in Vercel's env vars. Either way, delete or ignore the ones in `vercel.json` if you go this route.

### Project structure

- `supabase/schema.sql` — the whole database schema, run once in Supabase for a fresh project.
- `supabase/migrations/` — incremental changes to run if your project already existed before that change (each file says so).
- `src/lib/actions.ts` — all task/timer/streak/reflection mutations (Next.js server actions).
- `src/lib/streak.ts` — the streak math (what counts as a "won" day, current/longest streak).
- `src/app/(main)/*` — the four main screens, behind the shared bottom nav.
- `src/app/api/cron/notify/[slot]` — the notification endpoint Vercel (or your own pinger) calls once per configured slot (1-4).
- `public/sw.js` — the service worker (installability + push notification handling).
