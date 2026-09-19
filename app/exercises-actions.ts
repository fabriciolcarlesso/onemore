"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exerciseMuscleGroups, exercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export type ExerciseFormState = {
  message: string;
};

function readField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function createExercise(
  _previousState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Sua sessão expirou. Entre novamente." };
  }
  if (user.role === "aluno") {
    return { message: "Apenas professores podem cadastrar exercícios." };
  }

  const name = readField(formData, "name");
  const description = readField(formData, "description");
  let muscleGroupIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("muscleGroupIds") ?? "[]"));
    muscleGroupIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return { message: "Os grupos musculares selecionados são inválidos." };
  }

  if (name.length < 2 || name.length > 120) {
    return { message: "Informe um nome de exercício válido." };
  }

  if (description.length > 1000) {
    return { message: "A descrição deve ter no máximo 1.000 caracteres." };
  }

  try {
    const [createdExercise] = await db.insert(exercises).values({
      name,
      description: description || null,
      createdBy: user.id,
    }).returning({ id: exercises.id });
    if (muscleGroupIds.length) {
      await db.insert(exerciseMuscleGroups).values(muscleGroupIds.map((muscleGroupId) => ({ exerciseId: createdExercise.id, muscleGroupId })));
    }
  } catch {
    return { message: "Não foi possível cadastrar o exercício." };
  }

  revalidatePath("/exercicios");
  return { message: "Exercício cadastrado com sucesso." };
}

export async function updateExercise(
  _previousState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Sua sessão expirou. Entre novamente." };
  if (user.role === "aluno") return { message: "Apenas professores podem editar exercícios." };

  const exerciseId = readField(formData, "exerciseId");
  const name = readField(formData, "name");
  const description = readField(formData, "description");
  let muscleGroupIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("muscleGroupIds") ?? "[]"));
    muscleGroupIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return { message: "Os grupos musculares selecionados são inválidos." };
  }

  if (!exerciseId) return { message: "Exercício inválido." };
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome de exercício válido." };
  if (description.length > 1000) return { message: "A descrição deve ter no máximo 1.000 caracteres." };

  try {
    // O driver HTTP do Neon não oferece transações interativas; as operações
    // são mantidas em sequência para funcionar tanto localmente quanto na Vercel.
    await db.update(exercises).set({ name, description: description || null, updatedAt: new Date() }).where(eq(exercises.id, exerciseId));
    await db.delete(exerciseMuscleGroups).where(eq(exerciseMuscleGroups.exerciseId, exerciseId));
    if (muscleGroupIds.length) {
      await db.insert(exerciseMuscleGroups).values(muscleGroupIds.map((muscleGroupId) => ({ exerciseId, muscleGroupId })));
    }
  } catch {
    return { message: "Não foi possível atualizar o exercício." };
  }

  revalidatePath("/exercicios");
  return { message: "Exercício atualizado com sucesso." };
}
