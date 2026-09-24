"use client";

import { useActionState, useRef, useState } from "react";
import { createWorkoutSheet, updateWorkoutSheet, type SheetFormState } from "./actions";

const initialState: SheetFormState = { message: "" };

export function SheetForm({ sheet }: { sheet?: { id: string; name: string; description: string | null } }) {
  const [state, action, pending] = useActionState(sheet ? updateWorkoutSheet : createWorkoutSheet, initialState);
  const [name, setName] = useState(sheet?.name ?? "");
  const [description, setDescription] = useState(sheet?.description ?? "");
  const descriptionInput = useRef<HTMLTextAreaElement>(null);

  function addBold() {
    const input = descriptionInput.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = description.slice(start, end);
    const replacement = selected ? `**${selected}**` : "****";
    const next = `${description.slice(0, start)}${replacement}${description.slice(end)}`;
    const selection = selected ? [start + 2, start + 2 + selected.length] : [start + 2, start + 2];
    setDescription(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(selection[0], selection[1]);
    });
  }

  return <form action={action}>
    {sheet ? <input type="hidden" name="sheetId" value={sheet.id} /> : null}
    <div className="space-y-4">
      <input name="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} placeholder="Nome da planilha" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" />
      <div className="rounded-lg border border-slate-300 bg-white focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10">
        <div className="flex items-center px-3 pb-0 pt-3">
          <button type="button" aria-label="Aplicar negrito ao texto selecionado" title="Negrito" onPointerDown={(event) => event.preventDefault()} onMouseDown={(event) => event.preventDefault()} onClick={addBold} className="-ml-[10px] -mt-1 flex size-8 items-center justify-center rounded-md text-base font-bold text-slate-400 underline decoration-1 underline-offset-2 transition hover:bg-slate-100 hover:text-slate-700">B</button>
        </div>
        <textarea ref={descriptionInput} name="description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={5} placeholder="Descrição (opcional)" className="block w-full resize-y rounded-lg border-0 bg-transparent px-3 pb-3 pt-2 text-sm outline-none focus:ring-0" />
      </div>
    </div>
    {state.message ? <p role="alert" className="mt-4 text-sm text-red-600">{state.message}</p> : null}
    <button disabled={pending} className="mt-6 ml-auto block w-fit rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{sheet ? pending ? "Salvando..." : "Salvar planilha" : pending ? "Criando..." : "Criar treino"}</button>
  </form>;
}
