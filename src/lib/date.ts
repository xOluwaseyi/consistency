import { toDateKey } from "@/lib/streak";

/** Monday-start week, offset in whole weeks from the one containing `today` (yyyy-mm-dd). */
export function getWeekDays(offset: number, today: string): Date[] {
  const now = new Date(`${today}T00:00:00`);
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function formatWeekRange(days: Date[]): string {
  const start = days[0];
  const end = days[6];
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

/** Monday-first for display; `value` matches Date.getDay() (0 = Sunday). */
export const WEEKDAYS = [
  { value: 1, short: "M", name: "Mon" },
  { value: 2, short: "T", name: "Tue" },
  { value: 3, short: "W", name: "Wed" },
  { value: 4, short: "T", name: "Thu" },
  { value: 5, short: "F", name: "Fri" },
  { value: 6, short: "S", name: "Sat" },
  { value: 0, short: "S", name: "Sun" },
];

export function formatRepeatDays(days: number[]): string {
  if (days.length === 0) return "Doesn't repeat";
  if (days.length === 7) return "Repeats every day";
  const set = new Set(days);
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return "Repeats on weekdays";
  if (set.size === 2 && set.has(0) && set.has(6)) return "Repeats on weekends";
  return `Repeats ${WEEKDAYS.filter((d) => set.has(d.value)).map((d) => d.name).join(", ")}`;
}

function timezoneOffsetMs(timestamp: number, timezone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(new Date(timestamp))
      .map((p) => [p.type, Number(p.value)]),
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(timestamp / 1000) * 1000;
}

/** The instant `dateKey` (yyyy-mm-dd) ends, i.e. the following midnight, in `timezone`. */
export function endOfDayInTimezone(dateKey: string, timezone: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const naiveMidnight = Date.UTC(y, m - 1, d + 1);
  const guess = naiveMidnight - timezoneOffsetMs(naiveMidnight, timezone);
  return new Date(naiveMidnight - timezoneOffsetMs(guess, timezone));
}

export { toDateKey };
