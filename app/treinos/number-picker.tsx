"use client";

import { useEffect, useRef, useState } from "react";

export function NumberPicker({ value, label, onChange }: { value: number | string; label: string; onChange: (value: number) => void }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = Number(value) || 0;
  useEffect(() => {
    if (!open) return;
    const modal = dialog.current;
    modal?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { modal?.close(); document.body.style.overflow = previous; };
  }, [open]);
  return <><button type="button" onClick={() => setOpen(true)} className="mt-1 h-12 w-full rounded-xl border border-slate-300 bg-white px-2 text-center text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10">{selected || "--"}</button><dialog ref={dialog} onCancel={(event) => { event.preventDefault(); setOpen(false); }} className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-white p-0 text-slate-950"><div className="flex h-full flex-col"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="text-xl font-semibold">Escolher {label.toLowerCase()}</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-2xl">×</button></header><div className="min-h-0 flex-1 overflow-y-auto p-5">{Array.from({ length: 100 }, (_, index) => index + 1).map((option) => <button type="button" key={option} onClick={() => { onChange(option); setOpen(false); }} className={`mb-1 flex min-h-14 w-full items-center justify-between rounded-xl px-5 text-lg ${option === selected ? "bg-slate-950 font-semibold text-white" : "text-slate-700 hover:bg-slate-100"}`}>{option}{option === selected ? <span>✓</span> : null}</button>)}</div></div></dialog></>;
}
