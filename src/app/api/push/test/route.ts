import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyUser } from "@/lib/notify";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!count) {
    return NextResponse.json(
      { error: "No push subscription found for this device yet." },
      { status: 400 },
    );
  }

  await notifyUser(user.id, {
    title: "Test notification",
    body: "If you can see this, push is working.",
    url: "/today",
  });

  return NextResponse.json({ ok: true });
}
