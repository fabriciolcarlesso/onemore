import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { exercises, workoutExercises, workoutGroups, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";

export default async function WorkoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id))).limit(1);
  if (!workout) notFound();
  const groups = await db.select({ id: workoutGroups.id, type: workoutGroups.type, orderIndex: workoutGroups.orderIndex }).from(workoutGroups).where(eq(workoutGroups.workoutId, workout.id)).orderBy(asc(workoutGroups.orderIndex));
  const items = groups.length ? await db.select({ groupId: workoutExercises.groupId, name: exercises.name, sets: workoutExercises.sets, repetitions: workoutExercises.repetitions, load: workoutExercises.load, orderIndex: workoutExercises.orderIndex }).from(workoutExercises).innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id)).where(inArray(workoutExercises.groupId, groups.map((group) => group.id))).orderBy(asc(workoutExercises.orderIndex)) : [];
  return <DashboardShell user={user} signOut={signOut} activePage="workouts"><div><Link href="/treinos" className="text-sm text-slate-500 hover:text-slate-950">← Voltar para treinos</Link><div className="mb-8 mt-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Ficha de treino</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{workout.name}</h1>{workout.description ? <p className="mt-2 text-sm text-slate-500">{workout.description}</p> : null}</div><div className="space-y-5">{groups.map((group, index) => <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-sm font-semibold text-slate-500">{group.type === "single" ? `Exercício ${index + 1}` : group.type === "bi_set" ? `Bi-set ${index + 1}` : `Tri-set ${index + 1}`}</h2><p className="mt-1 text-xs text-slate-400">{group.type === "single" ? "Série individual" : group.type === "bi_set" ? "Dois exercícios em sequência" : "Três exercícios em sequência"}</p><div className="mt-5 divide-y divide-slate-100">{items.filter((item) => item.groupId === group.id).map((item) => <div key={`${item.groupId}-${item.orderIndex}-${item.name}`} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><span className="font-medium">{item.name}</span><span className="text-sm text-slate-500">{item.sets}x{item.repetitions}{item.load ? ` · ${item.load} kg` : ""}</span></div>)}</div></section>)}</div></div></DashboardShell>;
}
