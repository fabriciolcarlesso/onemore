import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";

export default async function WorkoutsPage() {
  const user = await requireUser();
  const list = await db.select().from(workouts).where(eq(workouts.createdBy, user.id)).orderBy(desc(workouts.createdAt));
  return <DashboardShell user={user} signOut={signOut} activePage="workouts"><div><div className="mb-8 flex items-end justify-between gap-4"><div><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Biblioteca</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Treinos</h1><p className="mt-2 text-sm text-slate-500">Monte fichas de treino para seus alunos.</p></div><Link href="/treinos/novo" className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Novo treino</Link></div>{list.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((workout) => <li key={workout.id}><Link href={`/treinos/${workout.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"><span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg></span><h2 className="font-semibold">{workout.name}</h2>{workout.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{workout.description}</p> : <p className="mt-2 text-sm text-slate-400">Sem descrição.</p>}</Link></li>)}</ul> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">Nenhum treino cadastrado ainda.</div>}</div></DashboardShell>;
}
