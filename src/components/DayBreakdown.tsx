"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  localDayWindow,
  summarizeDay,
  taskSecondsInWindow,
  toLocalDateInput,
  TASKS_COLOR,
  UNTRACKED_COLOR,
} from "@/lib/activity";
import { useNow } from "@/lib/use-now";
import { cn, formatDuration } from "@/lib/utils";
import type { ActivityCategory, ActivityEntry } from "@/lib/database.types";

const DAYS_BACK = 6;

type DayTask = { id: string; title: string; completed: boolean; scheduled_date: string };

function TaskList({ tasks }: { tasks: (DayTask & { seconds: number })[] }) {
  return (
    <ul className="mt-1.5 space-y-1 border-l border-border pl-3 ml-1">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2 text-xs">
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", task.completed ? "bg-success" : "bg-border")} />
          <span className={cn("min-w-0 flex-1 truncate", task.completed && "text-muted line-through")}>
            {task.title}
          </span>
          <span className="text-muted tabular-nums">{formatDuration(task.seconds)}</span>
          <span className="w-9" />
        </li>
      ))}
    </ul>
  );
}

function dayLabel(offset: number, windowStart: number) {
  if (offset === 0) return "Today";
  if (offset === 1) return "Yesterday";
  return new Date(windowStart).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DayBreakdown({
  categories,
  entries,
  sessions,
  tasks,
}: {
  categories: ActivityCategory[];
  entries: ActivityEntry[];
  sessions: { task_id: string; started_at: string; ended_at: string | null }[];
  tasks: DayTask[];
}) {
  const now = useNow(60_000);
  const [offset, setOffset] = useState(0);

  if (!now) {
    return <div id="day" className="h-108 scroll-mt-24 rounded-2xl border border-border bg-surface" />;
  }

  const dayWindow = localDayWindow(offset, now);
  const { slices, tracked, untracked } = summarizeDay(entries, sessions, categories, dayWindow, now);
  const windowSeconds = tracked + untracked;
  const label = dayLabel(offset, dayWindow.start);

  const pieData = [
    ...slices.map((s) => ({ name: s.name, value: s.seconds, fill: s.color })),
    ...(untracked > 0 ? [{ name: "Untracked", value: untracked, fill: UNTRACKED_COLOR }] : []),
  ];

  const rows = [
    ...slices,
    ...(untracked > 0 ? [{ key: "untracked", name: "Untracked", color: UNTRACKED_COLOR, seconds: untracked }] : []),
  ];

  // The day's own tasks (timed or not), plus any other task timed during this day.
  const dayKey = toLocalDateInput(new Date(dayWindow.start));
  const taskSeconds = taskSecondsInWindow(sessions, dayWindow, now);
  const dayTasks = tasks
    .filter((t) => t.scheduled_date === dayKey || taskSeconds.has(t.id))
    .map((t) => ({ ...t, seconds: taskSeconds.get(t.id) ?? 0 }))
    .sort((a, b) => b.seconds - a.seconds || a.title.localeCompare(b.title));
  const tasksInLegend = tracked > 0 && rows.some((r) => r.key === "tasks");

  return (
    <div id="day" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-3.5">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium text-muted">How you spent your day</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOffset((o) => Math.min(DAYS_BACK, o + 1))}
            disabled={offset === DAYS_BACK}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:text-foreground disabled:opacity-30"
            aria-label="Previous day"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="w-24 text-center text-xs font-medium">{label}</span>
          <button
            type="button"
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition hover:text-foreground disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="relative mx-auto h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius="78%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="#14141f"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a29",
                border: "1px solid #262638",
                borderRadius: 12,
                fontSize: 12,
              }}
              itemStyle={{ color: "#f4f4f8" }}
              formatter={(value, name) => [formatDuration(Number(value)), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="text-2xl font-semibold">{formatDuration(tracked)}</p>
          <p className="text-[11px] text-muted">tracked</p>
        </div>
      </div>

      {tracked === 0 ? (
        <p className="mt-3 text-center text-xs text-muted">
          Nothing logged {offset === 0 ? "yet today" : "this day"}. Start an activity or a task timer
          from Today.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: row.color }} />
                <span className="min-w-0 flex-1 truncate">{row.name}</span>
                <span className="text-muted tabular-nums">{formatDuration(row.seconds)}</span>
                <span className="w-9 text-right text-muted tabular-nums">
                  {windowSeconds ? Math.round((row.seconds / windowSeconds) * 100) : 0}%
                </span>
              </div>
              {row.key === "tasks" && dayTasks.length > 0 && <TaskList tasks={dayTasks} />}
            </li>
          ))}
        </ul>
      )}

      {!tasksInLegend && dayTasks.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: TASKS_COLOR }} />
            <span className="flex-1">Tasks</span>
          </div>
          <TaskList tasks={dayTasks} />
        </div>
      )}
    </div>
  );
}
