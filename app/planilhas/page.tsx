import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workoutSheets, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";

export default async function WorkoutSheetsPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/dashboard");

  const sheets = await db.select().from(workoutSheets).where(eq(workoutSheets.createdBy, user.id)).orderBy(asc(workoutSheets.name));
  const workoutList = await db.select({ id: workouts.id, name: workouts.name, sheetId: workouts.sheetId }).from(workouts).where(eq(workouts.createdBy, user.id)).orderBy(asc(workouts.name));

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div><div className="mb-8 flex items-end justify-between gap-4"><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Organização</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Planilhas</h1><p className="mt-2 text-sm text-slate-500">Organize seus treinos, cada um em uma única planilha.</p></div><Link href="/planilhas/nova" className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Nova planilha</Link></div>
    {sheets.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{sheets.map((sheet) => { const sheetWorkouts = workoutList.filter((workout) => workout.sheetId === sheet.id); return <li key={sheet.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"><span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><rect x="5" y="4" width="14" height="17" rx="2" /><path strokeLinecap="round" d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" /></svg></span><h2 className="font-semibold">{sheet.name}</h2>{sheet.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{sheet.description}</p> : <p className="mt-2 text-sm text-slate-400">Sem descrição.</p>}<p className="mt-4 text-xs font-medium text-slate-400">{sheetWorkouts.length} {sheetWorkouts.length === 1 ? "treino" : "treinos"}</p>{sheetWorkouts.length ? <ul className="mt-3 space-y-2">{sheetWorkouts.map((workout) => <li key={workout.id}><Link href={`/treinos/${workout.id}`} className="block rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium hover:bg-slate-100">{workout.name}</Link></li>)}</ul> : null}<Link href={`/treinos/novo?planilha=${sheet.id}`} className="mt-5 block rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">+ Novo treino</Link></li>; })}</ul> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">Nenhuma planilha cadastrada ainda.</div>}
  </div></DashboardShell>;
}
