"use client";

import { useEffect, useState } from "react";
import { ExerciseForm } from "./exercise-form";

export function ExerciseModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
        <span className="mr-1.5 inline-flex items-center justify-center text-lg leading-none">+</span>Novo exercício
      </button>
      {open ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="new-exercise-title">
        <button type="button" aria-label="Fechar modal" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" />
        <div className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto">
          <div className="relative">
            <button type="button" aria-label="Fechar modal" onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
            <div id="new-exercise-title"><ExerciseForm onSuccess={() => setOpen(false)} /></div>
          </div>
        </div>
      </div> : null}
    </>
  );
}
