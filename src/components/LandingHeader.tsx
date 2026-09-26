"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#install", label: "Install" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/20 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8 lg:px-12">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-sm font-semibold tracking-tight">Consistency</span>
        </div>
        <nav className="hidden items-center gap-8 justify-self-center lg:gap-12 sm:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="whitespace-nowrap text-xs font-medium text-muted transition hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <Link
          href="/login"
          className="hidden justify-self-end rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted transition hover:border-accent hover:text-foreground sm:block"
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-muted hover:text-foreground sm:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav
        className={cn(
          "absolute inset-x-0 top-full flex flex-col gap-1 border-y border-border/50 bg-background px-6 py-3 shadow-lg shadow-black/40 transition-all duration-200 ease-out sm:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-foreground"
          >
            {label}
          </a>
        ))}
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface hover:text-foreground"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
}
