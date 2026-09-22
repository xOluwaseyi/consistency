# Consistency — a task tracker built to keep you honest

Plan your days (or a whole week), track time on tasks that need it, and keep a
streak that only ticks when *everything* for the day is actually done.

## What's here

- **Today / Week / Overview / Settings** — plan tasks, time them, review the week.
- **Streaks with limited freezes** — miss a day without wrecking a long streak (3/month).
- **Per-task timer** — optionally require a logged timer session before a task can be checked off.
- **Push notifications** — up to 4 reminder times a day (set per-slot in Settings), each only firing if you've still got unfinished tasks.
- **Installable PWA** — add it to your Android home screen, works like a native app shell.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free project.
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates all the tables, row-level security policies, and the trigger that creates a profile row on signup.
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it bypasses row-level security and is only used server-side by the notification cron)
4. Paste all three into `.env.local` (they're currently blank).
5. Optional but recommended: in **Authentication → Providers → Email**, turn off "Confirm email" if you don't want to click a confirmation link the first time you sign up, since this is just for you.

## 2. Run it locally

```bash
npm run dev
```

Open `http://localhost:3000`, sign up with your email/password on the login screen (this creates your one account), and you're in.

## 3. Deploy

1. Push this repo to GitHub, then import it into [Vercel](https://vercel.com).
2. In the Vercel project's **Settings → Environment Variables**, add everything from `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (set this to `mailto:your-real-email`), and `CRON_SECRET`.
3. Deploy. `vercel.json` already defines four daily cron jobs (`/api/cron/notify/1` at 08:00 UTC, `/2` at 12:00, `/3` at 16:00, `/4` at 20:00) that Vercel will call automatically — no extra setup needed.
4. On your phone, open the deployed URL in Chrome, tap the menu → **Add to Home screen**. That's your "app."
5. Open it once installed, go to **Settings → Enable notifications**, and grant permission when Android prompts you.

### About notification timing

Vercel's free (Hobby) plan only allows cron jobs to run **once a day at a fixed time**, so the four reminders currently fire at fixed UTC times (08:00 / 12:00 / 16:00 / 20:00) rather than the exact minutes you pick per-slot in Settings — those Settings fields are there for whenever you want tighter control. Each slot only actually sends a notification if you've still got unfinished tasks, so an unused or redundant slot is harmless. If you want the *exact* times you set, point a free external pinger (e.g. [cron-job.org](https://cron-job.org)) at `https://your-app.vercel.app/api/cron/notify/1` through `/4` on whatever schedule you like, with an `Authorization: Bearer <CRON_SECRET>` header — same secret you put in Vercel's env vars. Either way, delete or ignore the ones in `vercel.json` if you go this route.

## Project structure

- `supabase/schema.sql` — the whole database schema, run once in Supabase for a fresh project.
- `supabase/migrations/` — incremental changes to run if your project already existed before that change (each file says so).
- `src/lib/actions.ts` — all task/timer/streak/reflection mutations (Next.js server actions).
- `src/lib/streak.ts` — the streak math (what counts as a "won" day, current/longest streak).
- `src/app/(main)/*` — the four main screens, behind the shared bottom nav.
- `src/app/api/cron/notify/[slot]` — the notification endpoint Vercel (or your own pinger) calls once per configured slot (1-4).
- `public/sw.js` — the service worker (installability + push notification handling).
