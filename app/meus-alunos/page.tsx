import { CreateStudent } from "./create-student";
import { AssignWorkout } from "./assign-workout";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { studentWorkouts, teacherStudents, users, workouts } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";

export default async function MyStudentsPage() {
  const user = await requireUser();
  if (user.role !== "professor") redirect("/dashboard");
  const students = await db.select({ id: users.id, name: users.name, email: users.email }).from(teacherStudents).innerJoin(users, eq(teacherStudents.studentId, users.id)).where(and(eq(teacherStudents.teacherId, user.id), eq(users.role, "aluno"))).orderBy(users.name);
  const workoutList = await db.select({ id: workouts.id, name: workouts.name }).from(workouts).where(eq(workouts.createdBy, user.id)).orderBy(workouts.name);
  const assignments = await db.select().from(studentWorkouts).where(eq(studentWorkouts.teacherId, user.id));
  return <DashboardShell user={user} signOut={signOut} activePage="relationships"><RelationshipHeader title="Meus alunos" description="Alunos relacionados à sua conta." /><CreateStudent />{students.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{students.map((student) => <li key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{student.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><h2 className="mt-4 font-semibold">{student.name}</h2><p className="mt-1 text-sm text-slate-500">{student.email}</p><AssignWorkout studentId={student.id} studentName={student.name} workouts={workoutList} assignedIds={assignments.filter((entry) => entry.studentId === student.id).map((entry) => entry.sourceWorkoutId)} /></li>)}</ul> : <EmptyRelationship text="Nenhum aluno relacionado ainda." />}</DashboardShell>;
}

function RelationshipHeader({ title, description }: { title: string; description: string }) { return <div className="mb-8"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Relacionamentos</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>; }
function EmptyRelationship({ text }: { text: string }) { return <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">{text}</div>; }
