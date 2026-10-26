import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { workoutSheets } from "@/db/schema";
import { signOut } from "@/app/auth-actions";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { requireUser } from "@/lib/auth/session";
import { SheetForm } from "../../sheet-form";

export default async function EditWorkoutSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role === "aluno") redirect("/dashboard");

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [sheet] = await db.select({ id: workoutSheets.id, name: workoutSheets.name, description: workoutSheets.description }).from(workoutSheets).where(and(eq(workoutSheets.id, id), eq(workoutSheets.createdBy, user.id))).limit(1);
  if (!sheet) notFound();

  return <DashboardShell user={user} signOut={signOut} activePage="sheets"><div className="mx-auto max-w-2xl">

    <div className="mb-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Editar planilha</h1></div>
    <SheetForm sheet={sheet} />
  </div></DashboardShell>;
}
