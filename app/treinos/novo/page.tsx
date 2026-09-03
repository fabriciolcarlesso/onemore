import { asc } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { WorkoutBuilder } from "../workout-builder";

export default async function NewWorkoutPage() {
  const user = await requireUser();
  const exerciseList = await db.select({ id: exercises.id, name: exercises.name }).from(exercises).orderBy(asc(exercises.name));
  return <DashboardShell user={user} signOut={signOut} activePage="workouts"><div><div className="mb-8"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Treinos</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Novo treino</h1><p className="mt-2 text-sm text-slate-500">Monte a ficha e organize os exercícios.</p></div><WorkoutBuilder exercises={exerciseList} /></div></DashboardShell>;
}
