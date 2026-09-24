"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RichDescription } from "@/app/exercicios/rich-description";
import { WorkoutDays } from "@/app/treinos/workout-days";
import { deleteWorkoutFromSheet } from "./actions";

type WorkoutCardData = { id: string; name: string; description: string | null; weekdays: string[]; exerciseCount: number; estimatedMinutes: number };

export function WorkoutCard({ workout }: { workout: WorkoutCardData }) {
  const [expanded, setExpanded] = useState(false);
  const [showFade, setShowFade] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cardRef = useRef<HTMLLIElement>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number; offset: number; axis: "x" | "y" | null } | null>(null);
  const suppressClick = useRef(false);
  const offset = dragging ? dragOffset : open || confirmOpen ? -56 : 0;

  function setExpandedSmooth(next: boolean) {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    if (next) {
      setShowFade(false);
      setExpanded(true);
    } else {
      setShowFade(false);
      setExpanded(false);
      fadeTimer.current = setTimeout(() => setShowFade(true), 700);
    }
  }

  useEffect(() => () => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
  }, []);

  useEffect(() => {
    function closeOtherCard(event: Event) {
      if ((event as CustomEvent<string>).detail !== workout.id) setExpandedSmooth(false);
    }
    window.addEventListener("workout-card-expand", closeOtherCard);
    return () => window.removeEventListener("workout-card-expand", closeOtherCard);
  }, [workout.id]);

  function toggleExpanded() {
    const next = !expanded;
    if (next) window.dispatchEvent(new CustomEvent("workout-card-expand", { detail: workout.id }));
    setExpandedSmooth(next);
  }

  useEffect(() => {
    if (!open || confirmOpen) return;
    function closeOnOutside(event: PointerEvent) {
      if (!cardRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open, confirmOpen]);

  function onPointerDown(event: React.PointerEvent<HTMLLIElement>) {
    if (event.button !== 0) return;
    pointerStart.current = { x: event.clientX, y: event.clientY, offset, axis: null };
    suppressClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLLIElement>) {
    const start = pointerStart.current;
    if (!start || confirmOpen) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (!start.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 6) {
      start.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
      if (start.axis === "x") setDragging(true);
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
      setDragOffset(shouldOpen ? -56 : 0);
      setOpen(shouldOpen);
      if (!shouldOpen) setConfirmOpen(false);
    }
    pointerStart.current = null;
    setDragging(false);
  }

  return <li ref={cardRef} className="relative touch-pan-y overflow-hidden rounded-2xl" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <div inert={offset === 0} aria-hidden={offset === 0} className="absolute inset-y-0 right-0 flex w-14 items-stretch justify-center rounded-r-2xl border border-slate-300 border-l-0 bg-red-800"><button type="button" tabIndex={offset === 0 ? -1 : 0} aria-label={`Excluir treino ${workout.name}`} onClick={() => setConfirmOpen(true)} className="w-full rounded-r-2xl text-2xl font-light leading-none text-white transition hover:bg-red-900">×</button></div>
    <div className={`relative flex flex-col rounded-l-2xl border border-slate-200 bg-white transition-all duration-200 ${offset === 0 ? "rounded-r-2xl border-r" : "rounded-r-none border-r-0"} ${dragging ? "transition-none" : ""}`} style={{ transform: `translateX(${offset}px)` }}>
    <Link href={`/treinos/${workout.id}`} onClick={(event) => { if (suppressClick.current) { event.preventDefault(); suppressClick.current = false; } }} className="flex min-w-0 items-start px-5 pt-5 pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
      <div className="min-w-0 flex-1">
        <div className="relative"><h2 className="font-semibold">{workout.name}</h2></div>
        <span className="mt-2 inline-flex items-center text-xs text-slate-400"><span>{workout.exerciseCount === 1 ? "Exercício" : "Exercícios"}: {workout.exerciseCount}</span><span aria-hidden="true" className="mx-1">|</span><span>Tempo estimado: {workout.estimatedMinutes} {workout.estimatedMinutes === 1 ? "minuto" : "minutos"}</span></span>
        <WorkoutDays days={workout.weekdays} />
        {workout.description ? <div className={`relative overflow-hidden transition-[max-height] duration-700 ease-in-out ${expanded ? "max-h-[40rem]" : "max-h-[4.5rem]"}`}><RichDescription text={workout.description} className="mt-3 text-sm leading-6 text-slate-500" />{showFade ? <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-white via-white/90 to-transparent" /> : null}</div> : <p className="mt-3 text-sm text-slate-400">Sem descrição.</p>}
      </div>
    </Link>
    <button type="button" aria-label={expanded ? "Recolher treino" : "Expandir"} title={expanded ? "Recolher" : "Expandir"} onClick={toggleExpanded} className="-translate-y-1 flex h-8 items-center justify-center transition"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`size-6 rounded-full bg-slate-950 p-1 text-white transition-transform duration-700 ${expanded ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg></button>
    </div>
    {confirmOpen ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={`delete-workout-title-${workout.id}`}><button type="button" aria-label="Fechar confirmação" onClick={() => setConfirmOpen(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" /><div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 id={`delete-workout-title-${workout.id}`} className="text-lg font-semibold">Excluir treino?</h2><p className="mt-2 text-sm leading-6 text-slate-500">O treino “{workout.name}” e seus exercícios serão excluídos permanentemente.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><form action={deleteWorkoutFromSheet}><input type="hidden" name="workoutId" value={workout.id} /><button type="submit" className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900">Excluir</button></form></div></div></div> : null}
  </li>;
}
