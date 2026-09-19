"use server";

import { randomUUID } from "node:crypto";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { and, asc, eq, gte, lt, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { workoutCompletions, workoutExerciseLoadHistory, workoutExercises, workoutGroups, workoutSheets, workouts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { weekdays } from "@/lib/weekdays";

export type WorkoutFormState = { message: string };

export async function createWorkout(_previous: WorkoutFormState, formData: FormData): Promise<WorkoutFormState> {
  return saveWorkout(formData);
}

export async function updateWorkout(_previous: WorkoutFormState, formData: FormData): Promise<WorkoutFormState> {
  const id = String(formData.get("workoutId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { message: "Treino inválido." };
  return saveWorkout(formData, id);
}

async function saveWorkout(formData: FormData, workoutId?: string): Promise<WorkoutFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Sua sessão expirou. Entre novamente." };
  if (user.role === "aluno") return { message: "Apenas professores e administradores podem montar ou editar treinos." };
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sheetId = workoutId ? "" : String(formData.get("sheetId") ?? "").trim();
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome válido para o treino." };
  if (description.length > 1000) return { message: "A descrição deve ter no máximo 1.000 caracteres." };
  const submittedDays = formData.getAll("weekdays");
  if (submittedDays.some((day) => typeof day !== "string" || !weekdays.some((option) => option.value === day))) {
    return { message: "Selecione dias da semana válidos." };
  }
  const selectedDays = weekdays.filter((day) => submittedDays.includes(day.value)).map((day) => day.value);

  let groups: { id?: string; muscleGroupId?: string | null; restSeconds?: number | null; notes?: string | null; type: "single" | "bi_set" | "tri_set"; exercises: { id?: string; exerciseId: string; sets: number; repetitions: number; load?: number }[] }[];
  try { groups = JSON.parse(String(formData.get("groups") ?? "[]")); } catch { return { message: "Adicione ao menos um exercício válido." }; }
  const limits = { single: 1, bi_set: 2, tri_set: 3 };
  if (!Array.isArray(groups) || !groups.length || groups.length > 100 || !groups.every((group) =>
    group && Object.hasOwn(limits, group.type) && Array.isArray(group.exercises) && group.exercises.length === limits[group.type] &&
    new Set(group.exercises.map((item) => item?.exerciseId)).size === group.exercises.length &&
    (group.restSeconds == null || (Number.isInteger(group.restSeconds) && group.restSeconds >= 0 && group.restSeconds <= 3600)) &&
    (group.notes == null || (typeof group.notes === "string" && group.notes.trim().length <= 1000)) &&
    group.exercises.every((item) => item && typeof item.exerciseId === "string" && /^[0-9a-f-]{36}$/i.test(item.exerciseId) &&
      Number.isInteger(item.sets) && item.sets > 0 && item.sets <= 1000 && Number.isInteger(item.repetitions) && item.repetitions > 0 && item.repetitions <= 10000 &&
      (item.load === undefined || (typeof item.load === "number" && Number.isFinite(item.load) && item.load >= 0 && item.load <= 999999.99))))) {
    return { message: "Adicione exercícios válidos, com séries, repetições e cargas válidas." };
  }

  const id = workoutId ?? randomUUID();
  try {
    if (sheetId) {
      if (!/^[0-9a-f-]{36}$/i.test(sheetId)) return { message: "Planilha inválida." };
      const [ownedSheet] = await db.select({ id: workoutSheets.id }).from(workoutSheets).where(and(eq(workoutSheets.id, sheetId), eq(workoutSheets.createdBy, user.id))).limit(1);
      if (!ownedSheet) return { message: "Planilha não encontrada." };
    }
    const existingGroups = workoutId ? await db.select().from(workoutGroups).where(eq(workoutGroups.workoutId, id)) : [];
    if (workoutId) {
      const [owned] = await db.select({ id: workouts.id }).from(workouts).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id))).limit(1);
      if (!owned) return { message: "Treino não encontrado." };
    }
    const existingItems = existingGroups.length ? await db.select().from(workoutExercises).where(inArray(workoutExercises.groupId, existingGroups.map((group) => group.id))) : [];
    const groupIds = new Set<string>();
    const itemIds = new Set<string>();
    for (const group of groups) {
      if (group.id && (!existingGroups.some((entry) => entry.id === group.id) || groupIds.has(group.id))) return { message: "Grupo inválido." };
      if (group.id) groupIds.add(group.id);
      for (const item of group.exercises) {
        if (item.id && (!existingItems.some((entry) => entry.id === item.id && entry.groupId === group.id) || itemIds.has(item.id))) return { message: "Exercício inválido." };
        if (item.id) itemIds.add(item.id);
      }
    }
    const values = { name, description: description || null, weekdays: selectedDays, updatedAt: new Date() };
    const queries: [BatchItem<"pg">, ...BatchItem<"pg">[]] = [workoutId
      ? db.update(workouts).set(values).where(and(eq(workouts.id, id), eq(workouts.createdBy, user.id)))
      : db.insert(workouts).values({ ...values, id, createdBy: user.id, sheetId: sheetId || null })];
    for (const [orderIndex, group] of groups.entries()) {
      const groupId = group.id ?? randomUUID();
      const groupValues = { type: group.type, muscleGroupId: group.muscleGroupId ?? null, restSeconds: group.restSeconds ?? null, notes: group.notes?.trim() || null, orderIndex };
      queries.push(group.id ? db.update(workoutGroups).set(groupValues).where(eq(workoutGroups.id, groupId)) : db.insert(workoutGroups).values({ ...groupValues, id: groupId, workoutId: id }));
      for (const [itemIndex, item] of group.exercises.entries()) {
        const previous = existingItems.find((entry) => entry.id === item.id);
        const itemValues = { exerciseId: item.exerciseId, sets: item.sets, repetitions: item.repetitions, load: item.load === undefined ? null : String(item.load), orderIndex: itemIndex };
        if (previous && previous.exerciseId === item.exerciseId) {
          queries.push(db.update(workoutExercises).set(itemValues).where(eq(workoutExercises.id, previous.id)));
        } else {
          if (previous) queries.push(db.delete(workoutExercises).where(eq(workoutExercises.id, previous.id)));
          queries.push(db.insert(workoutExercises).values({ ...itemValues, groupId }));
        }
      }
    }
    const removedItems = existingItems.filter((item) => !itemIds.has(item.id)).map((item) => item.id);
    if (removedItems.length) queries.push(db.delete(workoutExercises).where(inArray(workoutExercises.id, removedItems)));
    const removedGroups = existingGroups.filter((group) => !groupIds.has(group.id)).map((group) => group.id);
    if (removedGroups.length) queries.push(db.delete(workoutGroups).where(inArray(workoutGroups.id, removedGroups)));
    await db.batch(queries);
  } catch { return { message: "Não foi possível salvar o treino." }; }
  revalidatePath("/treinos");
  revalidatePath(`/treinos/${id}`);
  revalidatePath(`/treinos/${id}/editar`);
  revalidatePath("/dashboard");
  if (sheetId) revalidatePath("/planilhas");
  redirect(workoutId ? `/treinos/${id}` : sheetId ? "/planilhas" : "/treinos");
}

