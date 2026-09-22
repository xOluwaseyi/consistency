"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Send } from "lucide-react";
import { enablePushNotifications, getPushSubscriptionState } from "@/lib/push-client";

export function PushSubscribeButton() {
  const [state, setState] = useState<"granted" | "denied" | "default">("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    getPushSubscriptionState().then(setState);
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

  async function handleTest() {
    setTestStatus("sending");
    setTestError(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send test notification.");
      setTestStatus("sent");
      setTimeout(() => setTestStatus("idle"), 2500);
    } catch (e) {
      setTestStatus("error");
      setTestError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  if (state === "granted") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm text-success">
          <BellRing size={15} /> Notifications enabled
        </div>
        <button
          type="button"
          onClick={handleTest}
          disabled={testStatus === "sending"}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3.5 py-2 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-50"
        >
          <Send size={13} />
          {testStatus === "sending"
            ? "Sending…"
            : testStatus === "sent"
              ? "Sent — check your phone"
              : "Send test notification"}
        </button>
        {testStatus === "error" && <p className="text-xs text-danger">{testError}</p>}
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
