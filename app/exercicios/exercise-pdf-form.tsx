"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadExercisePdf, type ExerciseFormState } from "@/app/exercises-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: ExerciseFormState = { message: "" };
const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";

export function ExercisePdfForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(uploadExercisePdf, initialState);

  useEffect(() => {
    if (!state.message.includes("sucesso")) return;
    formRef.current?.reset();
    router.refresh();
  }, [router, state.message]);

  return (
    <form ref={formRef} action={formAction} className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-semibold">Importar exercício por PDF</h2>
          <p className="mt-1 text-sm text-slate-500">Salve o PDF original para completar os dados do exercício depois.</p>
        </div>
        <span className="text-xs text-slate-400">PDF até 15 MB</span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="pdf-exercise-name" className="mb-2 block text-sm font-medium text-slate-700">Nome do exercício <span className="font-normal text-slate-400">(opcional)</span></label>
          <input id="pdf-exercise-name" name="name" maxLength={120} placeholder="Usar o nome do arquivo se vazio" className={inputClassName} />
        </div>
        <div>
          <label htmlFor="exercise-pdf" className="mb-2 block text-sm font-medium text-slate-700">Arquivo PDF</label>
          <input id="exercise-pdf" name="pdf" type="file" accept="application/pdf,.pdf" required className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700`} />
        </div>
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : "Enviar PDF"}</button>
      </div>
      <FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} />
    </form>
  );
}
