import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, muscleGroups, workoutSheets } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { WorkoutBuilder } from "../workout-builder";

export default async function NewWorkoutPage({ searchParams }: { searchParams: Promise<{ planilha?: string }> }) {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const { planilha } = await searchParams;
  const [sheet] = planilha && /^[0-9a-f-]{36}$/i.test(planilha) ? await db.select({ id: workoutSheets.id, name: workoutSheets.name }).from(workoutSheets).where(and(eq(workoutSheets.id, planilha), eq(workoutSheets.createdBy, user.id))).limit(1) : [];
  if (planilha && !sheet) redirect("/planilhas");
  const exerciseList = await db.select({ id: exercises.id, name: exercises.name, description: exercises.description }).from(exercises).orderBy(asc(exercises.name));
  const muscleGroupList = await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups).orderBy(asc(muscleGroups.name));
  return <DashboardShell user={user} signOut={signOut} activePage={sheet ? "sheets" : "workouts"} hideFooter><div className="max-w-3xl">
    <nav aria-label="Breadcrumb" className="breadcrumb mb-5 text-xs text-slate-400"><ol className="breadcrumb-list">
      <li><Link href={sheet ? `/planilhas/${sheet.id}` : "/treinos"} className="font-medium text-slate-500 transition hover:text-slate-700">← Voltar</Link></li>
      <li aria-hidden="true">|</li>
      {sheet ? <><li><Link href="/planilhas" className="transition hover:text-slate-600">Planilhas</Link></li><li aria-hidden="true">›</li><li><Link href={`/planilhas/${sheet.id}`} className="transition hover:text-slate-600">{sheet.name}</Link></li></> : <><li><Link href="/treinos" className="transition hover:text-slate-600">Treinos</Link></li></>}
      <li aria-hidden="true">›</li><li aria-current="page" className="text-slate-400">Novo treino</li>
    </ol></nav>
    <div><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="mt-1 text-sm font-medium text-slate-500">{sheet ? sheet.name : "Treinos"}</p></div><WorkoutBuilder exercises={exerciseList} muscleGroups={muscleGroupList} sheetId={sheet?.id} /></div>
  </div></DashboardShell>;
}
