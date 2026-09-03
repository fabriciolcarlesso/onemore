"use client";

import { useActionState, useState } from "react";
import { createWorkout, type WorkoutFormState } from "@/app/workout-actions";
import { FormToast } from "@/app/ui/form-toast";
import { SelectMenu } from "@/app/ui/select-menu";

type Exercise = { id: string; name: string };
type Item = { exerciseId: string; sets: number; repetitions: number; load: string };
type Group = { type: "single" | "bi_set" | "tri_set"; exercises: Item[] };
const initialState: WorkoutFormState = { message: "" };
const limits = { single: 1, bi_set: 2, tri_set: 3 };
const groupOptions = [
  { value: "single", label: "Série individual" },
  { value: "bi_set", label: "Bi-set (2 exercícios)" },
  { value: "tri_set", label: "Tri-set (3 exercícios)" },
];

export function WorkoutBuilder({ exercises }: { exercises: Exercise[] }) {
  const [state, action, pending] = useActionState(createWorkout, initialState);
  const [groups, setGroups] = useState<Group[]>([{ type: "single", exercises: [{ exerciseId: exercises[0]?.id ?? "", sets: 3, repetitions: 10, load: "" }] }]);

  function addGroup() {
    setGroups((current) => [...current, { type: "single", exercises: [{ exerciseId: exercises[0]?.id ?? "", sets: 3, repetitions: 10, load: "" }] }]);
  }

  function updateItem(groupIndex: number, itemIndex: number, field: "exerciseId" | "sets" | "repetitions" | "load", value: string) {
    setGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, exercises: group.exercises.map((item, itemPosition) => itemPosition === itemIndex ? { ...item, [field]: field === "exerciseId" || field === "load" ? value : Number(value) } : item) } : group));
  }

  const payload = groups.filter((group) => group.exercises.some((item) => item.exerciseId)).map((group) => ({ ...group, exercises: group.exercises.filter((item) => item.exerciseId).map((item) => ({ ...item, load: item.load ? Number(item.load) : undefined })) }));

  return <form action={action} className="max-w-3xl space-y-10" noValidate>
    <section><h2 className="text-lg font-semibold">Dados do treino</h2><div className="mt-5 space-y-4"><input name="name" placeholder="Nome do treino" className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-slate-950" /><textarea name="description" rows={3} placeholder="Descrição (opcional)" className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-slate-950" /></div></section>
    <section><div><h2 className="text-lg font-semibold">Estrutura do treino</h2><p className="mt-1 text-sm text-slate-500">Crie grupos individuais, bi-sets ou tri-sets.</p></div>
      <div className="mt-6 space-y-8">{groups.map((group, groupIndex) => <div key={groupIndex} className="space-y-2"><div className="flex items-center gap-3"><SelectMenu value={group.type} onChange={(value) => setGroups((current) => current.map((item, index) => index === groupIndex ? { ...item, type: value as Group["type"], exercises: Array.from({ length: limits[value as Group["type"]] }, (_, itemIndex) => item.exercises[itemIndex] ?? { exerciseId: exercises[0]?.id ?? "", sets: 3, repetitions: 10, load: "" }) } : item))} options={groupOptions} className="max-w-xs" /></div>{group.exercises.map((item, itemIndex) => <div key={`${groupIndex}-${itemIndex}`} className="grid gap-2 rounded-xl bg-slate-50 p-0 sm:grid-cols-[minmax(0,1fr)_80px_90px_90px]"><SelectMenu value={item.exerciseId} onChange={(value) => updateItem(groupIndex, itemIndex, "exerciseId", value)} options={exercises.map((exercise) => ({ value: exercise.id, label: exercise.name }))} /><input type="number" min="1" value={item.sets} onChange={(event) => updateItem(groupIndex, itemIndex, "sets", event.target.value)} className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950" placeholder="Séries" /><input type="number" min="1" value={item.repetitions} onChange={(event) => updateItem(groupIndex, itemIndex, "repetitions", event.target.value)} className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950" placeholder="Reps" /><input type="number" min="0" step="0.5" value={item.load} onChange={(event) => updateItem(groupIndex, itemIndex, "load", event.target.value)} className="h-12 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950" placeholder="Carga" /></div>)}</div>)}</div>
    </section><input type="hidden" name="groups" value={JSON.stringify(payload)} /><FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} /><div className="flex flex-wrap gap-3"><button type="button" onClick={addGroup} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">+ Grupo</button><button type="submit" disabled={pending} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : "Salvar treino"}</button></div>
  </form>;
}
