"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignWorkout } from "./actions";

export function AssignWorkout({ studentId, studentName, sheets, assignedSheetIds }: { studentId: string; studentName: string; sheets: { id: string; name: string; workoutIds: string[] }[]; assignedSheetIds: string[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const available = sheets.filter((sheet) => !assignedSheetIds.includes(sheet.id));
  function save() {
    if (!selected || lock.current) return;
    lock.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        const sheet = available.find((entry) => entry.id === selected);
        if (!sheet?.workoutIds.length) { setMessage("Esta planilha ainda não tem treinos."); return; }
        for (const workoutId of sheet.workoutIds) {
          const result = await assignWorkout(studentId, workoutId);
          if (!result.ok) { setMessage(result.message); return; }
        }
        setMessage("Planilha vinculada com sucesso.");
        setSelected(""); dialog.current?.close(); router.refresh();
      } catch { setMessage("Não foi possível vincular o treino. Tente novamente."); }
      finally { lock.current = false; }
    });
  }
  return <div className="mt-5">
    {assignedSheetIds.length ? <p className="mb-3 text-xs text-slate-500">{assignedSheetIds.length} {assignedSheetIds.length === 1 ? "planilha vinculada" : "planilhas vinculadas"}</p> : null}
    <button type="button" onClick={() => { setMessage(""); dialog.current?.showModal(); }} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Vincular planilha</button>
    <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>
    <dialog ref={dialog} aria-labelledby={`assign-title-${studentId}`} onCancel={(event) => { if (lock.current) event.preventDefault(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-6 text-slate-950 shadow-xl backdrop:bg-slate-950/40">
      <h2 id={`assign-title-${studentId}`} className="text-xl font-semibold">Vincular planilha</h2><p className="mt-2 text-sm text-slate-500">Escolha uma planilha para {studentName}.</p>
      {available.length ? <><label htmlFor={`sheet-${studentId}`} className="mt-6 mb-2 block text-sm font-medium">Planilha</label><select id={`sheet-${studentId}`} value={selected} disabled={pending} onChange={(event) => setSelected(event.target.value)} className="h-12 w-full rounded-xl border border-slate-300 px-3"><option value="">Selecione uma planilha</option>{available.map((sheet) => <option key={sheet.id} value={sheet.id}>{sheet.name}</option>)}</select></> : <p className="mt-6 text-sm text-slate-500">{sheets.length ? "Todas as suas planilhas já estão vinculadas a este aluno." : <>Você ainda não cadastrou planilhas. <Link href="/planilhas/nova" className="font-semibold underline">Criar planilha</Link></>}</p>}
      {message ? <p role="alert" className="mt-3 text-sm text-slate-600">{message}</p> : null}
      <div className="mt-6 flex gap-3"><button type="button" disabled={pending} onClick={() => dialog.current?.close()} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Cancelar</button><button type="button" disabled={pending || !selected} onClick={save} className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Vinculando..." : "Vincular"}</button></div>
    </dialog>
  </div>;
}
