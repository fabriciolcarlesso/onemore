import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { joints } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { JointList } from "./joint-list";
import { JointCreateButton } from "./joint-create-button";

const PAGE_SIZE = 20;

export default async function JointsPage() {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/treinos");
  const rows = await db.select({ id: joints.id, name: joints.name, region: joints.region, description: joints.description }).from(joints).orderBy(asc(joints.name)).limit(PAGE_SIZE);
  return (
    <DashboardShell user={user} signOut={signOut} activePage="joints">
      <div>
        <div className="mb-8">
          <span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" />
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Articulações</h1>
        </div>
        <JointList initialJoints={rows} />
        <JointCreateButton />
      </div>
    </DashboardShell>
  );
}
