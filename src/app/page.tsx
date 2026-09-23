import Image from "next/image";
import Link from "next/link";
import { FeatureAccordion } from "@/components/FeatureAccordion";

function GithubMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

function XMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.83-5.97 6.83H1.66l7.74-8.84L1.25 2.25h6.83l4.72 6.24ZM17.05 19.77h1.83L7.03 4.13H5.07Z" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: "Flame" as const,
    title: "A streak that means something",
    body: "A day only counts when everything you planned for it is done, no partial credit. And when life gets in the way, three streak freezes a month mean one rough day doesn't erase weeks of progress.",
  },
  {
    icon: "Timer" as const,
    title: "Track the work, not just the checkbox",
    body: "Start a timer on any task, pause when life interrupts, and keep a running log of every session. For bigger tasks, add subtasks, like each book in a reading goal, and tick them off one by one.",
  },
  {
    icon: "Repeat" as const,
    title: "Less typing, fewer nags",
    body: "Mark a task as repeating once and pull it onto today's list with a single tap each morning instead of retyping it. Reminders check in up to four times a day, but only if there's still something left to finish.",
  },
  {
    icon: "Smartphone" as const,
    title: "See your progress, wherever you use it",
    body: "A 12-week heatmap and hours-logged chart show your patterns at a glance. It's a web app that works in any browser, and you can install it to your home screen for an app-like feel: no app store, no download.",
  },
];

const SHOWCASE = [
  {
    src: "/screenshots/today.png",
    width: 648,
    height: 1338,
    alt: "Today screen with a task, timer, and streak",
    eyebrow: "Today",
    title: "Your whole day, one screen",
    body: "Everything planned for today lives here: a live streak counter, a progress bar, and each task with its priority and timer sitting right on the card. Check things off as you go and watch the day fill in.",
    points: [
      "Streak banner shows how many days you've strung together",
      "Priority tags and a live timer, right on the task card",
      "One tap to mark a task complete",
    ],
  },
  {
    src: "/screenshots/task-detail.png",
    width: 648,
    height: 1338,
    alt: "Task detail with timer, subtasks, and time log",
    eyebrow: "Task detail",
    title: "Tap into any task for more",
    body: "Every task opens into its own view: a full-size timer you can pause and resume, a checklist of subtasks, and a running log of every session so you know exactly where the time went.",
    points: [
      "Pause and resume without losing your total",
      "Break a task into smaller subtasks and tick them off one by one",
      "A full log of every start and stop, with duration",
    ],
  },
  {
    src: "/screenshots/week.png",
    width: 846,
    height: 1748,
    alt: "Week planner with each day expandable and a completion count",
    eyebrow: "Week",
    title: "Plan the whole week, not just today",
    body: "Every day gets its own row: expand it, add tasks, and see how it's going, so you're never stuck planning one day at a time.",
    points: [
      "Expand any day to see or add its tasks",
      "Each day shows a quick completion count, like 1/1",
      "Today is marked so you always know where you are",
    ],
  },
  {
    src: "/screenshots/overview.png",
    width: 648,
    height: 1338,
    alt: "Weekly overview with streak heatmap and hours chart",
    eyebrow: "Overview",
    title: "See the pattern, not just the day",
    body: "A rolling heatmap of your last 12 weeks, hours logged per day, and your current streak next to your best one ever, all in one glance.",
    points: [
      "12-week heatmap: done, frozen, missed, or no tasks planned",
      "Hours logged this week, charted by day",
      "Current streak next to your longest one",
    ],
  },
  {
    src: "/screenshots/settings.png",
    width: 846,
    height: 1748,
    alt: "Settings with reminder toggles",
    eyebrow: "Settings",
    title: "Reminders that respect your time",
    body: "Turn on up to four check-ins a day. Each one skips you entirely if there's nothing left to finish, so you're never nagged for no reason.",
    points: [
      "Up to 4 reminder times, each independently on or off",
      "Skipped automatically once everything's done",
      "3 streak freezes a month, tracked right here",
    ],
  },
];

