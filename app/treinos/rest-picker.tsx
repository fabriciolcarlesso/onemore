"use client";

import { useEffect, useRef, useState } from "react";
import type { RestUnit } from "./workout-group-editor";

const options = {
  seconds: [0, 10, 15, 20, 30, 40, 45, 50, 60, 75, 90, 120, 150, 180, 240, 300, 600, 900, 1800, 3600],
  minutes: [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 10, 15, 20, 30, 45, 60],
};

export function RestPicker({ seconds, unit, onChange }: { seconds: number | string | null | undefined; unit: RestUnit; onChange: (seconds: number | null, unit: RestUnit) => void }) {
  const [open, setOpen] = useState(false);
  const [draftUnit, setDraftUnit] = useState<RestUnit>(unit);
  const [draft, setDraft] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const current = seconds === "" || seconds == null ? null : Number(seconds);

  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    modal?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { modal?.close(); document.body.style.overflow = previous; };
  }, [open]);

  function openPicker() {
    setDraftUnit(unit);
    setDraft(current === null ? "" : String(unit === "minutes" ? current / 60 : current));
    setOpen(true);
  }

  function changeUnit(next: RestUnit) {
    if (draft !== "") {
      const valueInSeconds = Number(draft) * (draftUnit === "minutes" ? 60 : 1);
      setDraft(String(next === "minutes" ? valueInSeconds / 60 : valueInSeconds));
    }
    setDraftUnit(next);
  }

  function select(value: number) {
    onChange(Math.round(value * (draftUnit === "minutes" ? 60 : 1)), draftUnit);
    setOpen(false);
  }

  const numericDraft = Number(draft);
  const valid = draft !== "" && Number.isFinite(numericDraft) && numericDraft >= 0 && numericDraft <= (draftUnit === "minutes" ? 60 : 3600);

  return <><button type="button" onClick={openPicker} aria-label="Escolher intervalo" className="mt-1 flex h-10 w-full max-w-xs items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-left text-[13px] outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"><span>{current === null ? "--" : `${unit === "minutes" ? current / 60 : current} ${unit === "minutes" ? "min" : "s"}`}</span><span aria-hidden="true" className="text-slate-400">›</span></button><dialog ref={dialog} onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-white p-0 text-slate-950"><div className="flex h-full flex-col"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-xl font-semibold">Escolher intervalo</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-2xl">×</button></header><div className="flex gap-2 border-b border-slate-100 p-5">{(["seconds", "minutes"] as const).map((option) => <button key={option} type="button" onClick={() => changeUnit(option)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${draftUnit === option ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>{option === "seconds" ? "Segundos" : "Minutos"}</button>)}</div><div className="min-h-0 flex-1 overflow-y-auto p-5"><label className="block text-sm font-medium text-slate-600">Valor personalizado<input type="number" min="0" max={draftUnit === "minutes" ? 60 : 3600} step={draftUnit === "minutes" ? "any" : 1} value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-slate-950" placeholder="Digite o intervalo" /></label><button type="button" disabled={!valid} onClick={() => select(numericDraft)} className="mt-3 h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:opacity-50">Confirmar intervalo</button><p className="mt-7 mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Opções rápidas</p>{options[draftUnit].map((option) => <button type="button" key={option} onClick={() => select(option)} className={`mb-1 flex min-h-14 w-full items-center justify-between rounded-xl px-4 text-base ${current === option * (draftUnit === "minutes" ? 60 : 1) ? "bg-slate-950 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"}`}>{option} {draftUnit === "minutes" ? "min" : "s"}{current === option * (draftUnit === "minutes" ? 60 : 1) ? <span>✓</span> : null}</button>)}</div></div></dialog></>;
}
