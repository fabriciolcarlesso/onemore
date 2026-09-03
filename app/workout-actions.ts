"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workoutExercises, workoutGroups, workouts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

export type WorkoutFormState = { message: string };

export async function createWorkout(_previous: WorkoutFormState, formData: FormData): Promise<WorkoutFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Sua sessão expirou. Entre novamente." };
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome válido para o treino." };

  let groups: { type: "single" | "bi_set" | "tri_set"; exercises: { exerciseId: string; sets: number; repetitions: number; load?: number }[] }[];
  try { groups = JSON.parse(String(formData.get("groups") ?? "[]")); } catch { return { message: "Adicione ao menos um exercício válido." }; }
  if (!groups.length || !groups.every((group) => group.exercises?.length)) return { message: "Adicione ao menos um exercício ao treino." };

  try {
    const [workout] = await db.insert(workouts).values({ name, description: description || null, createdBy: user.id }).returning({ id: workouts.id });
    for (const [groupIndex, group] of groups.entries()) {
      const [createdGroup] = await db.insert(workoutGroups).values({ workoutId: workout.id, type: group.type, orderIndex: groupIndex }).returning({ id: workoutGroups.id });
      await db.insert(workoutExercises).values(group.exercises.map((exercise, index) => ({ groupId: createdGroup.id, exerciseId: exercise.exerciseId, orderIndex: index, sets: Number(exercise.sets), repetitions: Number(exercise.repetitions), load: exercise.load ? String(exercise.load) : null })));
    }
  } catch { return { message: "Não foi possível salvar o treino." }; }
  revalidatePath("/treinos");
  redirect("/treinos");
}
