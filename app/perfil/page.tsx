import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireUser();
  return <DashboardShell user={user} signOut={signOut}><div><div className="mb-6"><p className="mb-3 h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><p className="text-sm font-medium text-slate-400">Conta</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Meu perfil</h1><p className="mt-2 text-sm text-slate-500">Gerencie seus dados pessoais.</p></div><ProfileForm name={user.name} email={user.email} /></div></DashboardShell>;
}
