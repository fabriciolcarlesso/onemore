"use client";

import { useEffect, useRef, useState } from "react";

export function SelectMenu({ value, options, onChange, className = "", compact = false }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (compact) return;
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [compact]);

  useEffect(() => {
    if (!compact || !open) return;
    const modal = dialog.current;
    modal?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { modal?.close(); document.body.style.overflow = previous; };
  }, [compact, open]);

  return <div ref={ref} className={`relative min-w-0 ${className}`}>
    <button type="button" aria-label="Selecionar exercício" aria-haspopup={compact ? "dialog" : "listbox"} aria-expanded={open} onClick={() => setOpen((current) => !current)} className={`flex w-full cursor-pointer items-center justify-between text-left outline-none transition focus-visible:ring-2 focus-visible:ring-slate-950/20 ${compact ? "h-9 gap-1 bg-transparent text-[13px]" : "h-12 rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-slate-950"}`}>
      <span className={`min-w-0 truncate ${selected ? "text-slate-950" : "text-slate-400"}`}>{selected?.label ?? "Selecione"}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={`${compact ? "size-4" : "size-5"} shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg>
    </button>
    {compact ? <dialog ref={dialog} aria-label="Selecionar exercício" onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-white p-0 text-slate-950">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-xl font-semibold">Selecionar exercício</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-2xl">×</button></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{options.map((option) => <button type="button" key={option.value} onClick={() => { onChange(option.value); setOpen(false); }} className={`mb-1 flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-4 text-left text-sm ${option.value === value ? "bg-slate-950 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"}`}><span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{option.label}</span>{option.value === value ? <span aria-hidden="true">✓</span> : null}</button>)}</div>
      </div>
    </dialog> : open ? <ul role="listbox" className="absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-950/10">{options.map((option) => <li key={option.value}><button type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); }} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${option.value === value ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{option.label}</button></li>)}</ul> : null}
  </div>;
}
