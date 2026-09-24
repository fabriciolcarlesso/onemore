"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deleteWorkoutFromSheet } from "@/app/planilhas/actions";

type WorkoutItem = { id: string; name: string; description: string | null; creator: string | null };

export function SwipeableWorkoutCard({ workout }: { workout: WorkoutItem }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const start = useRef<{ x: number; y: number; axis: "x" | "y" | null } | null>(null);
  const card = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (offset !== -56 || confirmOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (!card.current?.contains(event.target as Node)) setOffset(0);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [offset, confirmOpen]);

  function onPointerDown(event: React.PointerEvent<HTMLLIElement>) {
    if (event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, axis: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLLIElement>) {
    if (!start.current || confirmOpen) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (!start.current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6) start.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (start.current.axis === "x") {
      setDragging(true);
      setOffset(Math.max(-56, Math.min(0, dx)));
    }
  }

  function onPointerUp() {
    if (start.current?.axis === "x") setOffset(offset <= -28 ? -56 : 0);
    start.current = null;
    setDragging(false);
  }

  return <li ref={card} className="relative touch-pan-y overflow-hidden rounded-2xl" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <div aria-hidden={offset === 0} className="absolute inset-y-0 right-0 flex w-14 items-stretch rounded-r-2xl border border-slate-300 border-l-0 bg-red-800"><button type="button" tabIndex={offset === 0 ? -1 : 0} aria-label={`Excluir treino ${workout.name}`} onClick={() => setConfirmOpen(true)} className="w-full rounded-r-2xl text-2xl font-light leading-none text-white hover:bg-red-900">×</button></div>
    <Link href={`/treinos/${workout.id}`} className={`relative block h-full rounded-l-2xl border border-slate-200 bg-white p-5 hover:shadow-sm ${offset === 0 ? "rounded-r-2xl border-r" : "rounded-r-none border-r-0"} ${dragging ? "transition-none" : "transition-transform duration-200"}`} style={{ transform: `translateX(${offset}px)` }}>
      <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></svg></span><h2 className="min-w-0 font-semibold">{workout.name}</h2></div>
      {workout.description ? <div className="relative mt-3 max-h-[4.5rem] overflow-hidden"><p className="text-sm leading-6 text-slate-500">{workout.description}</p><span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-white via-white/90 to-transparent" /></div> : <p className="mt-3 text-sm text-slate-400">Sem descrição.</p>}
      {workout.creator ? <p className="mt-2 text-xs text-slate-400">Criado por {workout.creator}</p> : null}
    </Link>
    {confirmOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true"><button type="button" aria-label="Fechar confirmação" onClick={() => setConfirmOpen(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" /><div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold">Excluir treino?</h2><p className="mt-2 text-sm leading-6 text-slate-500">O treino “{workout.name}” e seus exercícios serão excluídos permanentemente.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><form action={deleteWorkoutFromSheet}><input type="hidden" name="workoutId" value={workout.id} /><button type="submit" className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900">Excluir</button></form></div></div></div> : null}
  </li>;
}
