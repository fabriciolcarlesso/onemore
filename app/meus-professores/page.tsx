import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { teacherStudents, users } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";

export default async function MyTeachersPage() {
  const user = await requireUser();
  if (user.role !== "aluno") redirect("/dashboard");
  const teachers = await db.select({ id: users.id, name: users.name, email: users.email }).from(teacherStudents).innerJoin(users, eq(teacherStudents.teacherId, users.id)).where(and(eq(teacherStudents.studentId, user.id), eq(users.role, "professor"))).orderBy(users.name);
  return <DashboardShell user={user} signOut={signOut} activePage="relationships"><div className="mb-8"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Relacionamentos</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Meus professores</h1><p className="mt-2 text-sm text-slate-500">Professores relacionados à sua conta.</p></div>{teachers.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{teachers.map((teacher) => <li key={teacher.id} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{teacher.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><h2 className="mt-4 font-semibold">{teacher.name}</h2><p className="mt-1 text-sm text-slate-500">{teacher.email}</p></li>)}</ul> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">Nenhum professor relacionado ainda.</div>}</DashboardShell>;
}
