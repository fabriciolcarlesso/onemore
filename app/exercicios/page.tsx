import { desc } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { ExerciseImage } from "./exercise-image";
import { ExerciseModal } from "./exercise-modal";

function exerciseSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function ExercisesPage() {
  const user = await requireUser();
  const exerciseList = await db.select().from(exercises).orderBy(desc(exercises.createdAt));

  return <DashboardShell user={user} signOut={signOut} activePage="exercises"><section><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-slate-400">Biblioteca</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Exercícios</h1><p className="mt-2 text-sm text-slate-500">Gerencie os exercícios disponíveis para seus treinos.</p></div><ExerciseModal /></div><div>{exerciseList.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400 sm:px-8">Nenhum exercício cadastrado ainda.</div> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{exerciseList.map((exercise) => <li key={exercise.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-sm"><ExerciseImage name={exercise.name} slug={exerciseSlug(exercise.name)} /><div className="p-4"><p className="font-semibold">{exercise.name}</p>{exercise.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{exercise.description}</p> : <p className="mt-2 text-sm text-slate-400">Sem descrição.</p>}</div></li>)}</ul>}</div></section></DashboardShell>;
}
