import { NextRequest, NextResponse } from "next/server";
import { pollAndSendReminders } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await pollAndSendReminders();
  return NextResponse.json({ ok: true, ...result });
}
