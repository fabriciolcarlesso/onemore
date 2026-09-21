import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { exercises, muscleGroups, workoutExercises, workoutGroups, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { WorkoutBuilder } from "../../workout-builder";

export default async function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id))).limit(1);
  if (!workout) notFound();
  const groups = await db.select().from(workoutGroups).where(eq(workoutGroups.workoutId, id)).orderBy(asc(workoutGroups.orderIndex));
  const items = groups.length ? await db.select().from(workoutExercises).where(inArray(workoutExercises.groupId, groups.map((group) => group.id))).orderBy(asc(workoutExercises.orderIndex)) : [];
  const exerciseList = await db.select({ id: exercises.id, name: exercises.name, description: exercises.description }).from(exercises).orderBy(asc(exercises.name));
  const muscleGroupList = await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups).orderBy(asc(muscleGroups.name));
  const data = { ...workout, groups: groups.map((group) => ({ ...group, restSeconds: group.restSeconds === null ? "" : String(group.restSeconds), exercises: items.filter((item) => item.groupId === group.id).map((item) => ({ ...item, load: item.load ?? "" })) })) };
  return <DashboardShell user={user} signOut={signOut} activePage="workouts" hideFooter><div><Link href={`/treinos/${id}`} className="text-sm text-slate-500 hover:text-slate-950">← Voltar para o treino</Link><WorkoutBuilder exercises={exerciseList} muscleGroups={muscleGroupList} workout={data} /></div></DashboardShell>;
}
