"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { workoutSheets, workouts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export type SheetFormState = { message: string };

export async function createWorkoutSheet(_previous: SheetFormState, formData: FormData): Promise<SheetFormState> {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return { message: "Apenas professores e administradores podem cadastrar planilhas." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome entre 2 e 120 caracteres." };
  if (description.length > 1000) return { message: "A descrição deve ter no máximo 1.000 caracteres." };

  let sheetId: string;
  try {
    const [created] = await db.insert(workoutSheets).values({ name, description: description || null, createdBy: user.id }).returning({ id: workoutSheets.id });
    sheetId = created.id;
  } catch {
    return { message: "Não foi possível cadastrar a planilha." };
  }

  revalidatePath("/planilhas");
  redirect(`/treinos/novo?planilha=${sheetId}`);
}

export async function updateWorkoutSheet(_previous: SheetFormState, formData: FormData): Promise<SheetFormState> {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return { message: "Apenas professores e administradores podem editar planilhas." };

  const sheetId = String(formData.get("sheetId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(sheetId)) return { message: "Planilha inválida." };
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome entre 2 e 120 caracteres." };
  if (description.length > 1000) return { message: "A descrição deve ter no máximo 1.000 caracteres." };

  const [updated] = await db.update(workoutSheets).set({ name, description: description || null, updatedAt: new Date() }).where(and(eq(workoutSheets.id, sheetId), eq(workoutSheets.createdBy, user.id))).returning({ id: workoutSheets.id });
  if (!updated) return { message: "Não foi possível encontrar esta planilha." };

  revalidatePath("/planilhas");
  revalidatePath(`/planilhas/${sheetId}`);
  redirect(`/planilhas/${sheetId}`);
}

export async function deleteWorkoutSheet(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return;

  const sheetId = String(formData.get("sheetId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(sheetId)) return;

  const linkedWorkouts = await db.select({ id: workouts.id }).from(workouts).where(and(eq(workouts.sheetId, sheetId), eq(workouts.createdBy, user.id)));
  if (linkedWorkouts.length) {
    await db.delete(workouts).where(inArray(workouts.id, linkedWorkouts.map((workout) => workout.id)));
  }
  await db.delete(workoutSheets).where(and(eq(workoutSheets.id, sheetId), eq(workoutSheets.createdBy, user.id)));
  revalidatePath("/planilhas");
  revalidatePath(`/planilhas/${sheetId}`);
  revalidatePath("/treinos");
}

export async function deleteWorkoutFromSheet(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return;
  const workoutId = String(formData.get("workoutId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(workoutId)) return;
  const [workout] = await db.select({ id: workouts.id, sheetId: workouts.sheetId }).from(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.createdBy, user.id))).limit(1);
  if (!workout) return;
  await db.delete(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.createdBy, user.id)));
  revalidatePath("/planilhas");
  revalidatePath("/treinos");
  if (workout.sheetId) revalidatePath(`/planilhas/${workout.sheetId}`);
}