async function getOwnedWorkoutExercise(userId: string, workoutExerciseId: string) {
  const [item] = await db.select({ id: workoutExercises.id, load: workoutExercises.load }).from(workoutExercises).innerJoin(workoutGroups, eq(workoutExercises.groupId, workoutGroups.id)).innerJoin(workouts, eq(workoutGroups.workoutId, workouts.id)).where(and(eq(workoutExercises.id, workoutExerciseId), eq(workouts.createdBy, userId))).limit(1);
  return item;
}

export async function updateWorkoutExerciseLoad(workoutExerciseId: string, value: number, mode: "delta" | "absolute" = "delta") {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou.", currentLoad: null };
  if ((mode !== "delta" && mode !== "absolute") || !Number.isFinite(value) || (mode === "delta" ? value !== 1 && value !== -1 : value < 0 || value > 999999.99)) return { ok: false, message: "Variação de carga inválida.", currentLoad: null };
  const item = await getOwnedWorkoutExercise(user.id, workoutExerciseId);
  if (!item) return { ok: false, message: "Exercício não encontrado.", currentLoad: null };
  const currentLoad = Number(item.load ?? 0);
  const nextLoad = Math.max(0, Math.round((mode === "absolute" ? value : currentLoad + value) * 100) / 100);

  if (nextLoad > 999999.99) return { ok: false, message: "Carga acima do limite permitido.", currentLoad };
  if (nextLoad === currentLoad) return { ok: true, message: "Carga atualizada.", currentLoad };

  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
    const [todayHistory] = await db.select({ id: workoutExerciseLoadHistory.id }).from(workoutExerciseLoadHistory).where(and(eq(workoutExerciseLoadHistory.workoutExerciseId, workoutExerciseId), eq(workoutExerciseLoadHistory.userId, user.id), gte(workoutExerciseLoadHistory.recordedAt, startOfDay), lt(workoutExerciseLoadHistory.recordedAt, endOfDay))).limit(1);
    const [anyHistory] = await db.select({ id: workoutExerciseLoadHistory.id }).from(workoutExerciseLoadHistory).where(and(eq(workoutExerciseLoadHistory.workoutExerciseId, workoutExerciseId), eq(workoutExerciseLoadHistory.userId, user.id))).limit(1);
    let historyId = todayHistory?.id ?? null;
    if (!anyHistory && !historyId) {
      const [baseline] = await db.insert(workoutExerciseLoadHistory).values({ workoutExerciseId, userId: user.id, load: currentLoad.toFixed(2), recordedAt: now }).returning({ id: workoutExerciseLoadHistory.id });
      historyId = baseline.id;
    }
    await db.update(workoutExercises).set({ load: nextLoad.toFixed(2) }).where(eq(workoutExercises.id, workoutExerciseId));
    if (historyId) await db.update(workoutExerciseLoadHistory).set({ load: nextLoad.toFixed(2), recordedAt: now }).where(eq(workoutExerciseLoadHistory.id, historyId));
    else await db.insert(workoutExerciseLoadHistory).values({ workoutExerciseId, userId: user.id, load: nextLoad.toFixed(2), recordedAt: now });
    revalidatePath("/treinos");
    return { ok: true, message: "Carga atualizada.", currentLoad: nextLoad };
  } catch {
    return { ok: false, message: "Não foi possível atualizar a carga.", currentLoad };
  }
}

