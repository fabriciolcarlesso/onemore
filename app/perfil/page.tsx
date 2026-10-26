import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser();
  return <DashboardShell user={user} signOut={signOut}><div><div className="mb-6"><p className="mb-3 h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Meu perfil</h1></div><ProfileForm name={user.name} email={user.email} role={user.role} preferredTeacher={user.preferredTeacher} weight={user.weight} height={user.height} /></div></DashboardShell>;
}
