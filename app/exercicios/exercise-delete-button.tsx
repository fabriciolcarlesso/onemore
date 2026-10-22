"use client";

import { useState } from "react";
import { deleteExercise } from "@/app/exercises-actions";

export function ExerciseDeleteButton({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" aria-label={`Excluir exercício ${exerciseName}`} onClick={(event) => { event.stopPropagation(); setOpen(true); }} className="flex size-8 items-center justify-center rounded-full bg-red-800 text-xl font-light leading-none text-white shadow-md transition hover:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800">×</button>
      {open ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={`delete-exercise-title-${exerciseId}`}>
        <button type="button" aria-label="Fechar confirmação" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 id={`delete-exercise-title-${exerciseId}`} className="text-lg font-semibold">Excluir exercício?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">“{exerciseName}” e seus vínculos com treinos serão excluídos permanentemente.</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <form action={deleteExercise}><input type="hidden" name="exerciseId" value={exerciseId} /><button type="submit" className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900">Excluir</button></form>
          </div>
        </div>
      </div> : null}
    </>
  );
}
