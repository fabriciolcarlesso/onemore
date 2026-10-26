"use client";

import { useState } from "react";
import { deleteMuscleGroup, updateMuscleGroup } from "./actions";
import { useEscape } from "@/app/ui/use-escape";

export function GroupActions({ group }: { group: { id: string; name: string; description: string } }) {
  const [editing, setEditing] = useState(false);
  useEscape(() => setEditing(false), editing);
  return <div className="flex items-center justify-end gap-1">
    <button type="button" onClick={() => setEditing(true)} aria-label={`Editar ${group.name}`} title="Editar" className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-950">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 3.487 3.65 3.65M4 20l4.05-.82L19.6 7.63a2.58 2.58 0 0 0-3.65-3.65L4.4 15.93 4 20Z" /></svg>
    </button>
    <form action={deleteMuscleGroup} onSubmit={(event) => { if (!window.confirm(`Excluir o grupo muscular ${group.name}?`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={group.id} />
      <button type="submit" aria-label={`Excluir ${group.name}`} title="Excluir" className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6m4-6v6M9 7V4h6v3m-9 0 1 13h8l1-13" /></svg>
      </button>
    </form>
    {editing ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Editar grupo muscular"><button type="button" aria-label="Fechar" onClick={() => setEditing(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" /><form action={async (formData) => { await updateMuscleGroup(formData); setEditing(false); }} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><input type="hidden" name="id" value={group.id} /><h2 className="text-lg font-semibold text-slate-950">Editar grupo muscular</h2><label className="mt-5 block text-sm font-medium text-slate-700">Nome<input name="name" defaultValue={group.name} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" /></label><label className="mt-4 block text-sm font-medium text-slate-700">Descrição<textarea name="description" defaultValue={group.description} rows={4} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancelar</button><button type="submit" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Salvar</button></div></form></div> : null}
  </div>;
}
