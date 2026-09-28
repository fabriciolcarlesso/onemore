"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { deleteWorkoutGroupFromForm, reorderWorkoutExercises, reorderWorkoutGroups, updateWorkoutExerciseRepetitions, updateWorkoutExerciseSets } from "@/app/workout-actions";
import { LoadPicker } from "./load-picker";
import { NumberPicker } from "./number-picker";

type WorkoutItem = { id: string; groupId: string; name: string; sets: number; repetitions: number; load: string | null; orderIndex: number };
type WorkoutGroup = { id: string; restSeconds: number | null; orderIndex: number; items: WorkoutItem[] };

export function WorkoutExerciseList({ workoutId, groups, canReorder }: { workoutId: string; groups: WorkoutGroup[]; canReorder: boolean }) {
  const [currentGroups, setCurrentGroups] = useState(groups);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [swipeGroupId, setSwipeGroupId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPoint = useRef({ x: 0, y: 0 });
  const swipeStart = useRef<{ x: number; y: number; axis: "x" | "y" | null } | null>(null);
  const groupRefs = useRef(new Map<string, HTMLDivElement>());
  const itemRefs = useRef(new Map<string, HTMLDivElement>());
  const groupsRef = useRef(groups);
  const draggingGroupRef = useRef<string | null>(null);
  const dragStartTop = useRef(0);
  const dragPointerDelta = useRef({ x: 0, y: 0 });
  const layoutPositions = useRef(new Map<string, number>());
  const itemPositions = useRef(new Map<string, number>());
  const itemDragDelta = useRef({ x: 0, y: 0 });
  const itemStartTop = useRef(0);
  const lastPointer = useRef({ x: 0, y: 0 });

  function updateDraggedPosition(groupId: string) {
    const draggedElement = groupRefs.current.get(groupId);
    if (!draggedElement) return;
    draggedElement.style.transform = "none";
    const naturalTop = draggedElement.getBoundingClientRect().top;
    const x = dragPointerDelta.current.x;
    const y = dragStartTop.current + dragPointerDelta.current.y - naturalTop;
    draggedElement.style.transform = `translate(${x}px, ${y}px) scale(1.015)`;
  }

  useLayoutEffect(() => {
    const nextPositions = new Map<string, number>();
    for (const [id, element] of groupRefs.current) nextPositions.set(id, element.getBoundingClientRect().top);
    const previousPositions = layoutPositions.current;
    if (previousPositions.size) {
      for (const [id, element] of groupRefs.current) {
        if (id === draggingGroupRef.current) continue;
        const previousTop = previousPositions.get(id);
        const nextTop = nextPositions.get(id);
        if (previousTop === undefined || nextTop === undefined) continue;
        const delta = previousTop - nextTop;
        if (!delta) continue;
        element.style.transition = "none";
        element.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          element.style.transition = "transform 320ms cubic-bezier(0.16, 1, 0.3, 1)";
          element.style.transform = "";
        });
      }
    }
    if (draggingGroupRef.current) updateDraggedPosition(draggingGroupRef.current);
    layoutPositions.current = nextPositions;
  }, [currentGroups]);

  useLayoutEffect(() => {
    const nextPositions = new Map<string, number>();
    for (const [id, element] of itemRefs.current) nextPositions.set(id, element.getBoundingClientRect().top);
    const previousPositions = itemPositions.current;
    if (previousPositions.size) {
      for (const [id, element] of itemRefs.current) {
        if (id === draggingId) continue;
        const previousTop = previousPositions.get(id);
        const nextTop = nextPositions.get(id);
        if (previousTop === undefined || nextTop === undefined) continue;
        const delta = previousTop - nextTop;
        if (!delta) continue;
        element.style.transition = "none";
        element.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          element.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
          element.style.transform = "";
        });
      }
    }
    itemPositions.current = nextPositions;
    if (draggingId) {
      const selected = itemRefs.current.get(draggingId);
      if (selected) {
        selected.style.transform = "none";
        const naturalTop = selected.getBoundingClientRect().top;
        setDragDelta({
          x: itemDragDelta.current.x,
          y: itemStartTop.current + itemDragDelta.current.y - naturalTop,
        });
      }
    }
  }, [currentGroups, draggingId]);

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
    if (event.button !== 0 || pending || !canReorder) return;
    setSwipeGroupId(groupId);
    setSwipeOffset(0);
    swipeStart.current = { x: event.clientX, y: event.clientY, axis: null };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!(event.target as HTMLElement).closest("[data-group-handle]")) return;
    swipeStart.current = null;
    clearHold();
    startPoint.current = { x: event.clientX, y: event.clientY };
    dragStartTop.current = groupRefs.current.get(groupId)?.getBoundingClientRect().top ?? 0;
    dragPointerDelta.current = { x: 0, y: 0 };
    draggingGroupRef.current = groupId;
    setDraggingGroupId(groupId);
    requestAnimationFrame(() => updateDraggedPosition(groupId));
  }

  function beginItemDrag(event: React.PointerEvent<HTMLDivElement>, itemId: string) {
    if (!canReorder || event.button !== 0 || pending || (event.target as HTMLElement).closest("button, input")) return;
    event.stopPropagation();
    setDraggingId(itemId);
    startPoint.current = { x: event.clientX, y: event.clientY };
    itemStartTop.current = event.currentTarget.getBoundingClientRect().top;
    itemDragDelta.current = { x: 0, y: 0 };
    lastPointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveItem(itemId: string, targetId: string) {
    if (itemId === targetId) return;
    const current = groupsRef.current;
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
    setCurrentGroups(next);
  }

  function updateSets(itemId: string, sets: number) {
    setCurrentGroups((current) => current.map((group) => ({ ...group, items: group.items.map((item) => item.id === itemId ? { ...item, sets } : item) })));
    startTransition(async () => { await updateWorkoutExerciseSets(itemId, sets); });
  }

  function updateRepetitions(itemId: string, repetitions: number) {
    setCurrentGroups((current) => current.map((group) => ({ ...group, items: group.items.map((item) => item.id === itemId ? { ...item, repetitions } : item) })));
    startTransition(async () => { await updateWorkoutExerciseRepetitions(itemId, repetitions); });
  }

  function moveGroup(groupId: string, targetId: string) {
    if (groupId === targetId) return;
    const before = new Map<string, number>();
    for (const [id, element] of groupRefs.current) {
      before.set(id, element.getBoundingClientRect().top);
    }
    layoutPositions.current = before;
    setCurrentGroups((current) => {
      const from = current.findIndex((group) => group.id === groupId);
      const to = current.findIndex((group) => group.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const reordered = next.map((group, index) => ({ ...group, orderIndex: index }));
      groupsRef.current = reordered;
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
    const activeGroupId = draggingGroupRef.current;
    if (activeGroupId) {
      setSwipeOffset(0);
      dragPointerDelta.current = { x: event.clientX - startPoint.current.x, y: event.clientY - startPoint.current.y };
      updateDraggedPosition(activeGroupId);
      const target = document.elementsFromPoint(event.clientX, event.clientY)
        .map((element) => element.closest<HTMLElement>("[data-group-id]"))
        .find((element) => element?.dataset.groupId && element.dataset.groupId !== activeGroupId);
      if (target?.dataset.groupId) moveGroup(activeGroupId, target.dataset.groupId);
      return;
    }
    if (!draggingId) return;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    itemDragDelta.current = { x: event.clientX - startPoint.current.x, y: event.clientY - startPoint.current.y };
    setDragDelta(itemDragDelta.current);
  }

  function finishDrag(event?: React.PointerEvent<HTMLDivElement>) {
    clearHold();
    if (!draggingGroupId && swipeStart.current?.axis === "x") {
      setSwipeOffset(swipeOffset <= -28 ? -56 : 0);
      swipeStart.current = null;
      return;
    }
    swipeStart.current = null;
    const activeGroupId = draggingGroupRef.current;
    if (activeGroupId) {
      draggingGroupRef.current = null;
      dragPointerDelta.current = { x: 0, y: 0 };
      setDraggingGroupId(null);
      groupRefs.current.get(activeGroupId)?.style.removeProperty("transform");
      setSwipeOffset(0);
      const ordered = groupsRef.current.map((group, index) => ({ id: group.id, orderIndex: index }));
      startTransition(async () => { await reorderWorkoutGroups(workoutId, ordered); });
      return;
    }
    if (draggingId) {
      const activeItemId = draggingId;
      const pointer = event ? { x: event.clientX, y: event.clientY } : lastPointer.current;
      const target = document.elementsFromPoint(pointer.x, pointer.y)
        .map((element) => element.closest<HTMLElement>("[data-exercise-id]"))
        .find((element) => element?.dataset.exerciseId && element.dataset.exerciseId !== activeItemId);
      if (target?.dataset.exerciseId) moveItem(activeItemId, target.dataset.exerciseId);
      itemRefs.current.get(activeItemId)?.style.removeProperty("transform");
      setDraggingId(null);
      setDragDelta({ x: 0, y: 0 });
      itemDragDelta.current = { x: 0, y: 0 };
      const ordered = groupsRef.current.flatMap((group) => group.items.map((item) => ({ id: item.id, orderIndex: item.orderIndex })));
      startTransition(async () => { await reorderWorkoutExercises(workoutId, ordered); });
    }
  }

  return <div className="space-y-5" onPointerMove={handleMove} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
    {currentGroups.map((group) => <div key={group.id} ref={(element) => { if (element) groupRefs.current.set(group.id, element); else groupRefs.current.delete(group.id); }} className={`relative overflow-visible rounded-2xl transition-[filter,opacity] duration-300 ${draggingGroupId === group.id ? "!z-[9999] pointer-events-none" : "z-0"} ${draggingGroupId && draggingGroupId !== group.id ? "blur-[2px] opacity-45" : ""}`} style={{ willChange: draggingGroupId ? "transform" : undefined }}><div className={`absolute inset-y-0 right-0 flex w-14 items-stretch rounded-r-2xl border border-slate-300 border-l-0 bg-red-800 ${draggingGroupId ? "pointer-events-none opacity-0" : ""}`}><button type="button" tabIndex={swipeGroupId === group.id && swipeOffset === -56 && !draggingGroupId ? 0 : -1} aria-label="Excluir série" onClick={() => setConfirmDeleteGroupId(group.id)} className="w-full rounded-r-2xl text-2xl font-light leading-none text-white hover:bg-red-900">×</button></div><section data-group-id={group.id} onPointerDown={(event) => beginGroupHold(event, group.id)} className={`relative overflow-visible rounded-l-2xl border border-slate-200 bg-white p-3 sm:p-4 ${draggingId || draggingGroupId ? "select-none touch-none" : "touch-pan-y"} ${draggingGroupId === group.id ? "!z-[9999] bg-slate-100 shadow-xl transition-none" : "transition-[filter,opacity,transform,box-shadow] duration-300"} ${swipeGroupId === group.id && swipeOffset === -56 && !draggingGroupId ? "rounded-r-none border-r-0" : "rounded-r-2xl"}`} style={{ willChange: draggingGroupId ? "transform" : undefined, transform: `${swipeGroupId === group.id && !draggingGroupId ? `translateX(${swipeOffset}px)` : ""}` }}>
      <div data-group-handle onClick={(event) => event.stopPropagation()} className="absolute -left-3 top-[calc(50%-0.8125rem)] z-10 flex size-6 -translate-y-1/2 touch-none cursor-grab items-center justify-center rounded-full border border-slate-200 bg-white text-slate-300 shadow-sm active:cursor-grabbing" aria-label="Mover série" title="Mover série"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path strokeLinecap="round" d="M5 7h14M5 12h14M5 17h14" /></svg></div>
      <div className="divide-y divide-slate-100">{group.items.map((item) => <div key={item.id} ref={(element) => { if (element) itemRefs.current.set(item.id, element); else itemRefs.current.delete(item.id); }} data-exercise-id={item.id} onPointerDown={(event) => beginItemDrag(event, item.id)} className={`grid ${canReorder ? "grid-cols-[minmax(0,1fr)_2.5rem_2.5rem]" : "grid-cols-[minmax(0,1fr)_2.5rem_2.5rem_4.5rem]"} items-center gap-2 py-1 text-[13px] transition-[filter,opacity] duration-300 ${draggingId ? "touch-none" : "touch-pan-y"} ${draggingId === item.id ? "relative z-10 pointer-events-none rounded-lg bg-white shadow-md" : draggingId ? "blur-[2px] opacity-45" : ""}`} style={{ transform: draggingId === item.id ? `translate(${dragDelta.x}px, ${dragDelta.y}px) scale(1.02)` : undefined, transition: draggingId === item.id ? "none" : undefined, willChange: draggingId === item.id ? "transform" : undefined }}>
        <div className="min-w-0 truncate">{item.name}</div><div className="text-center" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}><span className="block text-[9px] text-slate-400">Séries</span>{canReorder ? <NumberPicker compact max={12} className="!h-7" value={item.sets} label="séries" onChange={(value) => updateSets(item.id, value)} /> : <span className="block h-7 pt-1 font-medium text-slate-600">{item.sets}</span>}</div><div className="text-center" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}><span className="block text-[9px] text-slate-400">Reps</span>{canReorder ? <NumberPicker compact className="!h-7" value={item.repetitions} label="repetições" onChange={(value) => updateRepetitions(item.id, value)} /> : <span className="block h-7 pt-1 font-medium text-slate-600">{item.repetitions}</span>}</div>{canReorder ? null : <div className="text-center" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}><span className="block text-[9px] text-slate-400">Carga</span><LoadPicker workoutExerciseId={item.id} exerciseName={item.name} initialLoad={item.load} /></div>}
      </div>)}</div><p className="mt-2 text-xs text-slate-500">Intervalo entre séries: <strong className="text-slate-950">{group.restSeconds === null ? "--" : `${group.restSeconds}s`}</strong></p>
    </section>{confirmDeleteGroupId === group.id ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={`delete-group-title-${group.id}`}><button type="button" aria-label="Fechar confirmação" onClick={() => setConfirmDeleteGroupId(null)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" /><div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 id={`delete-group-title-${group.id}`} className="text-lg font-semibold">Excluir série?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Esta série e os exercícios dela serão excluídos permanentemente.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setConfirmDeleteGroupId(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><form action={deleteWorkoutGroupFromForm}><input type="hidden" name="workoutId" value={workoutId} /><input type="hidden" name="groupId" value={group.id} /><button type="submit" className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900">Excluir</button></form></div></div></div> : null}</div>)}
  </div>;
}
