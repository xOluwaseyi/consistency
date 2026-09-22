function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function keyMatches(existingKey: ArrayBuffer | null, expected: Uint8Array): boolean {
  if (!existingKey) return false;
  const existingBytes = new Uint8Array(existingKey);
  if (existingBytes.length !== expected.length) return false;
  return existingBytes.every((byte, i) => byte === expected[i]);
}

/**
 * pushManager.subscribe() can transiently throw "no active Service Worker"
 * right after registration/unsubscribe on Chrome/Android — a known race, not
 * a real failure. Retry a couple of times before giving up.
 */
async function subscribeWithRetry(
  registration: ServiceWorkerRegistration,
  options: PushSubscriptionOptionsInit,
  attempts = 3,
): Promise<PushSubscription> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await registration.pushManager.subscribe(options);
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
      await navigator.serviceWorker.ready;
    }
  }
  throw new Error("Unreachable");
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

    const expectedKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

    // Only replace the subscription if it doesn't match the current key —
    // unsubscribing when it's already correct just risks the transient
    // "no active Service Worker" race for no benefit.
    const existing = await registration.pushManager.getSubscription();
    if (existing && !keyMatches(existing.options.applicationServerKey, expectedKey)) {
      await existing.unsubscribe();
    }

    const current = await registration.pushManager.getSubscription();
    const subscription =
      current ??
      (await subscribeWithRetry(registration, {
        userVisibleOnly: true,
        applicationServerKey: expectedKey as BufferSource,
      }));

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
