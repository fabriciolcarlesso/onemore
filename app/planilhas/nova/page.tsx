import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { SheetForm } from "../sheet-form";

export default async function NewWorkoutSheetPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/dashboard");

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div className="mx-auto max-w-2xl"><Link href="/planilhas" className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-950">← Voltar para planilhas</Link><div className="mb-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Planilhas</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Nova planilha</h1></div><SheetForm /></div></DashboardShell>;
}
