"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workoutSheets } from "@/db/schema";
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
