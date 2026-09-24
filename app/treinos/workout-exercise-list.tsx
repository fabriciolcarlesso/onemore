"use client";

import { useRef, useState, useTransition } from "react";
import { reorderWorkoutExercises, reorderWorkoutGroups } from "@/app/workout-actions";
import { LoadHistoryButton } from "./load-controls";
import { LoadPicker } from "./load-picker";

type WorkoutItem = { id: string; groupId: string; name: string; sets: number; repetitions: number; load: string | null; orderIndex: number };
type WorkoutGroup = { id: string; restSeconds: number | null; orderIndex: number; items: WorkoutItem[] };

export function WorkoutExerciseList({ workoutId, groups, canReorder }: { workoutId: string; groups: WorkoutGroup[]; canReorder: boolean }) {
  const [currentGroups, setCurrentGroups] = useState(groups);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPoint = useRef({ x: 0, y: 0 });
  const groupsRef = useRef(groups);

  function clearHold() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  function beginHold(event: React.PointerEvent<HTMLDivElement>, itemId: string) {
    if (!canReorder || pending || event.button !== 0 || (event.target as HTMLElement).closest("button, input")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    startPoint.current = { x: event.clientX, y: event.clientY };
    clearHold();
    holdTimer.current = setTimeout(() => setDraggingId(itemId), 350);
  }

  function beginGroupHold(event: React.PointerEvent<HTMLElement>, groupId: string) {
    if (!canReorder || pending || event.button !== 0 || (event.target as HTMLElement).closest("[data-exercise-id], button, input")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    clearHold();
    startPoint.current = { x: event.clientX, y: event.clientY };
    holdTimer.current = setTimeout(() => setDraggingGroupId(groupId), 350);
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
    if (!draggingId && !draggingGroupId && holdTimer.current) {
      const dx = event.clientX - startPoint.current.x;
      const dy = event.clientY - startPoint.current.y;
      if (Math.hypot(dx, dy) > 8) clearHold();
    }
    if (draggingGroupId) {
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
    if (draggingGroupId) {
      setDraggingGroupId(null);
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
    {currentGroups.map((group) => <section key={group.id} data-group-id={group.id} onPointerDown={(event) => beginGroupHold(event, group.id)} className={`rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 ${draggingId || draggingGroupId ? "select-none touch-none" : ""} ${draggingGroupId === group.id ? "opacity-60" : ""}`}>
      <div className="divide-y divide-slate-100">{group.items.map((item) => <div key={item.id} data-exercise-id={item.id} onPointerDown={(event) => beginHold(event, item.id)} className={`grid grid-cols-[minmax(0,1fr)_2.5rem_2.5rem_auto] items-center gap-2 py-2 text-[13px] ${draggingId ? "touch-none" : "touch-pan-y"} ${draggingId === item.id ? "rounded-lg bg-slate-100 opacity-60" : ""}`}>
        <div className="min-w-0 truncate"><LoadHistoryButton workoutExerciseId={item.id} exerciseName={item.name} /></div><div className="text-center"><span className="block text-[9px] text-slate-400">Séries</span><span className="font-medium text-slate-600">{item.sets}</span></div><div className="text-center"><span className="block text-[9px] text-slate-400">Reps</span><span className="font-medium text-slate-600">{item.repetitions}</span></div><div className="text-center"><span className="block text-[9px] text-slate-400">Carga</span><LoadPicker workoutExerciseId={item.id} exerciseName={item.name} initialLoad={item.load} /></div>
      </div>)}</div><p className="mt-2 text-xs text-slate-500">Intervalo entre séries: <strong className="text-slate-950">{group.restSeconds === null ? "--" : `${group.restSeconds}s`}</strong></p>
    </section>)}
  </div>;
}
