import {
  getStreakContext,
  getTasksForRange,
  getSessionDurationsForTasks,
  getDistractionsSince,
  getReflection,
} from "@/lib/data";
import { toDateKey } from "@/lib/streak";
import { todayKey } from "@/lib/streak";
import { Heatmap } from "@/components/Heatmap";
import { HoursChart } from "@/components/HoursChart";
import { ReflectionBox } from "@/components/ReflectionBox";
import { formatDuration } from "@/lib/utils";
import { Flame, Trophy, Target, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const today = todayKey();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartKey = toDateKey(weekStart);

  const [streakCtx, weekTasks, distractions, reflection] = await Promise.all([
    getStreakContext(),
    getTasksForRange(weekStartKey, today),
    getDistractionsSince(weekStartKey),
    getReflection(today),
  ]);

  const durations = await getSessionDurationsForTasks(weekTasks.map((t) => t.id));

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toDateKey(d);
  });

  const hoursData = last7.map((dateKey) => {
    const dayTasks = weekTasks.filter((t) => t.scheduled_date === dateKey);
    const seconds = dayTasks.reduce((sum, t) => sum + (durations.get(t.id) ?? 0), 0);
    const date = new Date(`${dateKey}T00:00:00`);
    return {
      label: date.toLocaleDateString(undefined, { weekday: "narrow" }),
      hours: seconds / 3600,
    };
  });

  const totalWeekTasks = weekTasks.length;
  const completedWeekTasks = weekTasks.filter((t) => t.completed).length;
  const completionRate = totalWeekTasks ? Math.round((completedWeekTasks / totalWeekTasks) * 100) : 0;
  const totalWeekSeconds = weekTasks.reduce((sum, t) => sum + (durations.get(t.id) ?? 0), 0);

  const tasksByDate = new Map<string, typeof weekTasks>();
  for (const task of weekTasks) {
    const list = tasksByDate.get(task.scheduled_date) ?? [];
    list.push(task);
    tasksByDate.set(task.scheduled_date, list);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Last 7 days</p>
        <h1 className="text-xl font-semibold">Overview</h1>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard icon={Flame} label="Streak" value={`${streakCtx.streak}d`} />
        <StatCard icon={Trophy} label="Best" value={`${streakCtx.longest}d`} />
        <StatCard icon={Target} label="Completion" value={`${completionRate}%`} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Hours logged this week</p>
          <p className="text-xs font-semibold text-foreground">{formatDuration(totalWeekSeconds)}</p>
        </div>
        <HoursChart data={hoursData} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <p className="mb-3 text-xs font-medium text-muted">Last 12 weeks</p>
        <Heatmap days={streakCtx.days} />
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
          <LegendDot className="bg-success" label="Done" />
          <LegendDot className="bg-priority-low" label="Frozen" />
          <LegendDot className="bg-danger/60" label="Missed" />
          <LegendDot className="bg-surface-raised" label="No tasks" />
        </div>
      </div>

      <ReflectionBox date={today} initialNote={reflection?.note ?? ""} />

      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <p className="mb-2.5 text-xs font-medium text-muted">This week&rsquo;s tasks</p>
        <div className="space-y-3">
          {last7
            .slice()
            .reverse()
            .map((dateKey) => {
              const dayTasks = tasksByDate.get(dateKey) ?? [];
              if (dayTasks.length === 0) return null;
              const date = new Date(`${dateKey}T00:00:00`);
              return (
                <div key={dateKey}>
                  <p className="mb-1 text-[11px] font-medium text-muted">
                    {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </p>
                  <ul className="space-y-1">
                    {dayTasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-xs">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${task.completed ? "bg-success" : "bg-border"}`}
                        />
                        <span className={task.completed ? "text-muted line-through" : ""}>
                          {task.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          {weekTasks.length === 0 && (
            <p className="text-xs text-muted">No tasks logged this week yet.</p>
          )}
        </div>
      </div>

      {distractions.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Smartphone size={13} /> Distractions this week ({distractions.length})
          </p>
          <ul className="space-y-1.5">
            {distractions.slice(0, 8).map((d) => (
              <li key={d.id} className="text-xs text-muted">
                {new Date(d.occurred_at).toLocaleString(undefined, {
                  weekday: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {d.note ? `: ${d.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3 text-center">
      <Icon size={16} className="mx-auto mb-1 text-accent" />
      <p className="text-base font-semibold">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-[2px] ${className}`} />
      {label}
    </span>
  );
}
