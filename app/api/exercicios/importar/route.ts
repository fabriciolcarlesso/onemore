import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { importExercisePdf } from "@/lib/exercise-ai-import";

export const maxDuration = 300;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ message: "Apenas administradores podem importar exercícios." }, { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Envie o PDF como multipart/form-data no campo \"pdf\"." }, { status: 400 });
  }

  const result = await importExercisePdf({ file: formData.get("pdf"), requestedName: String(formData.get("name") ?? "").trim(), userId: user.id });
  if (!result.ok) return NextResponse.json({ message: result.message, exerciseId: result.exerciseId }, { status: result.status });

  revalidatePath("/exercicios");
  return NextResponse.json({ exercise: result.exercise, counts: result.counts, organized: result.organized }, { status: 201 });
}