export async function getWorkoutExerciseLoadHistory(workoutExerciseId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, entries: [], message: "Sua sessão expirou." };
  const item = await getOwnedWorkoutExercise(user.id, workoutExerciseId);
  if (!item) return { ok: false, entries: [], message: "Exercício não encontrado." };
  const entries = await db.select({ load: workoutExerciseLoadHistory.load, recordedAt: workoutExerciseLoadHistory.recordedAt }).from(workoutExerciseLoadHistory).where(and(eq(workoutExerciseLoadHistory.workoutExerciseId, workoutExerciseId), eq(workoutExerciseLoadHistory.userId, user.id))).orderBy(asc(workoutExerciseLoadHistory.recordedAt));
  return { ok: true, entries: entries.map((entry) => ({ load: Number(entry.load), recordedAt: entry.recordedAt.toISOString() })) };
}

export async function completeWorkout(workoutId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sua sessão expirou." };
  if (!/^[0-9a-f-]{36}$/i.test(workoutId)) return { ok: false, message: "Treino inválido." };
  try {
    const [workout] = await db.select({ id: workouts.id }).from(workouts).where(and(eq(workouts.id, workoutId), eq(workouts.createdBy, user.id))).limit(1);
    if (!workout) return { ok: false, message: "Treino não encontrado." };
    const completedOn = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
    await db.insert(workoutCompletions).values({ userId: user.id, workoutId, completedOn }).onConflictDoNothing();
    revalidatePath("/dashboard");
    return { ok: true, message: "Treino concluído!" };
  } catch {
    return { ok: false, message: "Não foi possível finalizar o treino. Tente novamente." };
  }
}
