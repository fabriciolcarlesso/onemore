"use server";

import { randomInt, randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { studentPlans, studentWorkouts, teacherStudents, users, workoutExercises, workoutGroups, workouts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/crypto";

export type CreateStudentState = { message: string; pin?: string; email?: string };

export async function createStudent(_previous: CreateStudentState, formData: FormData): Promise<CreateStudentState> {
  const teacher = await getCurrentUser();
  if (!teacher || teacher.role !== "professor") return { message: "Apenas professores podem cadastrar alunos." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome entre 2 e 120 caracteres." };
  if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { message: "Informe um e-mail válido." };
  try {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) return { message: "Já existe uma conta com esse e-mail. Nenhuma senha foi alterada." };
    const id = randomUUID();
    const pin = String(randomInt(0, 1000000)).padStart(6, "0");
    const passwordHash = await hashPassword(pin);
    await db.batch([
      db.insert(users).values({ id, name, email, role: "aluno", passwordHash, mustChangePassword: true }),
      db.insert(teacherStudents).values({ teacherId: teacher.id, studentId: id }),
      db.insert(studentPlans).values({ studentId: id, planId: "free", freeExpiresAt: new Date(Date.now() + 15 * 86400000) }),
    ]);
    revalidatePath("/meus-alunos");
    revalidatePath("/treinos");
    return { message: "Aluno cadastrado e vinculado com sucesso.", pin, email };
  } catch { return { message: "Não foi possível cadastrar o aluno. Verifique o e-mail e tente novamente." }; }
}

export async function assignWorkout(studentId: string, sourceWorkoutId: string) {
  const teacher = await getCurrentUser();
  if (!teacher || teacher.role !== "professor") return { ok: false, message: "Apenas professores podem vincular treinos." };
  if (![studentId, sourceWorkoutId].every((id) => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))) return { ok: false, message: "Selecione um aluno e um treino válidos." };
  try {
    const [student] = await db.select({ id: users.id }).from(teacherStudents).innerJoin(users, eq(users.id, teacherStudents.studentId)).where(and(eq(teacherStudents.teacherId, teacher.id), eq(users.id, studentId), eq(users.role, "aluno"))).limit(1);
    if (!student) return { ok: false, message: "Este aluno não está vinculado a você." };
    const [source] = await db.select().from(workouts).where(and(eq(workouts.id, sourceWorkoutId), eq(workouts.createdBy, teacher.id))).limit(1);
    if (!source) return { ok: false, message: "Treino não encontrado." };
    const [existing] = await db.select().from(studentWorkouts).where(and(eq(studentWorkouts.studentId, studentId), eq(studentWorkouts.sourceWorkoutId, sourceWorkoutId))).limit(1);
    if (existing) return { ok: true, message: "Este treino já está vinculado ao aluno." };
    const groups = await db.select().from(workoutGroups).where(eq(workoutGroups.workoutId, source.id)).orderBy(asc(workoutGroups.orderIndex));
    if (!groups.length) return { ok: false, message: "Adicione exercícios antes de vincular o treino." };
    const items = await db.select().from(workoutExercises).where(inArray(workoutExercises.groupId, groups.map((group) => group.id)));
    const workoutId = randomUUID();
    // Each student gets their own exercise rows so loads and history remain independent.
    const queries: [BatchItem<"pg">, ...BatchItem<"pg">[]] = [db.insert(workouts).values({ id: workoutId, name: source.name, description: source.description, weekdays: source.weekdays, createdBy: studentId })];
    for (const group of groups) {
      const groupId = randomUUID();
      queries.push(db.insert(workoutGroups).values({ id: groupId, workoutId, type: group.type, restSeconds: group.restSeconds, notes: group.notes, orderIndex: group.orderIndex }));
      const exercises = items.filter((item) => item.groupId === group.id);
      if (exercises.length) queries.push(db.insert(workoutExercises).values(exercises.map((item) => ({ groupId, exerciseId: item.exerciseId, sets: item.sets, repetitions: item.repetitions, load: item.load, orderIndex: item.orderIndex }))));
    }
    queries.push(db.insert(studentWorkouts).values({ studentId, teacherId: teacher.id, sourceWorkoutId, workoutId }));
    await db.batch(queries);
    revalidatePath("/meus-alunos");
    revalidatePath("/treinos", "layout");
    revalidatePath("/dashboard");
    return { ok: true, message: "Treino vinculado com sucesso." };
  } catch { return { ok: false, message: "Não foi possível vincular o treino. Atualize a página e tente novamente." }; }
}
