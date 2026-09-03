"use client";

import { useEffect, useRef, useState } from "react";

export function SelectMenu({ value, options, onChange, className = "" }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return <div ref={ref} className={`relative ${className}`}><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-left text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"><span className={selected ? "text-slate-950" : "text-slate-400"}>{selected?.label ?? "Selecione"}</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={`size-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg></button>{open ? <ul role="listbox" className="absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-950/10">{options.map((option) => <li key={option.value}><button type="button" role="option" aria-selected={option.value === value} onClick={() => { onChange(option.value); setOpen(false); }} className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${option.value === value ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}>{option.label}</button></li>)}</ul> : null}</div>;
}
