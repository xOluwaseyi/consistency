function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function enablePushNotifications(): Promise<{ ok: boolean; reason?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "Push isn't supported in this browser." };
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return {
      ok: false,
      reason: "Server is missing its VAPID public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY not set).",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "Notification permission was denied." };
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Always start from a clean subscription bound to the *current* VAPID
    // key. A subscription created earlier (e.g. before the key was properly
    // configured) is permanently tied to whatever key it was made with —
    // reusing it would silently keep sending to a subscription the server
    // can never actually sign for.
    const existing = await registration.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      ) as BufferSource,
    });

    const json = subscription.toJSON();
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, reason: data.error ?? "Could not save the subscription. Try again." };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function getPushSubscriptionState(): Promise<"granted" | "denied" | "default"> {
  if (typeof Notification === "undefined") return "default";
  return Notification.permission;
}
