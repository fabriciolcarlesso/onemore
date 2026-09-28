import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentWorkouts, users, workoutSheets, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { SwipeableWorkoutCard } from "./swipeable-workout-card";

export default async function WorkoutsPage() {
  const user = await requireUser();
  const list = await db.select().from(workouts).where(eq(workouts.createdBy, user.id)).orderBy(desc(workouts.createdAt));
  const creators = user.role === "aluno" ? await db.select({ workoutId: studentWorkouts.workoutId, teacherName: users.name }).from(studentWorkouts).innerJoin(users, eq(users.id, studentWorkouts.teacherId)).where(eq(studentWorkouts.studentId, user.id)) : [];
  const creatorsByWorkout = new Map(creators.map((entry) => [entry.workoutId, entry.teacherName]));
  const assignments = user.role === "aluno" ? await db.select({ workoutId: studentWorkouts.workoutId, sheetName: workoutSheets.name }).from(studentWorkouts).leftJoin(workoutSheets, eq(studentWorkouts.sheetId, workoutSheets.id)).where(eq(studentWorkouts.studentId, user.id)) : [];
  const sheetByWorkout = new Map(assignments.map((entry) => [entry.workoutId, entry.sheetName ?? "Sem planilha"]));
  const groupedWorkouts = new Map<string, typeof list>();
  for (const workout of list) {
    const sheetName = sheetByWorkout.get(workout.id) ?? "Sem planilha";
    groupedWorkouts.set(sheetName, [...(groupedWorkouts.get(sheetName) ?? []), workout]);
  }

  return <DashboardShell user={user} signOut={signOut} activePage="workouts"><div><div className="mb-8 flex items-end justify-between gap-4"><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Biblioteca</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Treinos</h1><p className="mt-2 text-sm text-slate-500">{user.role === "aluno" ? "Veja os treinos preparados para você." : "Monte fichas de treino para seus alunos."}</p></div>{user.role !== "aluno" ? <Link href="/treinos/novo" className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Novo treino</Link> : null}</div>
    {list.length ? user.role === "aluno" ? <div className="space-y-8">{Array.from(groupedWorkouts.entries()).map(([sheetName, sheetList]) => <section key={sheetName}><h2 className="mb-3 text-sm font-semibold text-slate-500">{sheetName}</h2><ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sheetList.map((workout) => <SwipeableWorkoutCard key={workout.id} isStudent workout={{ id: workout.id, name: workout.name, description: workout.description, creator: creatorsByWorkout.get(workout.id) ?? null }} />)}</ul></section>)}</div> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((workout) => <SwipeableWorkoutCard key={workout.id} workout={{ id: workout.id, name: workout.name, description: workout.description, creator: null }} />)}</ul> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">{user.role === "aluno" ? "Seu professor ainda não vinculou um treino para você." : "Nenhum treino cadastrado ainda."}</div>}
  </div></DashboardShell>;
}
