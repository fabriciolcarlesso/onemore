import { WorkoutDays } from "../workout-days";
import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { exercises, workoutExercises, workoutGroups, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { LoadHistoryButton } from "../load-controls";
import { LoadPicker } from "../load-picker";

export default async function WorkoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id))).limit(1);
  if (!workout) notFound();
  const backHref = workout.sheetId ? `/planilhas/${workout.sheetId}` : "/treinos";
  const backLabel = workout.sheetId ? "Voltar para planilha" : "Voltar para treinos";
  const groups = await db.select({ id: workoutGroups.id, type: workoutGroups.type, restSeconds: workoutGroups.restSeconds, orderIndex: workoutGroups.orderIndex }).from(workoutGroups).where(eq(workoutGroups.workoutId, workout.id)).orderBy(asc(workoutGroups.orderIndex));
  const items = groups.length ? await db.select({ id: workoutExercises.id, groupId: workoutExercises.groupId, name: exercises.name, sets: workoutExercises.sets, repetitions: workoutExercises.repetitions, load: workoutExercises.load, orderIndex: workoutExercises.orderIndex }).from(workoutExercises).innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id)).where(inArray(workoutExercises.groupId, groups.map((group) => group.id))).orderBy(asc(workoutExercises.orderIndex)) : [];
  return <DashboardShell user={user} signOut={signOut} activePage={workout.sheetId ? "sheets" : "workouts"}><div><Link href={backHref} className="text-sm text-slate-500 hover:text-slate-950">← {backLabel}</Link>{user.role !== "aluno" ? <Link href={`/treinos/${workout.id}/editar`} className="ml-4 inline-block rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Editar treino</Link> : null}<div className="mb-8 mt-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Ficha de treino</p><div className="mt-3 flex items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg></span><h1 className="min-w-0 text-2xl font-semibold tracking-tight sm:text-3xl">{workout.name}</h1></div><WorkoutDays days={workout.weekdays} />{workout.description ? <p className="mt-2 text-sm text-slate-500">{workout.description}</p> : null}</div><div className="space-y-5">{groups.map((group, index) => <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4"><h2 className="text-sm font-semibold text-slate-500">{`Série ${index + 1}`}</h2><div className="mt-3 divide-y divide-slate-100">{items.filter((item) => item.groupId === group.id).map((item) => <div key={`${item.groupId}-${item.orderIndex}-${item.name}`} className="grid grid-cols-[minmax(0,1fr)_2.5rem_2.5rem_auto] items-center gap-2 py-2 text-[13px]"><div className="min-w-0 truncate"><LoadHistoryButton workoutExerciseId={item.id} exerciseName={item.name} /></div><div className="text-center"><span className="block text-[9px] text-slate-400">Séries</span><span className="font-medium text-slate-600">{item.sets}</span></div><div className="text-center"><span className="block text-[9px] text-slate-400">Reps</span><span className="font-medium text-slate-600">{item.repetitions}</span></div><div className="text-center"><span className="block text-[9px] text-slate-400">Carga</span><LoadPicker workoutExerciseId={item.id} exerciseName={item.name} initialLoad={item.load} /></div></div>)}</div><p className="mt-2 text-xs text-slate-500">Intervalo entre séries: <strong className="text-slate-950">{group.restSeconds === null ? "--" : `${group.restSeconds}s`}</strong></p></section>)}</div></div></DashboardShell>;
}
