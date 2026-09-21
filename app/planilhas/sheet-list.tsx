"use client";

import { useState } from "react";
import Link from "next/link";

type SheetItem = { id: string; name: string; description: string | null; workoutCount: number };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function SheetList({ sheets }: { sheets: SheetItem[] }) {
  const [query, setQuery] = useState("");
  const search = normalize(query.trim());
  const filtered = sheets.filter((sheet) => normalize(`${sheet.name} ${sheet.description ?? ""}`).includes(search));

  return <section aria-label="Lista de planilhas">
    <label htmlFor="sheet-search" className="sr-only">Buscar planilhas por nome ou descrição</label>
    <input id="sheet-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou descrição" className="mb-6 h-12 w-full max-w-lg rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" />
    {filtered.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((sheet) => <li key={sheet.id}><Link href={`/planilhas/${sheet.id}`} className="flex h-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><rect x="5" y="4" width="14" height="17" rx="2" /><path strokeLinecap="round" d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" /></svg></span><div className="min-w-0"><h2 className="font-semibold">{sheet.name} <span className="text-sm font-normal text-slate-400">({sheet.workoutCount} {sheet.workoutCount === 1 ? "Treino" : "Treinos"})</span></h2>{sheet.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{sheet.description}</p> : <p className="mt-2 text-sm text-slate-400">Sem descrição.</p>}</div></Link></li>)}</ul> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">{sheets.length ? "Nenhuma planilha encontrada para esta busca." : "Nenhuma planilha cadastrada ainda."}</div>}
  </section>;
}
