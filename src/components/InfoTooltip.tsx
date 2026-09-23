"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-muted transition hover:text-foreground"
        aria-label="More info"
      >
        <Info size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs text-muted shadow-xl">
          {text}
        </div>
      )}
    </div>
  );
}
