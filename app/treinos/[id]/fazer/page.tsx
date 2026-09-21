import Link from "next/link";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutExercises, workoutGroups, workouts } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { WorkoutPlayer } from "../../workout-player";

export default async function DoWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id))).limit(1);
  if (!workout) notFound();
  const backHref = workout.sheetId ? `/planilhas/${workout.sheetId}` : "/treinos";
  const requestHeaders = await headers();
  const { device, isBot } = userAgent({ headers: requestHeaders });
  if (isBot || device.type !== "mobile") {
    return <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6"><div className="max-w-sm text-center"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-6 size-16 text-slate-700"><rect x="6" y="2" width="12" height="20" rx="3" /><path strokeLinecap="round" d="M10 18h4" /></svg><h1 className="text-2xl font-semibold text-slate-950">Use o celular para fazer o seu treino</h1><Link href={backHref} className="mt-8 inline-block rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">{workout.sheetId ? "Voltar para planilha" : "Voltar para treinos"}</Link></div></main>;
  }

  const groups = await db.select().from(workoutGroups).where(eq(workoutGroups.workoutId, id)).orderBy(asc(workoutGroups.orderIndex));
  const items = groups.length ? await db.select({ id: workoutExercises.id, groupId: workoutExercises.groupId, name: exercises.name, description: exercises.description, sets: workoutExercises.sets, repetitions: workoutExercises.repetitions, load: workoutExercises.load }).from(workoutExercises).innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id)).where(inArray(workoutExercises.groupId, groups.map((group) => group.id))).orderBy(asc(workoutExercises.orderIndex)) : [];

  const steps = groups.flatMap((group) => items.filter((item) => item.groupId === group.id).map((item) => ({ ...item, type: group.type, restSeconds: group.restSeconds, notes: group.notes })));
  return <WorkoutPlayer emailPending={user.role === "aluno" && !user.emailVerifiedAt} workoutId={workout.id} name={workout.name} steps={steps} gender={user.preferredTeacher === "julieta" ? "feminino" : "masculino"} backHref={backHref} />;
}
