import { asc } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { muscleGroups } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";

export default async function MuscleGroupsPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const groups = await db.select().from(muscleGroups).orderBy(asc(muscleGroups.name));

  return (
    <DashboardShell user={user} signOut={signOut} activePage="muscle-groups">
      <div>
        <nav aria-label="Breadcrumb" className="breadcrumb mb-5 text-xs text-slate-400">
          <ol className="breadcrumb-list">
            <li><Link href="/dashboard" className="font-medium text-slate-500 transition hover:text-slate-700">← Voltar</Link></li>
            <li aria-hidden="true">|</li>
            <li aria-current="page" className="text-slate-400">Grupos musculares</li>
          </ol>
        </nav>
        <div className="mb-8">
          <span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-400">Biblioteca</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Grupos musculares</h1>
          <p className="mt-2 text-sm text-slate-500">Consulte os músculos trabalhados nos exercícios.</p>
        </div>
        {groups.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => (
              <li key={group.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">{group.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{group.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">Nenhum grupo muscular cadastrado.</div>
        )}
      </div>
    </DashboardShell>
  );
}
