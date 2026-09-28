"use client";

import { useEffect, useState } from "react";

/**
 * The current time, re-read every `intervalMs`. Null during the server render and
 * first paint, so anything based on the viewer's local day or clock only renders in
 * the browser (the server runs in UTC and would disagree).
 */
export function useNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
