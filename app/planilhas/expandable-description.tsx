"use client";

import { useState } from "react";
import { RichDescription } from "@/app/exercicios/rich-description";

export function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return <div className="mt-2">
    <div className={`relative overflow-hidden transition-[max-height] duration-700 ease-in-out ${expanded ? "max-h-[40rem]" : "max-h-18"}`}>
      <RichDescription text={text} className="text-sm leading-6 text-slate-500" />
      {!expanded ? <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-slate-50 to-transparent" /> : null}
    </div>
    <button type="button" aria-label={expanded ? "Recolher descrição da planilha" : "Expandir descrição da planilha"} title={expanded ? "Recolher" : "Expandir"} onClick={() => setExpanded((current) => !current)} className="mt-3 flex h-5 w-full items-center justify-center transition"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`size-6 rounded-full bg-slate-950 p-1 text-white transition-transform duration-700 ${expanded ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg></button>
  </div>;
}
