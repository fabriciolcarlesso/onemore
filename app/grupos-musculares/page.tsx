import { asc } from "drizzle-orm";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { muscleGroups } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { GroupCreateButton } from "./group-create-button";
import { MuscleList } from "./muscle-list";

const PAGE_SIZE = 20;

export default async function MuscleGroupsPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const groups = await db.select({ id: muscleGroups.id, name: muscleGroups.name, description: muscleGroups.description }).from(muscleGroups).orderBy(asc(muscleGroups.name)).limit(PAGE_SIZE);
  return (
    <DashboardShell user={user} signOut={signOut} activePage="muscle-groups">
      <div>

        <div className="mb-8">


          <span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Grupos musculares</h1><p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Consulte, cadastre e edite os grupos musculares usados nos exercícios.</p>

        </div>
        <MuscleList initialGroups={groups} />
        <GroupCreateButton />
      </div>
    </DashboardShell>
  );
}
