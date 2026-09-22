"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOut())}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-muted transition hover:text-danger disabled:opacity-50"
    >
      <LogOut size={15} /> {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
