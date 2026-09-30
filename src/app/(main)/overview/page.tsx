import {
  getStreakContext,
  getTasksForRange,
  getSessionDurationsForTasks,
  getDistractionsSince,
  getReflection,
  getActivityCategories,
  getActivityEntries,
  getTaskSessions,
  getToday,
} from "@/lib/data";
import { addDays } from "@/lib/streak";
import { Heatmap } from "@/components/Heatmap";
import { HoursChart } from "@/components/HoursChart";
import { ReflectionBox } from "@/components/ReflectionBox";
import { DayBreakdown } from "@/components/DayBreakdown";
import { formatDuration } from "@/lib/utils";
import { Flame, Trophy, Target, Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const today = await getToday();
  const weekStartKey = addDays(today, -6);

  // 8 days of activity so the oldest local day in the 7-day picker is fully covered in any timezone.
  const [streakCtx, weekTasks, distractions, reflection, activityCategories, activityEntries, taskSessions] =
    await Promise.all([
      getStreakContext(today),
      getTasksForRange(weekStartKey, today),
      getDistractionsSince(weekStartKey),
      getReflection(today),
      getActivityCategories(),
      getActivityEntries(8),
      getTaskSessions(8),
    ]);

  const durations = await getSessionDurationsForTasks(weekTasks.map((t) => t.id));

  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

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

      <DayBreakdown
        categories={activityCategories}
        entries={activityEntries}
        sessions={taskSessions}
        tasks={weekTasks.map(({ id, title, completed, scheduled_date }) => ({ id, title, completed, scheduled_date }))}
      />

      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted">Hours logged this week</p>
          <p className="text-xs font-semibold text-foreground">{formatDuration(totalWeekSeconds)}</p>
        </div>
        <HoursChart data={hoursData} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <p className="mb-3 text-xs font-medium text-muted">Last 12 weeks</p>
        <Heatmap days={streakCtx.days} today={today} />
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
          <LegendDot className="bg-success" label="Done" />
          <LegendDot className="bg-priority-low" label="Frozen" />
          <LegendDot className="bg-danger/60" label="Missed" />
          <LegendDot className="bg-surface-raised" label="No tasks" />
        </div>
      </div>

      <ReflectionBox date={today} initialNote={reflection?.note ?? ""} />

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
