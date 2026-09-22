"use client";

import { useState, useTransition } from "react";
import { Repeat } from "lucide-react";
import { copyRecurringTasks } from "@/lib/actions";

export function RolloverButton({ date }: { date: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const count = await copyRecurringTasks(date);
      setResult(
        count === 0
          ? "Nothing to bring over — no repeating tasks found."
          : `Added ${count} repeating ${count === 1 ? "task" : "tasks"}.`,
      );
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-50"
      >
        <Repeat size={14} /> {pending ? "Bringing over…" : "Bring over repeating tasks"}
      </button>
      {result && <p className="mt-1.5 text-center text-[11px] text-muted">{result}</p>}
    </div>
  );
}
