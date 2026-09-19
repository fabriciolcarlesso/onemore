import { eq } from "drizzle-orm";
import { db } from "@/db";
import { studentPlans } from "@/db/schema";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { PlanPicker } from "./plan-picker";

export default async function PlansPage() {
  const user = await requireUser();
  if (user.role !== "aluno") redirect("/dashboard");

  const [chosenPlan] = await db.select({ planId: studentPlans.planId }).from(studentPlans).where(eq(studentPlans.studentId, user.id)).limit(1);

  return <DashboardShell user={user} signOut={signOut} activePage="plans">
    <div className="w-full">
      <header className="mb-8">
        <span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" />
        <p className="text-sm font-medium text-slate-400">Sua assinatura</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Escolha seu plano</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Encontre uma opção para acompanhar sua rotina de treinos.</p>
      </header>
      <PlanPicker initialPlanId={chosenPlan?.planId ?? ""} />
    </div>
  </DashboardShell>;
}
