"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { deleteWorkoutSheet } from "./actions";

type SheetItem = { id: string; name: string; description: string | null; workoutCount: number };

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function SheetList({ sheets }: { sheets: SheetItem[] }) {
  const [query, setQuery] = useState("");
  const [openSheetId, setOpenSheetId] = useState<string | null>(null);
  const search = normalize(query.trim());
  const filtered = sheets.filter((sheet) => normalize(`${sheet.name} ${sheet.description ?? ""}`).includes(search));

  return <section aria-label="Lista de planilhas">
    <label htmlFor="sheet-search" className="sr-only">Buscar planilhas por nome ou descrição</label>
    <input id="sheet-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome ou descrição" className="mb-4 h-10 w-full max-w-lg rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" />
    {filtered.length ? <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((sheet) => <SwipeableSheetCard key={sheet.id} sheet={sheet} open={openSheetId === sheet.id} onOpenChange={(open) => setOpenSheetId(open ? sheet.id : null)} />)}</ul> : <div className="rounded-xl border border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-400">{sheets.length ? "Nenhuma planilha encontrada para esta busca." : "Nenhuma planilha cadastrada ainda."}</div>}
  </section>;
}

function SwipeableSheetCard({ sheet, open, onOpenChange }: { sheet: SheetItem; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offset = dragging ? dragOffset : open ? -56 : 0;
  const pointerStart = useRef<{ x: number; y: number; offset: number; axis: "x" | "y" | null } | null>(null);
  const suppressClick = useRef(false);

  function onPointerDown(event: React.PointerEvent<HTMLLIElement>) {
    if (event.button !== 0) return;
    pointerStart.current = { x: event.clientX, y: event.clientY, offset, axis: null };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLLIElement>) {
    const start = pointerStart.current;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (!start.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 6) {
      start.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
      if (start.axis === "x") {
        setDragging(true);
        onOpenChange(true);
      }
    }
    if (start.axis === "x") {
      suppressClick.current = Math.abs(deltaX) > 8;
      setDragOffset(Math.max(-56, Math.min(0, start.offset + deltaX)));
    }
  }

  function onPointerUp() {
    const start = pointerStart.current;
    if (!start) return;
    if (start.axis === "x") {
      const shouldOpen = dragOffset <= -28;
      onOpenChange(shouldOpen);
    }
    pointerStart.current = null;
    setDragging(false);
  }

  return <li className="relative overflow-hidden rounded-xl" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <div inert={offset === 0} aria-hidden={offset === 0} className="absolute inset-y-0 right-0 flex w-14 items-stretch justify-center rounded-r-xl border border-slate-300 border-l-0 bg-red-800">
      <form action={deleteWorkoutSheet} className="flex w-full rounded-r-xl"><input type="hidden" name="sheetId" value={sheet.id} /><button type="submit" tabIndex={offset === 0 ? -1 : 0} aria-label={`Excluir planilha ${sheet.name}`} className="w-full rounded-r-xl text-2xl font-light leading-none text-white transition hover:bg-red-900">×</button></form>
    </div>
    <Link href={`/planilhas/${sheet.id}`} onClick={(event) => { if (suppressClick.current) { event.preventDefault(); suppressClick.current = false; } }} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); onOpenChange(true); } else if (event.key === "ArrowRight") onOpenChange(false); }} className={`relative flex h-full min-h-20 items-start gap-3 rounded-l-xl border border-slate-300 bg-white p-4 hover:border-slate-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 touch-pan-y ${offset === 0 ? "rounded-r-xl border-r" : "rounded-r-none border-r-0"} ${dragging ? "transition-none" : "transition-all duration-200"}`} style={{ transform: `translateX(${offset}px)` }}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-4"><rect x="5" y="4" width="14" height="17" rx="2" /><path strokeLinecap="round" d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" /></svg></span>
      <div className="min-w-0"><h2 className="text-sm font-semibold">{sheet.name} <span className="text-xs font-normal text-slate-400">({sheet.workoutCount} {sheet.workoutCount === 1 ? "Treino" : "Treinos"})</span></h2>{sheet.description ? <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">{sheet.description}</p> : <p className="mt-1 text-xs text-slate-400">Sem descrição.</p>}</div>
    </Link>
  </li>;
}
