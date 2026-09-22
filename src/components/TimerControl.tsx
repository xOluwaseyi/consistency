"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Play, Pause } from "lucide-react";
import { startTimerSession, stopTimerSession } from "@/lib/actions";
import { formatClock } from "@/lib/utils";

type Session = { id: string; started_at: string } | null;

export function TimerControl({
  taskId,
  openSession,
  totalSeconds,
}: {
  taskId: string;
  openSession: Session;
  totalSeconds: number;
}) {
  const [, startTransition] = useTransition();
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [optimisticSession, setOptimisticSession] = useOptimistic<Session>(openSession);
  const pendingStartRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (!optimisticSession) return;
    const startedAt = new Date(optimisticSession.started_at).getTime();

    const tick = () => setLiveSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [optimisticSession]);

  const displaySeconds = totalSeconds + (optimisticSession ? liveSeconds : 0);

  function handleResume() {
    startTransition(async () => {
      setOptimisticSession({ id: "optimistic", started_at: new Date().toISOString() });
      const promise = startTimerSession(taskId);
      pendingStartRef.current = promise;
      await promise;
      pendingStartRef.current = null;
    });
  }

  function handlePause() {
    if (!optimisticSession) return;
    const session = optimisticSession;
    startTransition(async () => {
      setOptimisticSession(null);
      const sessionId =
        session.id === "optimistic" && pendingStartRef.current
          ? await pendingStartRef.current
          : session.id;
      if (sessionId !== "optimistic") await stopTimerSession(sessionId);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-muted tabular-nums">
        {formatClock(displaySeconds)}
      </span>
      {optimisticSession ? (
        <button
          type="button"
          onClick={handlePause}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-danger/15 text-danger transition active:scale-90"
          aria-label="Pause timer"
        >
          <Pause size={12} fill="currentColor" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleResume}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success transition active:scale-90"
          aria-label={totalSeconds > 0 ? "Resume timer" : "Start timer"}
        >
          <Play size={12} fill="currentColor" className="ml-0.5" />
        </button>
      )}
    </div>
  );
}
