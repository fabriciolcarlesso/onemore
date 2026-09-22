import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { SheetForm } from "../sheet-form";

export default async function NewWorkoutSheetPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/dashboard");

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div className="mx-auto max-w-2xl"><nav aria-label="Breadcrumb" className="mb-5 text-xs text-slate-400"><ol className="flex items-center gap-2"><li><Link href="/planilhas" className="font-medium text-slate-500 transition hover:text-slate-700">← Voltar</Link></li><li aria-hidden="true">|</li><li><Link href="/planilhas" className="transition hover:text-slate-600">Planilhas</Link></li><li aria-hidden="true">›</li><li aria-current="page" className="text-slate-400">Nova planilha</li></ol></nav><div className="mb-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Planilhas</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Nova planilha</h1><p className="mt-2 text-sm leading-6 text-slate-500">Informe os dados da planilha. Em seguida, você criará o primeiro treino.</p></div><SheetForm /></div></DashboardShell>;
}
