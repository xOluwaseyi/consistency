import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
