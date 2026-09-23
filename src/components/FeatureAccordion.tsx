"use client";

import { useState } from "react";
import { ChevronDown, Flame, Timer, Repeat, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { Flame, Timer, Repeat, Smartphone };

type IconName = keyof typeof ICONS;

export function FeatureAccordion({
  items,
}: {
  items: { icon: IconName; title: string; body: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto mt-8 max-w-2xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface lg:mt-12">
      {items.map(({ icon, title, body }, i) => {
        const Icon = ICONS[icon];
        const open = openIndex === i;
        return (
          <div key={title}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
              aria-expanded={open}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft/40 text-accent">
                <Icon size={18} />
              </div>
              <span className="flex-1 text-sm font-semibold sm:text-base">{title}</span>
              <ChevronDown
                size={18}
                className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="text-pretty px-5 pb-5 pl-17 text-sm text-muted">{body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
