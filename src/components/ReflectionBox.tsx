"use client";

import { useState, useTransition } from "react";
import { saveReflection } from "@/lib/actions";

export function ReflectionBox({ date, initialNote }: { date: string; initialNote: string }) {
  const [note, setNote] = useState(initialNote);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!note.trim()) return;
    startTransition(async () => {
      await saveReflection(date, note);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5">
      <p className="mb-2 text-xs font-medium text-muted">What worked today, what didn&rsquo;t?</p>
      <textarea
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        rows={2}
        placeholder="Quick reflection…"
        className="w-full resize-none rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={pending || !note.trim()}
        className="mt-2 rounded-lg bg-accent-soft/50 px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-50"
      >
        {saved ? "Saved" : pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
