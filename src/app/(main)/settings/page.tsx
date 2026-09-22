import { getProfile, getStreakContext, getUser } from "@/lib/data";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";
import { NotificationSettingsForm } from "@/components/NotificationSettingsForm";
import { SignOutButton } from "@/components/SignOutButton";
import { Snowflake } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [profile, streakCtx, user] = await Promise.all([
    getProfile(),
    getStreakContext(),
    getUser(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Account</p>
        <h1 className="text-xl font-semibold">Settings</h1>
        {user && <p className="mt-1 text-xs text-muted">{user.email}</p>}
      </div>

      <PushSubscribeButton />

      {profile && <NotificationSettingsForm profile={profile} />}

      <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3">
        <Snowflake size={16} className="text-priority-low" />
        <p className="text-sm">
          {3 - streakCtx.freezesThisMonth} of 3 streak freezes left this month
        </p>
      </div>

      <SignOutButton />
    </div>
  );
}
