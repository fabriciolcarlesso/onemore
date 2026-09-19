"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignWorkout } from "@/app/meus-alunos/actions";

export function AssignStudent({ workoutId, workoutName, students, assignedIds }: { workoutId: string; workoutName: string; students: { id: string; name: string; email: string }[]; assignedIds: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const available = students.filter((student) => !assignedIds.includes(student.id));
  function save() {
    if (!selected || lock.current) return;
    lock.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await assignWorkout(selected, workoutId);
        setMessage(result.message);
        if (result.ok) { setSelected(""); dialog.current?.close(); router.refresh(); }
      } catch { setMessage("Não foi possível vincular o treino. Tente novamente."); }
      finally { lock.current = false; }
    });
  }
  return <div className="col-span-full">
    <button type="button" onClick={() => { setMessage(""); dialog.current?.showModal(); }} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Vincular a aluno</button>
    <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>
    <dialog ref={dialog} aria-labelledby={`assign-title-${workoutId}`} onCancel={(event) => { if (lock.current) event.preventDefault(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-6 text-slate-950 shadow-xl backdrop:bg-slate-950/40">
      <h2 id={`assign-title-${workoutId}`} className="text-xl font-semibold">Vincular treino</h2><p className="mt-2 text-sm text-slate-500">Escolha o aluno que receberá o treino {workoutName}.</p>
      {available.length ? <><label htmlFor={`workout-${workoutId}`} className="mt-6 mb-2 block text-sm font-medium">Aluno</label><select id={`workout-${workoutId}`} value={selected} disabled={pending} onChange={(event) => setSelected(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 px-3"><option value="">Selecione um aluno</option>{available.map((student) => <option key={student.id} value={student.id}>{student.name} — {student.email}</option>)}</select></> : <p className="mt-6 text-sm text-slate-500">{students.length ? "Este treino já está vinculado a todos os seus alunos." : <>Você ainda não tem alunos vinculados. <Link href="/meus-alunos" className="font-semibold underline">Ver meus alunos</Link></>}</p>}
      {message ? <p role="alert" className="mt-3 text-sm text-slate-600">{message}</p> : null}
      <div className="mt-6 flex gap-3"><button type="button" disabled={pending} onClick={() => dialog.current?.close()} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Cancelar</button><button type="button" disabled={pending || !selected} onClick={save} className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Vinculando..." : "Vincular"}</button></div>
    </dialog>
  </div>;
}
