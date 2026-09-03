import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardPage() {
  const user = await requireUser();

  return <DashboardShell user={user} signOut={signOut} />;
}
