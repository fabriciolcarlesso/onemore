import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { exercises, muscleGroups, workoutExercises, workoutGroups, workoutSheets, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { WorkoutBuilder } from "../../workout-builder";

export default async function EditWorkoutPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ novoExercicio?: string }> }) {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id))).limit(1);
  if (!workout) notFound();
  const [sheet] = workout.sheetId ? await db.select({ id: workoutSheets.id, name: workoutSheets.name }).from(workoutSheets).where(eq(workoutSheets.id, workout.sheetId)).limit(1) : [];
  const groups = await db.select().from(workoutGroups).where(eq(workoutGroups.workoutId, id)).orderBy(asc(workoutGroups.orderIndex));
  const items = groups.length ? await db.select().from(workoutExercises).where(inArray(workoutExercises.groupId, groups.map((group) => group.id))).orderBy(asc(workoutExercises.orderIndex)) : [];
  const exerciseList = await db.select({ id: exercises.id, name: exercises.name, description: exercises.description }).from(exercises).orderBy(asc(exercises.name));
  const muscleGroupList = await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups).orderBy(asc(muscleGroups.name));
  const data = { ...workout, groups: groups.map((group) => ({ ...group, restSeconds: group.restSeconds === null ? "" : String(group.restSeconds), exercises: items.filter((item) => item.groupId === group.id).map((item) => ({ ...item, load: item.load ?? "" })) })) };
  const { novoExercicio } = await searchParams;
  return <DashboardShell user={user} signOut={signOut} activePage={workout.sheetId ? "sheets" : "workouts"} hideFooter><div><nav aria-label="Breadcrumb" className="breadcrumb mb-5 text-xs text-slate-400"><ol className="breadcrumb-list"><li><Link href={sheet ? `/planilhas/${sheet.id}` : "/treinos"} className="font-medium text-slate-500 transition hover:text-slate-700">← Voltar</Link></li><li aria-hidden="true">|</li>{sheet ? <><li><Link href="/planilhas" className="transition hover:text-slate-600">Planilhas</Link></li><li aria-hidden="true">›</li><li><Link href={`/planilhas/${sheet.id}`} className="transition hover:text-slate-600">{sheet.name}</Link></li></> : <li><Link href="/treinos" className="transition hover:text-slate-600">Treinos</Link></li>}<li aria-hidden="true">›</li><li><Link href={`/treinos/${workout.id}`} className="transition hover:text-slate-600">{workout.name}</Link></li><li aria-hidden="true">›</li><li aria-current="page" className="text-slate-400">{novoExercicio === "1" ? "Novo exercício" : "Editar treino"}</li></ol></nav><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="mt-1 text-sm font-medium text-slate-500">{novoExercicio === "1" ? "Novo exercício" : "Treinos"}</p></div><WorkoutBuilder exercises={exerciseList} muscleGroups={muscleGroupList} workout={data} openExercisePicker={novoExercicio === "1"} /></div></DashboardShell>;
}
