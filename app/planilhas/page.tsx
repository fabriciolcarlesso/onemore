import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workoutSheets, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { SheetList } from "./sheet-list";

export default async function WorkoutSheetsPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/dashboard");

  const sheets = await db.select().from(workoutSheets).where(eq(workoutSheets.createdBy, user.id)).orderBy(asc(workoutSheets.name));
  const linkedWorkouts = await db.select({ sheetId: workouts.sheetId }).from(workouts).where(eq(workouts.createdBy, user.id));
  const sheetItems = sheets.map((sheet) => ({
    id: sheet.id,
    name: sheet.name,
    description: sheet.description,
    workoutCount: linkedWorkouts.filter((workout) => workout.sheetId === sheet.id).length,
  }));

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div className="pb-20"><nav aria-label="Breadcrumb" className="breadcrumb mb-5 text-xs text-slate-400"><ol className="breadcrumb-list"><li><Link href="/dashboard" className="font-medium text-slate-500 transition hover:text-slate-700">← Voltar</Link></li><li aria-hidden="true">|</li><li aria-current="page" className="text-slate-400">Planilhas</li></ol></nav><div className="mb-8"><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Organização</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Planilhas</h1><p className="mt-2 text-sm text-slate-500">Organize seus treinos, cada um em uma única planilha.</p></div></div><SheetList sheets={sheetItems} /><Link href="/planilhas/nova" aria-label="Criar nova planilha" title="Criar nova planilha" className="fixed right-8 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-30 flex size-16 items-center justify-center rounded-full bg-slate-950 text-4xl font-light leading-none text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 sm:right-10 xl:right-12">+</Link></div></DashboardShell>;
}
