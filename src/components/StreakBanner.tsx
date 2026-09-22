import { Flame } from "lucide-react";

export function StreakBanner({
  streak,
  pendingToday,
}: {
  streak: number;
  pendingToday: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-[#fbbf24] to-[#fb7185]">
          <Flame size={20} className="text-white" fill="white" fillOpacity={0.25} />
        </div>
        <div>
          <p className="text-lg font-semibold leading-tight">
            {streak} {streak === 1 ? "day" : "days"}
          </p>
          <p className="text-xs text-muted">
            {pendingToday ? "Finish today's tasks to extend it" : "current streak"}
          </p>
        </div>
      </div>
    </div>
  );
}
