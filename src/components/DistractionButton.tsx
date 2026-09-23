"use client";

import { useState, useTransition } from "react";
import { Smartphone } from "lucide-react";
import { addDistraction } from "@/lib/actions";
import { InfoTooltip } from "@/components/InfoTooltip";

export function DistractionButton() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [logged, setLogged] = useState(false);

  function log(withNote: boolean) {
    startTransition(async () => {
      await addDistraction(withNote ? note : undefined);
      setOpen(false);
      setNote("");
      setLogged(true);
      setTimeout(() => setLogged(false), 2000);
    });
  }

  if (logged) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-center text-xs text-muted">
        Logged. Back to it, you&rsquo;ve got this.
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 text-xs font-medium text-muted transition hover:text-foreground"
        >
          <Smartphone size={14} /> Got distracted?
        </button>
        <InfoTooltip text="Logs the time and, optionally, what pulled you away. No effect on your streak, it just shows up in your weekly overview so you can notice patterns." />
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface p-3.5">
      <p className="text-xs text-muted">No judgment, logging it is half the fix.</p>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What pulled you away? (optional)"
        className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => log(true)}
          className="flex-1 rounded-xl bg-accent-soft/60 py-2 text-xs font-medium text-foreground"
        >
          Log it
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl px-3 py-2 text-xs text-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
