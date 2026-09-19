import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { exerciseMuscleGroups, exercises, muscleGroups } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { ExerciseImage } from "./exercise-image";
import { ExerciseModal } from "./exercise-modal";
import { RichDescription } from "./rich-description";

function exerciseSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ExerciseCard({ exercise, muscleGroups, exerciseGroups }: { exercise: typeof exercises.$inferSelect; muscleGroups: { id: string; name: string }[]; exerciseGroups: { id: string; name: string }[] }) {
  const longDescription = Boolean(exercise.description && exercise.description.length > 180);
  const body = (expanded: boolean) => <div className="p-4"><p className="font-semibold">{exercise.name}</p>{exerciseGroups.length ? <div className="mt-3 flex flex-wrap gap-2">{exerciseGroups.map((group) => <span key={group.id} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-white">{group.name}</span>)}</div> : null}{exercise.description ? expanded ? <RichDescription text={exercise.description} className="mt-2" /> : <div className={`relative mt-2 ${longDescription ? "max-h-[9rem] overflow-hidden" : ""}`}><RichDescription text={exercise.description} />{longDescription ? <span className="absolute inset-x-0 bottom-0 block bg-white pt-1 leading-6 text-slate-500">...</span> : null}</div> : <p className="mt-2 text-sm text-slate-400">Sem descrição.</p>}</div>;
  return <li className="relative min-w-0"><ExerciseModal muscleGroups={muscleGroups} exercise={{ ...exercise, muscleGroups: exerciseGroups }} trigger={<div role="button" tabIndex={0} aria-label={`Editar ${exercise.name}`} className="group relative cursor-pointer"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><ExerciseImage name={exercise.name} slug={exerciseSlug(exercise.name)} />{body(false)}</div><div className="pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-0 shadow-xl transition-opacity duration-700 ease-in-out group-hover:pointer-events-auto group-hover:opacity-100"><ExerciseImage name={exercise.name} slug={exerciseSlug(exercise.name)} />{body(true)}</div></div>} /></li>;
}

export default async function ExercisesPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const exerciseList = await db.select().from(exercises).orderBy(desc(exercises.createdAt));
  const muscleGroupList = await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups).orderBy(muscleGroups.name);
  const exerciseMuscleGroupRows = await db.select({ exerciseId: exerciseMuscleGroups.exerciseId, id: muscleGroups.id, name: muscleGroups.name }).from(exerciseMuscleGroups).innerJoin(muscleGroups, eq(exerciseMuscleGroups.muscleGroupId, muscleGroups.id));
  const groupsByExercise = new Map<string, { id: string; name: string }[]>();
  for (const row of exerciseMuscleGroupRows) {
    groupsByExercise.set(row.exerciseId, [...(groupsByExercise.get(row.exerciseId) ?? []), { id: row.id, name: row.name }]);
  }

  return <DashboardShell user={user} signOut={signOut} activePage="exercises"><section><div className="mb-6 flex items-end justify-between gap-4"><div><p className="mb-3 h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><p className="text-sm font-medium text-slate-400">Biblioteca</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Exercícios</h1><p className="mt-2 text-sm text-slate-500">Gerencie os exercícios disponíveis para seus treinos.</p></div><ExerciseModal muscleGroups={muscleGroupList} /></div><div>{exerciseList.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400 sm:px-8">Nenhum exercício cadastrado ainda.</div> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{exerciseList.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} muscleGroups={muscleGroupList} exerciseGroups={groupsByExercise.get(exercise.id) ?? []} />)}</ul>}</div></section></DashboardShell>;
}
