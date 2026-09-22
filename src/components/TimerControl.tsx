"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Square } from "lucide-react";
import { startTimerSession, stopTimerSession } from "@/lib/actions";
import { formatDuration } from "@/lib/utils";

export function TimerControl({
  taskId,
  openSession,
  totalSeconds,
}: {
  taskId: string;
  openSession: { id: string; started_at: string } | null;
  totalSeconds: number;
}) {
  const [pending, startTransition] = useTransition();
  const [liveSeconds, setLiveSeconds] = useState(0);

  useEffect(() => {
    if (!openSession) return;
    const startedAt = new Date(openSession.started_at).getTime();

    const tick = () => setLiveSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [openSession]);

  const displaySeconds = totalSeconds + (openSession ? liveSeconds : 0);

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted tabular-nums">
        {formatDuration(displaySeconds)}
      </span>
      {openSession ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => stopTimerSession(openSession.id))}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-danger/15 text-danger transition active:scale-90 disabled:opacity-50"
          aria-label="Stop timer"
        >
          <Square size={12} fill="currentColor" />
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await startTimerSession(taskId);
            })
          }
          className="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success transition active:scale-90 disabled:opacity-50"
          aria-label="Start timer"
        >
          <Play size={12} fill="currentColor" className="ml-0.5" />
        </button>
      )}
    </div>
  );
}
