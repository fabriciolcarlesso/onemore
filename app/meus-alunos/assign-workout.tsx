"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignWorkout } from "./actions";

export function AssignWorkout({ studentId, studentName, workouts, assignedIds }: { studentId: string; studentName: string; workouts: { id: string; name: string }[]; assignedIds: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const available = workouts.filter((workout) => !assignedIds.includes(workout.id));
  function save() {
    if (!selected || lock.current) return;
    lock.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await assignWorkout(studentId, selected);
        setMessage(result.message);
        if (result.ok) { setSelected(""); dialog.current?.close(); router.refresh(); }
      } catch { setMessage("Não foi possível vincular o treino. Tente novamente."); }
      finally { lock.current = false; }
    });
  }
  return <div className="mt-5">
    {assignedIds.length ? <p className="mb-3 text-xs text-slate-500">{assignedIds.length} {assignedIds.length === 1 ? "treino vinculado" : "treinos vinculados"}</p> : null}
    <button type="button" onClick={() => { setMessage(""); dialog.current?.showModal(); }} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Vincular treino</button>
    <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>
    <dialog ref={dialog} aria-labelledby={`assign-title-${studentId}`} onCancel={(event) => { if (lock.current) event.preventDefault(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-6 text-slate-950 shadow-xl backdrop:bg-slate-950/40">
      <h2 id={`assign-title-${studentId}`} className="text-xl font-semibold">Vincular treino</h2><p className="mt-2 text-sm text-slate-500">Escolha um treino para {studentName}.</p>
      {available.length ? <><label htmlFor={`workout-${studentId}`} className="mt-6 mb-2 block text-sm font-medium">Treino</label><select id={`workout-${studentId}`} value={selected} disabled={pending} onChange={(event) => setSelected(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 px-3"><option value="">Selecione um treino</option>{available.map((workout) => <option key={workout.id} value={workout.id}>{workout.name}</option>)}</select></> : <p className="mt-6 text-sm text-slate-500">{workouts.length ? "Todos os seus treinos já estão vinculados a este aluno." : <>Você ainda não cadastrou treinos. <Link href="/treinos/novo" className="font-semibold underline">Criar treino</Link></>}</p>}
      {message ? <p role="alert" className="mt-3 text-sm text-slate-600">{message}</p> : null}
      <div className="mt-6 flex gap-3"><button type="button" disabled={pending} onClick={() => dialog.current?.close()} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Cancelar</button><button type="button" disabled={pending || !selected} onClick={save} className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Vinculando..." : "Vincular"}</button></div>
    </dialog>
  </div>;
}
