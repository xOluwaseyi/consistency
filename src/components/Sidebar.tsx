"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
        <span className="text-sm font-semibold tracking-tight">Consistency</span>
      </div>

      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft/40 text-foreground"
                  : "text-muted hover:bg-surface-raised hover:text-foreground",
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
