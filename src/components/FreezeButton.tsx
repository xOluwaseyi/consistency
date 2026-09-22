"use client";

import { useState, useTransition } from "react";
import { Snowflake } from "lucide-react";
import { applyStreakFreeze } from "@/lib/actions";

export function FreezeButton({
  date,
  freezesRemaining,
}: {
  date: string;
  freezesRemaining: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (freezesRemaining <= 0) return null;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs font-medium text-muted transition hover:text-foreground"
      >
        <Snowflake size={14} /> Won&rsquo;t finish today? Use a streak freeze ({freezesRemaining} left)
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-accent/40 bg-accent-soft/20 p-3.5 text-center">
      <p className="text-xs">Protect today&rsquo;s streak without finishing everything?</p>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await applyStreakFreeze(date);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Something went wrong");
              }
            })
          }
          className="flex-1 rounded-xl bg-accent-strong py-2 text-xs font-semibold text-white"
        >
          Use freeze
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-xl px-3 py-2 text-xs text-muted"
        >
          Never mind
        </button>
      </div>
    </div>
  );
}
