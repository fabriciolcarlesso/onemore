import { WorkoutDays } from "../workout-days";
import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { exercises, workoutExercises, workoutGroups, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { WorkoutExerciseList } from "../workout-exercise-list";
import { ExpandableDescription } from "@/app/planilhas/expandable-description";

export default async function WorkoutDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id))).limit(1);
  if (!workout) notFound();

  const groups = await db.select({ id: workoutGroups.id, type: workoutGroups.type, restSeconds: workoutGroups.restSeconds, orderIndex: workoutGroups.orderIndex }).from(workoutGroups).where(eq(workoutGroups.workoutId, workout.id)).orderBy(asc(workoutGroups.orderIndex));
  const items = groups.length ? await db.select({ id: workoutExercises.id, groupId: workoutExercises.groupId, name: exercises.name, sets: workoutExercises.sets, repetitions: workoutExercises.repetitions, orderIndex: workoutExercises.orderIndex }).from(workoutExercises).innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id)).where(inArray(workoutExercises.groupId, groups.map((group) => group.id))).orderBy(asc(workoutExercises.orderIndex)) : [];
  const groupedItems = groups.map((group) => ({ ...group, items: items.filter((item) => item.groupId === group.id) }));

  return <DashboardShell user={user} signOut={signOut} activePage={workout.sheetId ? "sheets" : "workouts"}>
    <div>
      <nav aria-label="Breadcrumb" className="breadcrumb mb-5 text-xs text-slate-400"><ol className="breadcrumb-list"><li><Link href={workout.sheetId ? `/planilhas/${workout.sheetId}` : "/treinos"} className="font-medium text-slate-500 transition hover:text-slate-700">← Voltar</Link></li><li aria-hidden="true">|</li><li><Link href={workout.sheetId ? "/planilhas" : "/treinos"} className="transition hover:text-slate-600">{workout.sheetId ? "Planilhas" : "Treinos"}</Link></li><li aria-hidden="true">›</li><li aria-current="page" className="text-slate-400">{workout.name}</li></ol></nav>
      <div className="mb-5">
        <span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" />
        <p className="text-sm font-medium text-slate-400">Ficha de treino</p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight sm:text-3xl">{workout.name}</h1>
          {user.role !== "aluno" ? <Link href={`/treinos/${workout.id}/editar`} aria-label="Editar treino" title="Editar treino" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4"><path d="m4 16.5-.7 3.2 3.2-.7L18.2 7.3a2.3 2.3 0 0 0-3.2-3.2L3.3 15.4" /><path d="m13.8 5.8 3.2 3.2" /></svg></Link> : null}
        </div>
        <WorkoutDays days={workout.weekdays} />
        {workout.description ? <ExpandableDescription text={workout.description} /> : null}
      </div>
      <WorkoutExerciseList workoutId={workout.id} groups={groupedItems} canReorder={user.role !== "aluno"} />
      {user.role !== "aluno" ? <Link href={`/treinos/${workout.id}/editar`} aria-label="Adicionar exercício" title="Adicionar exercício" className="fixed right-8 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-30 flex size-16 items-center justify-center rounded-full bg-slate-950 text-4xl font-light leading-none text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 sm:right-10 xl:right-12">+</Link> : null}
    </div>
  </DashboardShell>;
}
