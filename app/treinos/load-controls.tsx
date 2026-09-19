"use client";

import { useRef, useState, useTransition } from "react";
import { getWorkoutExerciseLoadHistory, updateWorkoutExerciseLoad } from "@/app/workout-actions";

type HistoryEntry = { load: number; recordedAt: string };

export function LoadStepper({ workoutExerciseId, initialLoad, onLoadChange, compact = false }: { workoutExerciseId: string; initialLoad: string | null; onLoadChange?: (load: number) => void; compact?: boolean }) {
  const [load, setLoad] = useState(Number(initialLoad ?? 0));
  const [draft, setDraft] = useState(String(Number(initialLoad ?? 0)));
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const saving = useRef(false);

  function saveLoad(delta?: number) {
    if (saving.current) return;
    const normalized = draft.trim().replace(",", ".");
    const parsed = Number(normalized);
    if (!normalized || !/^\d+(\.\d{1,2})?$/.test(normalized) || !Number.isFinite(parsed) || parsed < 0 || parsed > 999999.99) {
      setError("Informe uma carga válida, com até duas casas decimais.");
      return;
    }
    const next = Math.max(0, Math.round((parsed + (delta ?? 0)) * 100) / 100);
    if (next > 999999.99) { setError("Carga acima do limite permitido."); return; }
    setError("");
    if (next === load) { setDraft(String(load)); return; }
    saving.current = true;
    startTransition(async () => {
      try {
        const result = await updateWorkoutExerciseLoad(workoutExerciseId, delta !== undefined && parsed === load ? delta : next, delta !== undefined && parsed === load ? "delta" : "absolute");
        if (result.ok && result.currentLoad !== null) {
          setLoad(result.currentLoad);
          onLoadChange?.(result.currentLoad);
          setDraft(String(result.currentLoad));
        } else setError(result.message);
      } catch {
        setError("Não foi possível salvar a carga. Tente novamente.");
      } finally {
        saving.current = false;
      }
    });
  }
  return <div className="inline-flex flex-col items-end gap-1"><div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50"><button type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => saveLoad(-1)} disabled={pending} aria-label="Diminuir carga em 1 kg" className={`flex ${compact ? "h-8 w-6" : "size-8"} cursor-pointer items-center justify-center text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40`}>−</button><input type="text" inputMode="decimal" aria-label="Carga em quilogramas" aria-invalid={!!error} aria-describedby={error ? `load-error-${workoutExerciseId}` : undefined} title="Digite a carga e pressione Enter ou saia do campo para salvar" value={draft} disabled={pending} onChange={(event) => { setDraft(event.target.value); setError(""); }} onBlur={() => saveLoad()} onKeyDown={(event) => {
    if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
    if (event.key === "Escape") { setDraft(String(load)); setError(""); }
  }} className={`h-8 ${compact ? "w-10" : "w-16"} rounded border-0 bg-transparent px-1 text-center text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-400 disabled:opacity-60`} /><span className="pr-1 text-xs text-slate-500">kg</span><button type="button" onPointerDown={(event) => event.preventDefault()} onClick={() => saveLoad(1)} disabled={pending} aria-label="Aumentar carga em 1 kg" className={`flex ${compact ? "h-8 w-6" : "size-8"} cursor-pointer items-center justify-center text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40`}>+</button></div>{error ? <p id={`load-error-${workoutExerciseId}`} role="alert" className="max-w-48 text-xs text-red-600">{error}</p> : null}</div>;
}

export function LoadHistoryButton({ workoutExerciseId, exerciseName }: { workoutExerciseId: string; exerciseName: string }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  function showHistory() {
    setOpen(true);
    startTransition(async () => {
      const result = await getWorkoutExerciseLoadHistory(workoutExerciseId);
      if (result.ok) setHistory(result.entries);
    });
  }
  return <><button type="button" onClick={showHistory} className="cursor-pointer text-left font-medium hover:text-slate-600 hover:underline">{exerciseName}</button>{open ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="load-history-title"><button type="button" aria-label="Fechar histórico" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" /><div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-400">Histórico de carga</p><h2 id="load-history-title" className="mt-1 text-xl font-semibold">{exerciseName}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar histórico" className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">×</button></div>{pending && !history.length ? <p className="mt-6 text-sm text-slate-400">Carregando histórico...</p> : history.length ? <div className="mt-6 max-h-72 overflow-y-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="pb-3">Data</th><th className="pb-3 text-right">Carga</th></tr></thead><tbody className="divide-y divide-slate-100">{history.map((entry, index) => <tr key={`${entry.recordedAt}-${index}`}><td className="py-3 text-slate-600">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(entry.recordedAt))}</td><td className="py-3 text-right font-semibold">{entry.load.toFixed(1)} kg</td></tr>)}</tbody></table></div> : <p className="mt-6 text-sm text-slate-400">Nenhum histórico de carga registrado.</p>}</div></div> : null}</>;
}
