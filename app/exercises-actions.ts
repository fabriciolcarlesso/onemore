"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exerciseDocuments, exerciseJoints, exerciseMuscleGroups, exercisePrimaryMuscles, exercises, workoutExercises } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { extractPdfAnatomy, saveExtractedAnatomy } from "@/lib/exercise-pdf-anatomy";

export type ExerciseFormState = {
  message: string;
};

const MAX_PDF_SIZE = 15 * 1024 * 1024;

function readField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

export async function uploadExercisePdf(
  _previousState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Sua sessão expirou. Entre novamente." };
  if (user.role === "aluno") return { message: "Apenas professores podem importar exercícios." };

  const requestedName = readField(formData, "name");
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) return { message: "Selecione um arquivo PDF." };
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return { message: "Envie um arquivo PDF válido." };
  if (file.size > MAX_PDF_SIZE) return { message: "O PDF deve ter no máximo 15 MB." };
  const name = requestedName || file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim();
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome de exercício válido." };

  let createdExerciseId: string | undefined;
  let anatomyResult = { muscleCount: 0, primaryMuscleCount: 0, phaseCount: 0, jointCount: 0, description: "" };
  try {
    const content = Buffer.from(await file.arrayBuffer());
    const checksum = createHash("sha256").update(content).digest("hex");
    let extractedText = "";
    let extractionError: string | null = null;
    try {
      extractedText = await extractPdfAnatomy(content);
    } catch (error) {
      extractionError = error instanceof Error ? error.message.slice(0, 500) : "Falha ao extrair o PDF.";
    }
    const [createdExercise] = await db.insert(exercises).values({
      name,
      description: extractedText ? "Dados anatômicos extraídos do PDF. Revise antes de usar no treino." : "Exercício importado de um PDF. Complete os dados anatômicos após a importação.",
      createdBy: user.id,
    }).returning({ id: exercises.id });
    createdExerciseId = createdExercise.id;
    await db.insert(exerciseDocuments).values({
      exerciseId: createdExercise.id,
      originalName: file.name.slice(0, 255),
      mimeType: "application/pdf",
      fileSize: file.size,
      checksum,
      content: content.toString("base64"),
      createdBy: user.id,
      extractedText: extractedText || null,
      status: extractionError ? "error" : "ready",
      errorMessage: extractionError,
    });
    anatomyResult = extractedText ? await saveExtractedAnatomy(createdExercise.id, extractedText) : anatomyResult;
    const extractedName = extractedText?.split(/\r?\n/).map((line) => line.trim().replace(/\s+\d+$/, "")).find((line) => line && !/^[123]\s*[·.]\s*(INÍCIO|MEIO|FIM)/i.test(line));
    if (anatomyResult.description || (!requestedName && extractedName)) await db.update(exercises).set({ name: !requestedName && extractedName ? extractedName.slice(0, 120) : name, description: anatomyResult.description || "Descrição extraída do PDF.", updatedAt: new Date() }).where(eq(exercises.id, createdExercise.id));
  } catch {
    if (createdExerciseId) await db.delete(exercises).where(eq(exercises.id, createdExerciseId));
    return { message: "Não foi possível salvar o PDF. Tente novamente." };
  }

  revalidatePath("/exercicios");
  if (anatomyResult.muscleCount || anatomyResult.phaseCount || anatomyResult.jointCount) {
    return { message: `PDF importado com sucesso. ${anatomyResult.muscleCount} músculos, ${anatomyResult.jointCount} articulações e ${anatomyResult.phaseCount} fases foram registrados.` };
  }
  return { message: "PDF importado, mas não foi possível identificar os dados anatômicos automaticamente." };
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
