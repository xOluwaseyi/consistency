import { NextRequest, NextResponse } from "next/server";
import { sendSlotReminders } from "@/lib/notify";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slot: string }> },
) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slot: slotParam } = await params;
  const slot = Number(slotParam);

  if (![1, 2, 3, 4].includes(slot)) {
    return NextResponse.json({ error: "Invalid slot, must be 1-4" }, { status: 400 });
  }

  const sent = await sendSlotReminders(slot as 1 | 2 | 3 | 4);
  return NextResponse.json({ ok: true, slot, sent });
}
