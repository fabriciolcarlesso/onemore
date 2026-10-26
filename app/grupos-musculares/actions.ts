"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { muscleGroups } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createMuscleGroup(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return;
  const name = field(formData, "name");
  const description = field(formData, "description");
  if (name.length < 2 || description.length < 2) return;
  await db.insert(muscleGroups).values({ name, description });
  revalidatePath("/grupos-musculares");
}

export async function updateMuscleGroup(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return;
  const id = field(formData, "id");
  const name = field(formData, "name");
  const description = field(formData, "description");
  if (!id || name.length < 2 || description.length < 2) return;
  await db.update(muscleGroups).set({ name, description }).where(eq(muscleGroups.id, id));
  revalidatePath("/grupos-musculares");
}

export async function deleteMuscleGroup(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return;
  const id = field(formData, "id");
  if (!id) return;
  await db.delete(muscleGroups).where(eq(muscleGroups.id, id));
  revalidatePath("/grupos-musculares");
  revalidatePath("/exercicios");
}