const STEPS = [
  { n: "1", title: "Plan", body: "Write down what today needs. Or map out the whole week in one sitting." },
  { n: "2", title: "Do", body: "Work through it. Time the tasks that matter, check off the rest." },
  { n: "3", title: "Keep the streak", body: "Finish everything and the day counts. Come back tomorrow and do it again." },
];

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-[calc(env(safe-area-inset-top)+2rem)] sm:px-8 lg:px-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-sm font-semibold tracking-tight">Consistency</span>
        </div>
        <Link
          href="/login"
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      <section className="mt-10 text-center sm:mt-14 lg:mt-16">
        <p className="mb-4 inline-block rounded-full border border-accent/30 bg-accent-soft/30 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-accent">
          Built for one person: you
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          Plan the day.
          <br />
          <span className="bg-linear-to-r from-accent to-[#c4b5fd] bg-clip-text text-transparent">
            Protect the streak.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted sm:text-lg lg:max-w-2xl">
          This isn&rsquo;t just another to-do list. Write down what matters, do it, and build a
          streak of days where you actually finished what you started. No app store, no download,
          just a browser tab and a little discipline.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:mt-10">
          <Link
            href="/login"
            className="w-full rounded-xl bg-linear-to-br from-accent to-accent-strong px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-strong/25 transition active:scale-[0.98] sm:w-auto"
          >
            Get started, it&rsquo;s free
          </Link>
          <a
            href="#how-it-works"
            className="w-full rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted transition hover:text-foreground sm:w-auto"
          >
            How it works
          </a>
        </div>
      </section>

      <section className="mt-20 space-y-20 lg:mt-28 lg:space-y-28">
        {SHOWCASE.map(({ src, width, height, alt, eyebrow, title, body, points }, i) => (
          <div
            key={src}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
          >
            <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
              <div className="mx-auto w-48 overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40 sm:w-56 lg:w-64">
                <Image
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  className="w-full"
                  sizes="(min-width: 1024px) 25vw, 224px"
                  priority={i < 2}
                />
              </div>
            </div>

            <div className={i % 2 === 1 ? "lg:order-1" : undefined}>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">{eyebrow}</p>
              <h3 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight lg:text-3xl">
                {title}
              </h3>
              <p className="mt-3 text-pretty text-sm text-muted lg:text-base">{body}</p>
              <ul className="mt-5 space-y-2.5">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="mt-24 scroll-mt-8 lg:mt-32">
        <div className="grid gap-3 sm:grid-cols-3 lg:gap-6">
          {STEPS.map((step) => (
            <div key={step.n} className="rounded-2xl border border-border bg-surface p-5 lg:p-7">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft/50 text-sm font-semibold text-accent">
                {step.n}
              </div>
              <p className="text-sm font-semibold lg:text-base">{step.title}</p>
              <p className="mt-1 text-sm text-muted lg:text-base">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 lg:mt-32">
        <h2 className="text-balance text-center text-2xl font-semibold tracking-tight lg:text-4xl">
          Everything a checklist doesn&rsquo;t do
        </h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-center text-sm text-muted lg:mt-3 lg:max-w-lg lg:text-base">
          The pieces that turn a to-do list into something you actually stick with.
        </p>
        <FeatureAccordion items={FEATURES} />
      </section>

      <section className="mx-auto mt-24 max-w-3xl rounded-3xl border border-border bg-surface p-8 text-center sm:p-12 lg:mt-32 lg:p-16">
        <h2 className="text-balance text-2xl font-semibold tracking-tight lg:text-3xl">Start today. Literally.</h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted">
          Create an account with your email, add one task for today, and finish it. That&rsquo;s a
          one-day streak. Tomorrow you make it two.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-linear-to-br from-accent to-accent-strong px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-strong/25 transition active:scale-[0.98]"
        >
          Create your account
        </Link>
        <p className="mt-4 text-xs text-muted">
          Your tasks, timers, and streak are private to your account. Nobody else can see them.
        </p>
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Oluwaseyi</p>
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/xOluwaseyi/consistency"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition hover:text-foreground"
          >
            <GithubMark className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a
            href="https://x.com/xOluwaseyi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition hover:text-foreground"
          >
            <XMark className="h-3 w-3" />
            @xOluwaseyi
          </a>
          <Link href="/login" className="transition hover:text-foreground">
            Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}
