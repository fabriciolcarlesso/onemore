"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteWorkoutGroupFromForm, reorderWorkoutExercises, reorderWorkoutGroups } from "@/app/workout-actions";
import { LoadHistoryButton } from "./load-controls";

type WorkoutItem = { id: string; groupId: string; name: string; sets: number; repetitions: number; orderIndex: number };
type WorkoutGroup = { id: string; restSeconds: number | null; orderIndex: number; items: WorkoutItem[] };

export function WorkoutExerciseList({ workoutId, groups, canReorder }: { workoutId: string; groups: WorkoutGroup[]; canReorder: boolean }) {
  const [currentGroups, setCurrentGroups] = useState(groups);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [swipeGroupId, setSwipeGroupId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [pending, startTransition] = useTransition();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPoint = useRef({ x: 0, y: 0 });
  const swipeStart = useRef<{ x: number; y: number; axis: "x" | "y" | null } | null>(null);
  const groupRefs = useRef(new Map<string, HTMLDivElement>());
  const groupsRef = useRef(groups);

  useEffect(() => {
    if (swipeOffset !== -56 || confirmDeleteGroupId) return;
    function closeOnOutside(event: PointerEvent) {
      if (!(event.target as HTMLElement).closest("[data-group-id]")) setSwipeOffset(0);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [swipeOffset, confirmDeleteGroupId]);

  function clearHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  function beginGroupHold(event: React.PointerEvent<HTMLElement>, groupId: string) {
    if (event.button !== 0 || pending) return;
    setSwipeGroupId(groupId);
    setSwipeOffset(0);
    swipeStart.current = { x: event.clientX, y: event.clientY, axis: null };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!canReorder || !(event.target as HTMLElement).closest("[data-group-handle]")) return;
    swipeStart.current = null;
    clearHold();
    startPoint.current = { x: event.clientX, y: event.clientY };
    setDraggingGroupId(groupId);
  }

  function moveItem(itemId: string, targetId: string) {
    if (itemId === targetId) return;
    setCurrentGroups((current) => {
      const next = current.map((group) => {
      if (!group.items.some((item) => item.id === itemId) || !group.items.some((item) => item.id === targetId)) return group;
      const items = [...group.items];
      const from = items.findIndex((item) => item.id === itemId);
      const to = items.findIndex((item) => item.id === targetId);
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return { ...group, items: items.map((item, index) => ({ ...item, orderIndex: index })) };
      });
      groupsRef.current = next;
      return next;
    });
  }

  function moveGroup(groupId: string, targetId: string) {
    if (groupId === targetId) return;
    const before = new Map([...groupRefs.current].map(([id, element]) => [id, element.getBoundingClientRect().top]));
    setCurrentGroups((current) => {
      const from = current.findIndex((group) => group.id === groupId);
      const to = current.findIndex((group) => group.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const reordered = next.map((group, index) => ({ ...group, orderIndex: index }));
      groupsRef.current = reordered;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const [id, element] of groupRefs.current) {
          if (id === groupId) continue;
          const previousTop = before.get(id);
          if (previousTop === undefined) continue;
          const delta = previousTop - element.getBoundingClientRect().top;
          if (!delta) continue;
          element.style.transition = "none";
          element.style.transform = `translateY(${delta}px)`;
          requestAnimationFrame(() => {
            element.style.transition = "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";
            element.style.transform = "";
          });
        }
      }));
      return reordered;
    });
  }

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (swipeStart.current && !draggingGroupId) {
      const dx = event.clientX - swipeStart.current.x;
      const dy = event.clientY - swipeStart.current.y;
      if (!swipeStart.current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 6) swipeStart.current.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (swipeStart.current.axis === "x") {
        clearHold();
        setSwipeOffset(Math.max(-56, Math.min(0, dx)));
        return;
      }
    }
    if (!draggingId && !draggingGroupId && holdTimer.current) {
      const dx = event.clientX - startPoint.current.x;
      const dy = event.clientY - startPoint.current.y;
      if (Math.hypot(dx, dy) > 8) clearHold();
    }
    if (draggingGroupId) {
      setSwipeOffset(0);
      setDragDelta({ x: event.clientX - startPoint.current.x, y: event.clientY - startPoint.current.y });
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-group-id]");
      if (target?.dataset.groupId) moveGroup(draggingGroupId, target.dataset.groupId);
      return;
    }
    if (!draggingId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-exercise-id]");
    if (target?.dataset.exerciseId) moveItem(draggingId, target.dataset.exerciseId);
  }

  function finishDrag() {
    clearHold();
    if (!draggingGroupId && swipeStart.current?.axis === "x") {
      setSwipeOffset(swipeOffset <= -28 ? -56 : 0);
      swipeStart.current = null;
      return;
    }
    swipeStart.current = null;
    if (draggingGroupId) {
      setDraggingGroupId(null);
      setDragDelta({ x: 0, y: 0 });
      setSwipeOffset(0);
      const ordered = groupsRef.current.map((group) => ({ id: group.id, orderIndex: group.orderIndex }));
      startTransition(async () => { await reorderWorkoutGroups(workoutId, ordered); });
      return;
    }
    if (draggingId) {
      setDraggingId(null);
      const ordered = groupsRef.current.flatMap((group) => group.items.map((item) => ({ id: item.id, orderIndex: item.orderIndex })));
      startTransition(async () => { await reorderWorkoutExercises(workoutId, ordered); });
    }
  }

  return <div className="space-y-5" onPointerMove={handleMove} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
    {currentGroups.map((group) => <div key={group.id} ref={(element) => { if (element) groupRefs.current.set(group.id, element); else groupRefs.current.delete(group.id); }} className={`relative overflow-hidden rounded-2xl transition-[filter,opacity] duration-300 ${draggingGroupId && draggingGroupId !== group.id ? "blur-[2px] opacity-45" : ""}`}><div className={`absolute inset-y-0 right-0 flex w-14 items-stretch rounded-r-2xl border border-slate-300 border-l-0 bg-red-800 ${draggingGroupId ? "pointer-events-none opacity-0" : ""}`}><button type="button" tabIndex={swipeGroupId === group.id && swipeOffset === -56 && !draggingGroupId ? 0 : -1} aria-label="Excluir série" onClick={() => setConfirmDeleteGroupId(group.id)} className="w-full rounded-r-2xl text-2xl font-light leading-none text-white hover:bg-red-900">×</button></div><section data-group-id={group.id} onPointerDown={(event) => beginGroupHold(event, group.id)} className={`relative rounded-l-2xl border border-slate-200 bg-white p-3 sm:p-4 ${draggingId || draggingGroupId ? "select-none touch-none" : "touch-pan-y"} ${draggingGroupId === group.id ? "z-50 bg-slate-100 shadow-xl transition-none" : "transition-[filter,opacity,transform,box-shadow] duration-300"} ${swipeGroupId === group.id && swipeOffset === -56 && !draggingGroupId ? "rounded-r-none border-r-0" : "rounded-r-2xl"}`} style={{ willChange: draggingGroupId ? "transform" : undefined, transform: `${swipeGroupId === group.id && !draggingGroupId ? `translateX(${swipeOffset}px)` : ""}${draggingGroupId === group.id ? ` translate(${dragDelta.x}px, ${dragDelta.y}px) scale(1.015)` : ""}` }}>
      <div data-group-handle className="mb-1 flex h-5 touch-none cursor-grab items-center justify-center text-slate-300 active:cursor-grabbing" aria-label="Mover série" title="Mover série"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path strokeLinecap="round" d="M5 7h14M5 12h14M5 17h14" /></svg></div>
      <div className="divide-y divide-slate-100">{group.items.map((item) => <div key={item.id} data-exercise-id={item.id} className={`grid grid-cols-[minmax(0,1fr)_2.5rem_2.5rem] items-center gap-2 py-2 text-[13px] ${draggingId ? "touch-none" : "touch-pan-y"} ${draggingId === item.id ? "rounded-lg bg-slate-100 opacity-60" : ""}`}>
        <div className="min-w-0 truncate"><LoadHistoryButton workoutExerciseId={item.id} exerciseName={item.name} /></div><div className="text-center"><span className="block text-[9px] text-slate-400">Séries</span><span className="font-medium text-slate-600">{item.sets}</span></div><div className="text-center"><span className="block text-[9px] text-slate-400">Reps</span><span className="font-medium text-slate-600">{item.repetitions}</span></div>
      </div>)}</div><p className="mt-2 text-xs text-slate-500">Intervalo entre séries: <strong className="text-slate-950">{group.restSeconds === null ? "--" : `${group.restSeconds}s`}</strong></p>
    </section>{confirmDeleteGroupId === group.id ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={`delete-group-title-${group.id}`}><button type="button" aria-label="Fechar confirmação" onClick={() => setConfirmDeleteGroupId(null)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" /><div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 id={`delete-group-title-${group.id}`} className="text-lg font-semibold">Excluir série?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Esta série e os exercícios dela serão excluídos permanentemente.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmDeleteGroupId(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><form action={deleteWorkoutGroupFromForm}><input type="hidden" name="workoutId" value={workoutId} /><input type="hidden" name="groupId" value={group.id} /><button type="submit" className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900">Excluir</button></form></div></div></div> : null}</div>)}
  </div>;
}
