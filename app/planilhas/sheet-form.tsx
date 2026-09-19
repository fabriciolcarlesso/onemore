"use client";

import { useActionState } from "react";
import { createWorkoutSheet, type SheetFormState } from "./actions";

const initialState: SheetFormState = { message: "" };

export function SheetForm() {
  const [state, action, pending] = useActionState(createWorkoutSheet, initialState);

  return <form action={action} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Etapa 1 de 2</p>
    <h2 className="mt-1 text-lg font-semibold">Criar planilha</h2>
    <p className="mt-1 text-sm text-slate-500">Informe os dados da planilha. Em seguida, você criará o primeiro treino.</p>
    <div className="mt-6 space-y-4">
      <input name="name" required minLength={2} maxLength={120} placeholder="Nome da planilha" className="h-12 w-full rounded-xl border border-slate-300 px-4 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" />
      <textarea name="description" maxLength={1000} rows={3} placeholder="Descrição (opcional)" className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" />
    </div>
    {state.message ? <p role="alert" className="mt-4 text-sm text-red-600">{state.message}</p> : null}
    <button disabled={pending} className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Salvando..." : "Continuar para criar treino"}</button>
  </form>;
}
