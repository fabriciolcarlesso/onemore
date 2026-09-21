import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studentWorkouts, users, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";

export default async function WorkoutsPage() {
  const user = await requireUser();
  const list = await db.select().from(workouts).where(eq(workouts.createdBy, user.id)).orderBy(desc(workouts.createdAt));
  const creators = user.role === "aluno" ? await db.select({ workoutId: studentWorkouts.workoutId, teacherName: users.name }).from(studentWorkouts).innerJoin(users, eq(users.id, studentWorkouts.teacherId)).where(eq(studentWorkouts.studentId, user.id)) : [];
  const creatorsByWorkout = new Map(creators.map((entry) => [entry.workoutId, entry.teacherName]));

  return <DashboardShell user={user} signOut={signOut} activePage="workouts"><div><div className="mb-8 flex items-end justify-between gap-4"><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Biblioteca</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Treinos</h1><p className="mt-2 text-sm text-slate-500">{user.role === "aluno" ? "Veja os treinos preparados para você." : "Monte fichas de treino para seus alunos."}</p></div>{user.role !== "aluno" ? <Link href="/treinos/novo" className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Novo treino</Link> : null}</div>
    {list.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((workout) => <li key={workout.id}><Link href={`/treinos/${workout.id}`} className="block h-full rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg></span><h2 className="min-w-0 font-semibold">{workout.name}</h2></div>{workout.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{workout.description}</p> : <p className="mt-3 text-sm text-slate-400">Sem descrição.</p>}{creatorsByWorkout.has(workout.id) ? <p className="mt-2 text-xs text-slate-400">Criado por {creatorsByWorkout.get(workout.id)}</p> : null}</Link></li>)}</ul> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">{user.role === "aluno" ? "Seu professor ainda não vinculou um treino para você." : "Nenhum treino cadastrado ainda."}</div>}
  </div></DashboardShell>;
}
