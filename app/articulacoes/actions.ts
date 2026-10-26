"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { joints } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const field = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

export async function createJoint(data: FormData) {
  const user = await getCurrentUser(); if (!user || user.role === "aluno") return;
  const name = field(data, "name"); if (name.length < 2) return;
  await db.insert(joints).values({ name, region: field(data, "region") || null, description: field(data, "description") || null });
  revalidatePath("/articulacoes");
}

export async function updateJoint(data: FormData) {
  const user = await getCurrentUser(); if (!user || user.role === "aluno") return;
  const id = field(data, "id"); const name = field(data, "name"); if (!id || name.length < 2) return;
  await db.update(joints).set({ name, region: field(data, "region") || null, description: field(data, "description") || null }).where(eq(joints.id, id));
  revalidatePath("/articulacoes"); revalidatePath("/exercicios");
}

export async function deleteJoint(data: FormData) {
  const user = await getCurrentUser(); if (!user || user.role === "aluno") return;
  const id = field(data, "id"); if (!id) return;
  await db.delete(joints).where(eq(joints.id, id));
  revalidatePath("/articulacoes"); revalidatePath("/exercicios");
}
