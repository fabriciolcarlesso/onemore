"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { plans, studentPlans } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export async function selectStudentPlan(planId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "aluno") return { ok: false, message: "Entre com uma conta de aluno para escolher seu plano." };
  if (typeof planId !== "string" || !["free", "monthly", "quarterly", "semiannual", "yearly"].includes(planId)) return { ok: false, message: "Selecione um plano válido." };
  try {
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) return { ok: false, message: "Este plano não está disponível." };
    const now = new Date();
    const freeExpiresAt = plan.trialDays ? new Date(now.getTime() + plan.trialDays * 86400000) : null;
    await db.insert(studentPlans).values({ studentId: user.id, planId, selectedAt: now, freeExpiresAt }).onConflictDoUpdate({
      target: studentPlans.studentId,
      set: { planId, selectedAt: now, freeExpiresAt: sql`coalesce(${studentPlans.freeExpiresAt}, ${freeExpiresAt?.toISOString() ?? null}::timestamptz)` },
      setWhere: sql`${studentPlans.planId} <> ${planId}`,
    });
    revalidatePath("/planos");
    revalidatePath("/dashboard");
    return { ok: true, message: "Plano salvo com sucesso." };
  } catch {
    return { ok: false, message: "Não foi possível salvar seu plano. Tente novamente." };
  }
}
