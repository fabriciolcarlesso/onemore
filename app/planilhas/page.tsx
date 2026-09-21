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

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div><div className="mb-8 flex items-end justify-between gap-4"><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Organização</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Planilhas</h1><p className="mt-2 text-sm text-slate-500">Organize seus treinos, cada um em uma única planilha.</p></div><Link href="/planilhas/nova" className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Nova planilha</Link></div><SheetList sheets={sheetItems} /></div></DashboardShell>;
}
