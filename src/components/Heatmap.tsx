import { cn } from "@/lib/utils";
import type { DaySummary } from "@/lib/streak";
import { toDateKey } from "@/lib/streak";

function cellColor(day: DaySummary | undefined): string {
  if (!day || day.total === 0) return "bg-surface-raised";
  if (day.completed === day.total) return "bg-success";
  if (day.frozen) return "bg-priority-low";
  const ratio = day.completed / day.total;
  if (ratio >= 0.5) return "bg-warning/70";
  return "bg-danger/60";
}

export function Heatmap({ days, weeks = 12 }: { days: Map<string, DaySummary>; weeks?: number }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + diffToMonday);

  const startMonday = new Date(thisMonday);
  startMonday.setDate(thisMonday.getDate() - (weeks - 1) * 7);

  const columns: DaySummary[][] = [];
  for (let w = 0; w < weeks; w++) {
    const column: DaySummary[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + w * 7 + d);
      const key = toDateKey(date);
      column.push(days.get(key) ?? { date: key, total: 0, completed: 0, frozen: false });
    }
    columns.push(column);
  }

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
      {columns.map((column, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {column.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.total ? `${day.completed}/${day.total}` : "no tasks"}`}
              className={cn("h-3 w-3 rounded-[3px]", cellColor(day))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
