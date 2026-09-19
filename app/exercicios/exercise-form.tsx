"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createExercise, updateExercise, type ExerciseFormState } from "@/app/exercises-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: ExerciseFormState = { message: "" };
const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";
type MuscleGroupOption = { id: string; name: string };
type ExerciseData = { id: string; name: string; description: string | null; muscleGroups: MuscleGroupOption[] };

export function ExerciseForm({ onSuccess, muscleGroups, exercise }: { onSuccess?: () => void; muscleGroups: MuscleGroupOption[]; exercise?: ExerciseData }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(exercise ? updateExercise : createExercise, initialState);
  const [fields, setFields] = useState({ name: exercise?.name ?? "", description: exercise?.description ?? "" });
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroupOption[]>(exercise?.muscleGroups ?? []);

  useEffect(() => {
    if (!state.message.includes("sucesso")) return;
    onSuccess?.();
    const refreshTimer = window.setTimeout(() => router.refresh(), 0);
    return () => window.clearTimeout(refreshTimer);
  }, [onSuccess, router, state.message]);

  function toggleBold() {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = fields.description.slice(start, end);
    const replacement = selected ? `**${selected}**` : "****";
    const description = `${fields.description.slice(0, start)}${replacement}${fields.description.slice(end)}`;
    setFields((current) => ({ ...current, description }));
    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = selected ? start + replacement.length : start + 2;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8" autoComplete="off" noValidate>
      <div>
        <h2 className="text-lg font-semibold">{exercise ? "Editar exercício" : "Novo exercício"}</h2>
        <p className="mt-1 text-sm text-slate-500">{exercise ? "Atualize os dados deste exercício." : "Cadastre um exercício para usar nos treinos."}</p>
      </div>
      <div className="mt-6 space-y-4">
        {exercise ? <input type="hidden" name="exerciseId" value={exercise.id} /> : null}
        <div>
          <label htmlFor="exercise-name" className="mb-2 block text-sm font-medium text-slate-700">Nome</label>
          <input id="exercise-name" name="name" type="text" placeholder="Ex.: Supino reto" value={fields.name} onChange={(event) => setFields((current) => ({ ...current, name: event.target.value }))} className={inputClassName} />
        </div>
        <div className="relative">
          <label htmlFor="muscle-group-search" className="mb-2 block text-sm font-medium text-slate-700">Grupos musculares</label>
          <input id="muscle-group-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque um grupo muscular" className={inputClassName} />
          {query ? <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">{muscleGroups.filter((group) => group.name.toLowerCase().includes(query.toLowerCase()) && !selectedMuscleGroups.some((selected) => selected.id === group.id)).map((group) => <button key={group.id} type="button" onClick={() => { setSelectedMuscleGroups((current) => [...current, group]); setQuery(""); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">{group.name}</button>)}</div> : null}
          <input type="hidden" name="muscleGroupIds" value={JSON.stringify(selectedMuscleGroups.map((group) => group.id))} />
          {selectedMuscleGroups.length ? <div className="mt-3 flex flex-wrap gap-2">{selectedMuscleGroups.map((group) => <button key={group.id} type="button" onClick={() => setSelectedMuscleGroups((current) => current.filter((selected) => selected.id !== group.id))} className="cursor-pointer rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700">{group.name} <span aria-hidden="true" className="ml-1 text-slate-300">×</span></button>)}</div> : null}
        </div>
        <div>
          <label htmlFor="exercise-description" className="mb-2 block text-sm font-medium text-slate-700">Descrição <span className="font-normal text-slate-400">(opcional)</span></label>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10"><div className="flex items-center border-b border-slate-100 px-3 py-2"><button type="button" onClick={toggleBold} title="Aplicar negrito" aria-label="Aplicar negrito" className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">B</button><span className="ml-2 text-xs text-slate-400">Selecione um trecho para aplicar negrito</span></div><textarea ref={descriptionRef} id="exercise-description" name="description" rows={6} placeholder="Inclua instruções ou observações" value={fields.description} onChange={(event) => setFields((current) => ({ ...current, description: event.target.value }))} className="w-full resize-y border-0 bg-transparent px-4 py-3 text-base outline-none" /></div>
        </div>
      </div>
      <FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} />
      <button type="submit" disabled={pending} className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : exercise ? "Salvar alterações" : "Cadastrar exercício"}</button>
    </form>
  );
}
