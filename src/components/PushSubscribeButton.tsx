"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, TriangleAlert } from "lucide-react";
import { enablePushNotifications, getPushSubscriptionState } from "@/lib/push-client";

export function PushSubscribeButton() {
  const [state, setState] = useState<"granted" | "denied" | "default">("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);

  async function resync() {
    setResyncing(true);
    setError(null);
    const result = await enablePushNotifications();
    setResyncing(false);
    if (!result.ok) {
      setError(result.reason ?? "Couldn't verify the subscription.");
    }
  }

  useEffect(() => {
    getPushSubscriptionState().then((permission) => {
      setState(permission);
      // Browser permission being "granted" doesn't guarantee the subscription
      // was ever actually saved server-side (e.g. if that save failed on an
      // earlier attempt). Re-verify it — requestPermission() resolves
      // immediately with no prompt when already granted, so this is safe —
      // and surface it if it fails instead of failing silently.
      if (permission === "granted") resync();
    });
  }, []);

  async function handleEnable() {
    setLoading(true);
    setError(null);
    const result = await enablePushNotifications();
    setLoading(false);
    if (!result.ok) {
      setError(result.reason ?? "Couldn't enable notifications.");
      return;
    }
    setState("granted");
  }

  if (state === "granted") {
    if (error) {
      return (
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>Permission is granted, but the subscription couldn&rsquo;t be saved: {error}</span>
          </div>
          <button
            type="button"
            onClick={resync}
            disabled={resyncing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3.5 py-2 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-50"
          >
            {resyncing ? "Retrying…" : "Retry"}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm text-success">
        <BellRing size={15} /> Notifications enabled
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleEnable}
        disabled={loading || state === "denied"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-accent to-accent-strong px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {state === "denied" ? <BellOff size={15} /> : <BellRing size={15} />}
        {state === "denied"
          ? "Notifications blocked in browser settings"
          : loading
            ? "Enabling…"
            : "Enable notifications"}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
