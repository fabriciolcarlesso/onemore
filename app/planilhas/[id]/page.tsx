import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { workoutSheets, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { WorkoutDays } from "@/app/treinos/workout-days";

export default async function WorkoutSheetDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/dashboard");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [sheet] = await db.select().from(workoutSheets).where(and(eq(workoutSheets.id, id), eq(workoutSheets.createdBy, user.id))).limit(1);
  if (!sheet) notFound();

  const sheetWorkouts = await db.select({ id: workouts.id, name: workouts.name, description: workouts.description, weekdays: workouts.weekdays }).from(workouts).where(and(eq(workouts.sheetId, id), eq(workouts.createdBy, user.id))).orderBy(asc(workouts.name));

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div><Link href="/planilhas" className="text-sm text-slate-500 hover:text-slate-950">← Voltar para planilhas</Link><div className="mb-8 mt-6 flex flex-wrap items-end justify-between gap-4"><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Planilha</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{sheet.name}</h1>{sheet.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{sheet.description}</p> : null}</div><Link href={`/treinos/novo?planilha=${sheet.id}`} className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Adicionar treino</Link></div>
    {sheetWorkouts.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sheetWorkouts.map((workout) => <li key={workout.id}><Link href={`/treinos/${workout.id}`} className="flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg></span><div className="min-w-0"><h2 className="font-semibold">{workout.name}</h2><WorkoutDays days={workout.weekdays} />{workout.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{workout.description}</p> : <p className="mt-3 text-sm text-slate-400">Sem descrição.</p>}</div></Link></li>)}</ul> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">Nenhum treino nesta planilha ainda.</div>}
  </div></DashboardShell>;
}
