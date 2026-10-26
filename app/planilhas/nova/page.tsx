import { redirect } from "next/navigation";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { SheetForm } from "../sheet-form";

export default async function NewWorkoutSheetPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/dashboard");

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div className="mx-auto max-w-2xl"><div className="mb-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Nova planilha</h1></div><SheetForm /></div></DashboardShell>;
}
