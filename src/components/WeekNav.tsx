"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function WeekNav({ offset, rangeLabel }: { offset: number; rangeLabel: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(next: number) {
    const sp = new URLSearchParams(params.toString());
    if (next === 0) sp.delete("week");
    else sp.set("week", String(next));
    router.push(`/week?${sp.toString()}`);
  }

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => go(offset - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
        aria-label="Previous week"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="text-center">
        <p className="text-sm font-medium">{rangeLabel}</p>
        {offset !== 0 && (
          <button type="button" onClick={() => go(0)} className="text-[11px] text-accent">
            Back to this week
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => go(offset + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
        aria-label="Next week"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
