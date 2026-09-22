"use client";

import { useActionState } from "react";
import { createWorkoutSheet, type SheetFormState } from "./actions";

const initialState: SheetFormState = { message: "" };

export function SheetForm() {
  const [state, action, pending] = useActionState(createWorkoutSheet, initialState);

  return <form action={action}>
    <div className="space-y-4">
      <input name="name" required minLength={2} maxLength={120} placeholder="Nome da planilha" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" />
      <textarea name="description" maxLength={1000} rows={5} placeholder="Descrição (opcional)" className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" />
    </div>
    {state.message ? <p role="alert" className="mt-4 text-sm text-red-600">{state.message}</p> : null}
    <button disabled={pending} className="mt-6 ml-auto block w-fit rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Criando..." : "Criar treino"}</button>
  </form>;
}
