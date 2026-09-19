"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateWorkoutExerciseLoad } from "@/app/workout-actions";

const formatLoad = (value: number) => `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)} kg`;

export function LoadPicker({ workoutExerciseId, exerciseName, initialLoad }: { workoutExerciseId: string; exerciseName: string; initialLoad: string | null }) {
  const [load, setLoad] = useState(Number(initialLoad ?? 0));
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    modal?.showModal();
    selectedOption.current?.scrollIntoView({ block: "center" });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { modal?.close(); document.body.style.overflow = previous; };
  }, [open]);

  function choose(value: number) {
    if (lock.current) return;
    if (value === load) { setOpen(false); return; }
    lock.current = true;
    setError("");
    startTransition(async () => {
      try {
        const result = await updateWorkoutExerciseLoad(workoutExerciseId, value, "absolute");
        if (result.ok && result.currentLoad !== null) { setLoad(result.currentLoad); setOpen(false); }
        else setError(result.message);
      } catch { setError("Não foi possível salvar a carga. Tente novamente."); }
      finally { lock.current = false; }
    });
  }

  const normalized = query.trim().replace(",", ".");
  const value = Number(normalized);
  const validQuery = /^\d+(\.\d{1,2})?$/.test(normalized) && value >= 0 && value <= 999999.99;
  const options = normalized ? validQuery ? [value] : [] : [...new Set([...Array.from({ length: 301 }, (_, index) => index), load])].sort((a, b) => a - b);

  return <>
    <button type="button" aria-label={`Alterar carga de ${exerciseName}, ${formatLoad(load)}`} aria-haspopup="dialog" onClick={() => { setQuery(""); setError(""); setOpen(true); }} className="flex h-8 w-full items-center justify-center whitespace-nowrap rounded px-1 text-sm font-semibold tabular-nums text-slate-950 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-slate-950">{formatLoad(load)}</button>
    <dialog ref={dialog} aria-label={`Escolher carga de ${exerciseName}`} onCancel={(event) => { event.preventDefault(); if (!lock.current) setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-white p-0 text-slate-950">
      {open ? <div className="flex h-full flex-col">
        <header className="shrink-0 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Escolher carga</h2><p className="mt-1 text-sm text-slate-500">{exerciseName}</p></div><button type="button" disabled={pending} onClick={() => setOpen(false)} aria-label="Fechar seleção de carga" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl disabled:opacity-50">×</button></div><input type="text" inputMode="decimal" aria-label="Buscar ou digitar carga em kg" placeholder="Buscar ou digitar carga em kg" value={query} disabled={pending} onChange={(event) => setQuery(event.target.value)} className="mt-4 h-12 w-full rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-slate-950" />{error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}{pending ? <p role="status" className="mt-3 text-sm text-slate-500">Salvando carga...</p> : null}</header>
        <div aria-label="Cargas em quilogramas" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {options.map((option) => <button ref={option === load ? selectedOption : undefined} key={option} type="button" disabled={pending} aria-pressed={option === load} onClick={() => choose(option)} className={`mb-1 flex min-h-14 w-full items-center justify-between rounded-xl px-5 text-lg disabled:opacity-50 ${option === load ? "bg-slate-950 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"}`}><span>{formatLoad(option)}</span>{option === load ? <span aria-hidden="true">✓</span> : null}</button>)}
          {!options.length ? <p className="py-6 text-sm text-slate-500">Informe uma carga válida, com até duas casas decimais.</p> : null}
        </div>
      </div> : null}
    </dialog>
  </>;
}
