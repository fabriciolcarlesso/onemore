"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { exercises } from "@/db/schema";
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

  const name = readField(formData, "name");
  const description = readField(formData, "description");

  if (name.length < 2 || name.length > 120) {
    return { message: "Informe um nome de exercício válido." };
  }

  if (description.length > 1000) {
    return { message: "A descrição deve ter no máximo 1.000 caracteres." };
  }

  try {
    await db.insert(exercises).values({
      name,
      description: description || null,
      createdBy: user.id,
    });
  } catch {
    return { message: "Não foi possível cadastrar o exercício." };
  }

  revalidatePath("/exercicios");
  return { message: "Exercício cadastrado com sucesso." };
}
