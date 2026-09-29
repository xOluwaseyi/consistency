"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncTimezone } from "@/lib/actions";

/** Keeps the profile's timezone matching the device, then re-renders so "today" is right. */
export function TimezoneSync({ savedTimezone }: { savedTimezone: string | null }) {
  const router = useRouter();

  useEffect(() => {
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!deviceTimezone || deviceTimezone === savedTimezone) return;
    syncTimezone(deviceTimezone)
      .then(() => router.refresh())
      .catch(() => {});
  }, [savedTimezone, router]);

  return null;
}
