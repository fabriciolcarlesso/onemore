"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createExercise, type ExerciseFormState } from "@/app/exercises-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: ExerciseFormState = { message: "" };
const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";

export function ExerciseForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createExercise, initialState);
  const [fields, setFields] = useState({ name: "", description: "" });

  useEffect(() => {
    if (!state.message.includes("sucesso")) return;
    onSuccess?.();
    const refreshTimer = window.setTimeout(() => router.refresh(), 0);
    return () => window.clearTimeout(refreshTimer);
  }, [onSuccess, router, state.message]);

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8" autoComplete="off" noValidate>
      <div>
        <h2 className="text-lg font-semibold">Novo exercício</h2>
        <p className="mt-1 text-sm text-slate-500">Cadastre um exercício para usar nos treinos.</p>
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="exercise-name" className="mb-2 block text-sm font-medium text-slate-700">Nome</label>
          <input id="exercise-name" name="name" type="text" placeholder="Ex.: Supino reto" value={fields.name} onChange={(event) => setFields((current) => ({ ...current, name: event.target.value }))} className={inputClassName} />
        </div>
        <div>
          <label htmlFor="exercise-description" className="mb-2 block text-sm font-medium text-slate-700">Descrição <span className="font-normal text-slate-400">(opcional)</span></label>
          <textarea id="exercise-description" name="description" rows={4} placeholder="Inclua instruções ou observações" value={fields.description} onChange={(event) => setFields((current) => ({ ...current, description: event.target.value }))} className={`${inputClassName} resize-y`} />
        </div>
      </div>
      <FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} />
      <button type="submit" disabled={pending} className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : "Cadastrar exercício"}</button>
    </form>
  );
}
