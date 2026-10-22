import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { exerciseJoints, exerciseMuscleGroups, exercisePrimaryMuscles, exercises, joints, muscleGroups } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { ExerciseImage } from "./exercise-image";
import { ExerciseModal } from "./exercise-modal";
import { ExercisePdfForm } from "./exercise-pdf-form";
import { ExerciseDeleteButton } from "./exercise-delete-button";
import { RichDescription } from "./rich-description";

function exerciseSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ExerciseCard({ exercise, muscleGroups, joints, primaryMuscles, exerciseGroups, exerciseJoints, exercisePrimaryMuscles }: { exercise: typeof exercises.$inferSelect; muscleGroups: { id: string; name: string }[]; joints: { id: string; name: string; movement?: string | null }[]; primaryMuscles: { id: string; name: string }[]; exerciseGroups: { id: string; name: string }[]; exerciseJoints: { id: string; name: string; movement: string | null }[]; exercisePrimaryMuscles: { id: string; name: string }[] }) {
  const longDescription = Boolean(exercise.description && exercise.description.length > 180);
  const body = (expanded: boolean) => <div className="px-4 py-6"><p className="font-semibold">{exercise.name}</p>{exercisePrimaryMuscles.length ? <div className="mt-5"><div className="flex flex-wrap gap-2">{exercisePrimaryMuscles.map((group) => <span key={group.id} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-white">{group.name}</span>)}</div></div> : null}{exercise.description ? expanded ? <div className="mt-5 border-t border-slate-200 pt-4"><RichDescription text={exercise.description} /></div> : <div className={`relative mt-5 border-t border-slate-200 pt-4 ${longDescription ? "max-h-[9rem] overflow-hidden" : ""}`}><RichDescription text={exercise.description} />{longDescription ? <span className="absolute inset-x-0 bottom-0 block bg-white pt-1 leading-6 text-slate-500">...</span> : null}</div> : <p className="mt-5 text-sm text-slate-400">Sem descrição.</p>}</div>;
  return <li className="relative min-w-0"><div className="absolute right-2 top-2 z-20"><ExerciseDeleteButton exerciseId={exercise.id} exerciseName={exercise.name} /></div><ExerciseModal muscleGroups={muscleGroups} joints={joints} primaryMuscles={primaryMuscles} exercise={{ ...exercise, muscleGroups: exerciseGroups, primaryMuscles: exercisePrimaryMuscles, joints: exerciseJoints }} trigger={<div role="button" tabIndex={0} aria-label={`Editar ${exercise.name}`} className="group relative cursor-pointer"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><ExerciseImage name={exercise.name} slug={exerciseSlug(exercise.name)} />{body(false)}</div><div className="pointer-events-none absolute inset-x-0 top-0 z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white opacity-0 shadow-xl transition-opacity duration-700 ease-in-out group-hover:pointer-events-auto group-hover:opacity-100"><ExerciseImage name={exercise.name} slug={exerciseSlug(exercise.name)} />{body(true)}</div></div>} /></li>;
}

export default async function ExercisesPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const exerciseList = await db.select().from(exercises).orderBy(desc(exercises.createdAt));
  const muscleGroupList = await db.select({ id: muscleGroups.id, name: muscleGroups.name }).from(muscleGroups).orderBy(muscleGroups.name);
  const jointList = await db.select({ id: joints.id, name: joints.name }).from(joints).orderBy(joints.name);
  const exerciseMuscleGroupRows = await db.select({ exerciseId: exerciseMuscleGroups.exerciseId, id: muscleGroups.id, name: muscleGroups.name }).from(exerciseMuscleGroups).innerJoin(muscleGroups, eq(exerciseMuscleGroups.muscleGroupId, muscleGroups.id));
  const exerciseJointRows = await db.select({ exerciseId: exerciseJoints.exerciseId, id: joints.id, name: joints.name, movement: exerciseJoints.movement }).from(exerciseJoints).innerJoin(joints, eq(exerciseJoints.jointId, joints.id));
  const exercisePrimaryMuscleRows = await db.select({ exerciseId: exercisePrimaryMuscles.exerciseId, id: muscleGroups.id, name: muscleGroups.name }).from(exercisePrimaryMuscles).innerJoin(muscleGroups, eq(exercisePrimaryMuscles.muscleGroupId, muscleGroups.id));
  const groupsByExercise = new Map<string, { id: string; name: string }[]>();
  for (const row of exerciseMuscleGroupRows) {
    groupsByExercise.set(row.exerciseId, [...(groupsByExercise.get(row.exerciseId) ?? []), { id: row.id, name: row.name }]);
  }
  const jointsByExercise = new Map<string, { id: string; name: string; movement: string | null }[]>();
  for (const row of exerciseJointRows) {
    jointsByExercise.set(row.exerciseId, [...(jointsByExercise.get(row.exerciseId) ?? []), { id: row.id, name: row.name, movement: row.movement }]);
  }
  const primaryMusclesByExercise = new Map<string, { id: string; name: string }[]>();
  for (const row of exercisePrimaryMuscleRows) {
    primaryMusclesByExercise.set(row.exerciseId, [...(primaryMusclesByExercise.get(row.exerciseId) ?? []), { id: row.id, name: row.name }]);
  }

  return <DashboardShell user={user} signOut={signOut} activePage="exercises"><section><div className="mb-6 flex items-end justify-between gap-4"><div><p className="mb-3 h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><p className="text-sm font-medium text-slate-400">Biblioteca</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Exercícios</h1><p className="mt-2 text-sm text-slate-500">Gerencie os exercícios disponíveis para seus treinos.</p></div><ExerciseModal muscleGroups={muscleGroupList} joints={jointList} /></div><ExercisePdfForm /><div>{exerciseList.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400 sm:px-8">Nenhum exercício cadastrado ainda.</div> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{exerciseList.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} muscleGroups={muscleGroupList} joints={jointList} primaryMuscles={muscleGroupList} exerciseGroups={groupsByExercise.get(exercise.id) ?? []} exerciseJoints={jointsByExercise.get(exercise.id) ?? []} exercisePrimaryMuscles={primaryMusclesByExercise.get(exercise.id) ?? []} />)}</ul>}</div></section></DashboardShell>;
}
