import { redirect } from "next/navigation";
import { getUser } from "@/lib/data";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getUser();
  if (user) redirect("/today");

  return <LoginForm />;
}
