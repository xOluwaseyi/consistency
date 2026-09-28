// Validated as a set (colour-blind separation + 3:1 contrast) against the card surface.
// Violet is reserved for task timer time, so categories pick from the other seven.
export const ACTIVITY_COLORS = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#e66767",
] as const;

export const TASKS_COLOR = "#9085e9";
export const OTHER_COLOR = "#5c5c73";
export const UNTRACKED_COLOR = "#262638";

const MAX_SLICES = 6;

export type Interval = { start: number; end: number };

export type Slice = {
  key: string;
  name: string;
  color: string;
  seconds: number;
};

type EntryLike = { category_id: string; started_at: string; ended_at: string | null };
type SessionLike = { started_at: string; ended_at: string | null };
type CategoryLike = { id: string; name: string; color: string };

export function localDayWindow(dayOffset: number, now: number): Interval {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dayOffset);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.getTime(), end: Math.min(end.getTime(), now) };
}

function overlapSeconds(startedAt: string, endedAt: string | null, window: Interval, now: number) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : now;
  return Math.max(0, (Math.min(end, window.end) - Math.max(start, window.start)) / 1000);
}

/** Tracked time per category (plus task timers) inside the window, largest first. */
export function summarizeDay(
  entries: EntryLike[],
  sessions: SessionLike[],
  categories: CategoryLike[],
  window: Interval,
  now: number,
) {
  const byCategory = new Map<string, number>();
  for (const entry of entries) {
    const seconds = overlapSeconds(entry.started_at, entry.ended_at, window, now);
    if (seconds > 0) byCategory.set(entry.category_id, (byCategory.get(entry.category_id) ?? 0) + seconds);
  }

  const slices: Slice[] = [];
  for (const category of categories) {
    const seconds = byCategory.get(category.id);
    if (seconds) slices.push({ key: category.id, name: category.name, color: category.color, seconds });
  }

  const taskSeconds = sessions.reduce(
    (sum, s) => sum + overlapSeconds(s.started_at, s.ended_at, window, now),
    0,
  );
  if (taskSeconds > 0) slices.push({ key: "tasks", name: "Tasks", color: TASKS_COLOR, seconds: taskSeconds });

  slices.sort((a, b) => b.seconds - a.seconds);

  const visible =
    slices.length > MAX_SLICES
      ? [
          ...slices.slice(0, MAX_SLICES - 1),
          {
            key: "other",
            name: "Other",
            color: OTHER_COLOR,
            seconds: slices.slice(MAX_SLICES - 1).reduce((sum, s) => sum + s.seconds, 0),
          },
        ]
      : slices;

  const tracked = slices.reduce((sum, s) => sum + s.seconds, 0);
  const windowSeconds = Math.max(0, (window.end - window.start) / 1000);
  const untracked = Math.max(0, windowSeconds - tracked);

  return { slices: visible, tracked, untracked };
}

export function toLocalDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toLocalTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
