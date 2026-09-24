"use client";

import { useRef } from "react";
import { SelectMenu } from "@/app/ui/select-menu";
import { NumberPicker } from "./number-picker";
import { RestPicker } from "./rest-picker";
import { SwipeableExercise } from "./swipeable-exercise";

export type Exercise = { id: string; name: string; description?: string | null };
export type Item = { id?: string; exerciseId: string; sets: number; repetitions: number; load: string };
export type RestUnit = "seconds" | "minutes";
export type Group = { id?: string; type?: "single" | "bi_set" | "tri_set" | "combined"; muscleGroupId?: string | null; restSeconds?: number | string | null; restUnit?: RestUnit; notes?: string | null; exercises: Item[] };

export function WorkoutGroupEditor({ group, index, exercises, onItemChange, onAddExercise, onRemoveExercise, onAddSeries, onIntervalChange, onNotesChange }: {
  group: Group;
  index: number;
  exercises: Exercise[];
  onItemChange: (itemIndex: number, field: "exerciseId" | "sets" | "repetitions" | "load", value: string) => void;
  onAddExercise: () => void;
  onRemoveExercise: (itemIndex: number) => void;
  onAddSeries: () => void;
  onIntervalChange: (seconds: number | null, unit: RestUnit) => void;
  onNotesChange: (value: string) => void;
}) {
  const notesRef = useRef<HTMLTextAreaElement>(null);
  function toggleNotesBold() {
    const textarea = notesRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = (group.notes ?? "").slice(start, end);
    const replacement = selected ? `**${selected}**` : "****";
    onNotesChange(`${(group.notes ?? "").slice(0, start)}${replacement}${(group.notes ?? "").slice(end)}`);
    requestAnimationFrame(() => { textarea.focus(); textarea.setSelectionRange(start + (selected ? replacement.length : 2), start + (selected ? replacement.length : 2)); });
  }

  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-slate-700">Exercício {index + 1}</h2>
      <button type="button" onClick={onAddSeries} className="rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white hover:bg-slate-800">+ Novo exercício</button>
    </div>
    <div className="space-y-2 rounded-2xl border border-slate-300 bg-white p-3">
      {group.exercises.map((item, itemIndex) => <div key={item.id ?? itemIndex} className="relative space-y-1" style={{ zIndex: group.exercises.length - itemIndex }}>
        {itemIndex > 0 ? <div aria-hidden="true" className="py-1"><div className="h-px scale-y-50 bg-slate-100" /></div> : null}
        <SwipeableExercise canRemove={group.exercises.length > 1} onRemove={() => onRemoveExercise(itemIndex)} label={`exercício ${itemIndex + 1} da série`}>
          <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_2.75rem] items-end gap-2">
            <SelectMenu compact value={item.exerciseId} onChange={(value) => onItemChange(itemIndex, "exerciseId", value)} options={exercises.filter((exercise) => !group.exercises.some((entry, position) => position !== itemIndex && entry.exerciseId === exercise.id)).map((exercise) => ({ value: exercise.id, label: exercise.name }))} />
            <div className="text-center text-[10px] font-medium text-slate-500">Séries<NumberPicker compact value={item.sets} label="séries" onChange={(value) => onItemChange(itemIndex, "sets", String(value))} /></div>
            <div className="text-center text-[10px] font-medium text-slate-500">Reps<NumberPicker compact value={item.repetitions} label="repetições" onChange={(value) => onItemChange(itemIndex, "repetitions", String(value))} /></div>
          </div>
        </SwipeableExercise>
      </div>)}
      <div className="flex items-center gap-2 py-1"><span className="h-px flex-1 bg-slate-200" /><button type="button" onClick={onAddExercise} aria-label="Adicionar exercício à série" title="Adicionar exercício à série" className="flex size-8 shrink-0 items-center justify-center rounded-full"><span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full bg-slate-950 text-xs font-medium leading-none text-white">+</span></button><span className="h-px flex-1 bg-slate-200" /></div>
      <div><span className="text-xs font-medium text-slate-500">Intervalo</span><RestPicker seconds={group.restSeconds} unit={group.restUnit ?? "seconds"} onChange={onIntervalChange} /></div>
      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10"><div className="flex items-center px-3 pb-0 pt-3"><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={toggleNotesBold} title="Aplicar negrito" aria-label="Aplicar negrito" className="-ml-[10px] -mt-1 flex size-8 items-center justify-center rounded-md text-base font-bold text-slate-400 underline decoration-1 underline-offset-2 transition hover:bg-slate-100 hover:text-slate-700">B</button></div><textarea ref={notesRef} aria-label="Observações da série" value={group.notes ?? ""} maxLength={1000} rows={3} onChange={(event) => onNotesChange(event.target.value)} placeholder="Observações da série" className="w-full resize-y border-0 bg-transparent px-3 pb-3 pt-2 text-[13px] outline-none focus:ring-0" /></div>
    </div>
  </div>;
}
