"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exerciseJoints, exerciseMuscleGroups, exercisePrimaryMuscles, exercises, workoutExercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { importExercisePdf } from "@/lib/exercise-ai-import";

export type ExerciseFormState = {
  message: string;
};

function readField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function importExercisePdfAction(
  _previousState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Sua sessão expirou. Entre novamente." };
  if (user.role !== "admin") return { message: "Apenas administradores podem importar exercícios." };

  const result = await importExercisePdf({ file: formData.get("pdf"), requestedName: readField(formData, "name"), userId: user.id });
  if (!result.ok) return { message: result.message };

  revalidatePath("/exercicios");
  return { message: `“${result.exercise.name}” importado com sucesso e aguardando revisão.` };
}

export async function approveExercise(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return;
  const exerciseId = readField(formData, "exerciseId");
  if (!exerciseId) return;

  await db.update(exercises).set({ reviewStatus: "aprovado", updatedAt: new Date() }).where(eq(exercises.id, exerciseId));
  revalidatePath("/exercicios");
}

export async function deleteExercise(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role === "aluno") return;
  const exerciseId = readField(formData, "exerciseId");
  if (!exerciseId) return;

  await db.delete(workoutExercises).where(eq(workoutExercises.exerciseId, exerciseId));
  await db.delete(exercises).where(eq(exercises.id, exerciseId));
  revalidatePath("/exercicios");
  revalidatePath("/treinos");
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
  let jointIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("jointIds") ?? "[]"));
    jointIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return { message: "As articulações selecionadas são inválidas." };
  }
  let primaryMuscleGroupIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("primaryMuscleGroupIds") ?? "[]"));
    primaryMuscleGroupIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return { message: "Os músculos principais selecionados são inválidos." };
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
    if (jointIds.length) {
      await db.insert(exerciseJoints).values(jointIds.map((jointId, orderIndex) => ({ exerciseId: createdExercise.id, jointId, orderIndex })));
    }
    if (primaryMuscleGroupIds.length) {
      await db.insert(exercisePrimaryMuscles).values(primaryMuscleGroupIds.map((muscleGroupId) => ({ exerciseId: createdExercise.id, muscleGroupId })));
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
  let jointIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("jointIds") ?? "[]"));
    jointIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return { message: "As articulações selecionadas são inválidas." };
  }
  let primaryMuscleGroupIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("primaryMuscleGroupIds") ?? "[]"));
    primaryMuscleGroupIds = Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return { message: "Os músculos principais selecionados são inválidos." };
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
    await db.delete(exerciseJoints).where(eq(exerciseJoints.exerciseId, exerciseId));
    if (jointIds.length) {
      await db.insert(exerciseJoints).values(jointIds.map((jointId, orderIndex) => ({ exerciseId, jointId, orderIndex })));
    }
    await db.delete(exercisePrimaryMuscles).where(eq(exercisePrimaryMuscles.exerciseId, exerciseId));
    if (primaryMuscleGroupIds.length) {
      await db.insert(exercisePrimaryMuscles).values(primaryMuscleGroupIds.map((muscleGroupId) => ({ exerciseId, muscleGroupId })));
    }
  } catch {
    return { message: "Não foi possível atualizar o exercício." };
  }

  revalidatePath("/exercicios");
  return { message: "Exercício atualizado com sucesso." };
}
