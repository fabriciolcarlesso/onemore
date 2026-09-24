import Link from "next/link";
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
    <nav aria-label="Breadcrumb" className="breadcrumb mb-5 text-xs text-slate-400"><ol className="breadcrumb-list"><li><Link href={`/planilhas/${sheet.id}`} className="font-medium text-slate-500 transition hover:text-slate-700">← Voltar</Link></li><li aria-hidden="true">|</li><li><Link href="/planilhas" className="transition hover:text-slate-600">Planilhas</Link></li><li aria-hidden="true">›</li><li><Link href={`/planilhas/${sheet.id}`} className="transition hover:text-slate-600">{sheet.name}</Link></li><li aria-hidden="true">›</li><li aria-current="page" className="text-slate-400">Editar</li></ol></nav>
    <div className="mb-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" /><p className="text-sm font-medium text-slate-400">Planilhas</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Editar planilha</h1></div>
    <SheetForm sheet={sheet} />
  </div></DashboardShell>;
}
