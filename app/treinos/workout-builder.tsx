"use client";

import { useActionState, useEffect, useState } from "react";
import { createWorkout, updateWorkout, type WorkoutFormState } from "@/app/workout-actions";
import { FormToast } from "@/app/ui/form-toast";
import { SelectMenu } from "@/app/ui/select-menu";
import { WorkoutPlayer } from "./workout-player";
import { NumberPicker } from "./number-picker";

type Exercise = { id: string; name: string; description?: string | null };
type MuscleGroup = { id: string; name: string };
type Item = { id?: string; exerciseId: string; sets: number; repetitions: number; load: string };
type RestUnit = "seconds" | "minutes";
type Group = { id?: string; type: "single" | "bi_set" | "tri_set"; muscleGroupId?: string | null; restSeconds?: number | string | null; restUnit?: RestUnit; notes?: string | null; exercises: Item[] };
export type WorkoutData = { id: string; name: string; description: string | null; groups: Group[] };
const initialState: WorkoutFormState = { message: "" };
const limits = { single: 1, bi_set: 2, tri_set: 3 };
const groupOptions = [{ value: "single", label: "Série: Individual" }, { value: "bi_set", label: "Série: Bi-Set" }, { value: "tri_set", label: "Série: Tri-Set" }];
const restUnitOptions = [{ value: "seconds", label: "Segundos" }, { value: "minutes", label: "Minutos" }];
const emptyItem = (): Item => ({ exerciseId: "", sets: 0, repetitions: 0, load: "" });

function initialRestUnit(restSeconds: Group["restSeconds"]): RestUnit {
  const seconds = Number(restSeconds);
  return seconds >= 60 && seconds % 60 === 0 ? "minutes" : "seconds";
}

function displayedRest(group: Group) {
  if (group.restSeconds === "" || group.restSeconds == null) return "";
  return group.restUnit === "minutes" ? Number(group.restSeconds) / 60 : Number(group.restSeconds);
}

export function WorkoutBuilder({ exercises, muscleGroups, workout, sheetId }: { exercises: Exercise[]; muscleGroups: MuscleGroup[]; workout?: WorkoutData; sheetId?: string }) {
  const [state, action, pending] = useActionState(workout ? updateWorkout : createWorkout, initialState);
  const [step, setStep] = useState(workout ? 2 : 1);
  const [seriesStep, setSeriesStep] = useState(false);
  const [fields, setFields] = useState({ name: workout?.name ?? "", description: workout?.description ?? "" });
  const [groups, setGroups] = useState<Group[]>(workout?.groups.map((group) => ({ ...group, restUnit: initialRestUnit(group.restSeconds) })) ?? [{ type: "single", muscleGroupId: null, restSeconds: null, restUnit: "seconds", notes: "", exercises: [emptyItem()] }]);
  const [previewOpen, setPreviewOpen] = useState(false);
  void muscleGroups;
  useEffect(() => {
    function handleTopbarBack(event: Event) {
      if (step !== 2) return;
      event.preventDefault();
      if (seriesStep) setSeriesStep(false);
      else setStep(1);
    }
    window.addEventListener("workout:back", handleTopbarBack);
    return () => window.removeEventListener("workout:back", handleTopbarBack);
  }, [seriesStep, step]);
  function updateItem(groupIndex: number, itemIndex: number, field: "exerciseId" | "sets" | "repetitions" | "load", value: string) { setGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, exercises: group.exercises.map((item, position) => position === itemIndex ? { ...item, [field]: field === "exerciseId" || field === "load" ? value : Number(value) } : item) } : group)); }
  function changeType(groupIndex: number, value: string) { const type = value as Group["type"]; setGroups((current) => current.map((group, index) => index === groupIndex ? { ...group, type, exercises: Array.from({ length: limits[type] }, (_, itemIndex) => group.exercises[itemIndex] ?? emptyItem()) } : group)); }
  const payload = groups.filter((group) => group.exercises.some((item) => item.exerciseId)).map((group) => ({ ...group, restSeconds: group.restSeconds === "" || group.restSeconds == null ? null : Number(group.restSeconds), exercises: group.exercises.filter((item) => item.exerciseId).map((item) => ({ ...item, load: item.load ? Number(item.load) : undefined })) }));
  const canAdvance = fields.name.trim().length > 0;
  const visibleGroups = seriesStep ? [{ group: groups[groups.length - 1], index: groups.length - 1 }] : groups.map((group, index) => ({ group, index }));
  return <><div className="mb-8"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{seriesStep ? "Nova série" : step === 2 ? (fields.name || "Novo treino") : workout ? "Editar treino" : "Novo treino"}</h1><p className="mt-1 text-sm text-slate-500">{step === 2 ? "Escolhe a série e o grupo muscular." : "Monte e organize seus treinos."}</p></div><form action={action} className={`max-w-3xl space-y-8 ${step === 2 ? "pb-28" : ""}`} noValidate>
    {workout ? <input type="hidden" name="workoutId" value={workout.id} /> : null}
    {sheetId ? <input type="hidden" name="sheetId" value={sheetId} /> : null}
    <div className="flex flex-wrap items-center gap-3"><div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-400">{step === 2 ? <><button type="button" onClick={() => setSeriesStep(false)} className="text-slate-500 hover:text-slate-950">Exercícios</button><span>→</span><span className="text-slate-950">Série {seriesStep ? groups.length : 1}</span></> : <><span className="text-slate-950">Dados</span><span className="h-px w-8 bg-slate-200" /><span>Exercícios</span></>}</div></div>
    {step === 1 ? <section className="space-y-5"><div><h2 className="text-lg font-semibold">Dados do treino</h2><p className="mt-1 text-sm text-slate-500">Dê um nome ao treino e, se quiser, inclua uma descrição.</p></div><input name="name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="Nome do treino" required className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" /><textarea name="description" value={fields.description} onChange={(event) => setFields({ ...fields, description: event.target.value })} rows={4} maxLength={1000} placeholder="Descrição (opcional)" className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" /><button type="button" onClick={() => { if (canAdvance) setStep(2); }} className="w-full rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={!canAdvance}>Inserir exercícios</button></section> : <>
      <section><div className="mt-6 space-y-5">{visibleGroups.map(({ group, index: groupIndex }) => <div key={group.id ?? groupIndex} className="space-y-3"><div className="flex items-center gap-2"><SelectMenu value={group.type} onChange={(value) => changeType(groupIndex, value)} options={groupOptions} className="w-full max-w-md" /><button type="button" aria-label="Nova série" onClick={() => { setGroups((current) => [...current, { type: "single", muscleGroupId: null, restSeconds: null, restUnit: "seconds", notes: "", exercises: [emptyItem()] }]); setSeriesStep(true); }} className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xl font-medium text-white hover:bg-slate-800">+</button></div><div className="space-y-3 rounded-2xl border border-slate-300 bg-white p-5">{group.exercises.map((item, itemIndex) => <div key={item.id ?? itemIndex} className="grid grid-cols-3 items-end gap-2 border-b border-slate-200 pb-3"><div className="col-span-3"><SelectMenu value={item.exerciseId} onChange={(value) => updateItem(groupIndex, itemIndex, "exerciseId", value)} options={exercises.filter((exercise) => !group.exercises.some((entry, position) => position !== itemIndex && entry.exerciseId === exercise.id)).map((exercise) => ({ value: exercise.id, label: exercise.name }))} /></div><label className="text-xs font-medium text-slate-500">Séries<NumberPicker value={item.sets} label="séries" onChange={(value) => updateItem(groupIndex, itemIndex, "sets", String(value))} /></label><label className="text-xs font-medium text-slate-500">Reps<NumberPicker value={item.repetitions} label="repetições" onChange={(value) => updateItem(groupIndex, itemIndex, "repetitions", String(value))} /></label></div>)}<div><span className="text-xs font-medium text-slate-500">Intervalo</span><div className="mt-1 flex max-w-xs gap-2"><input aria-label="Duração do intervalo" type="number" min="0" max={group.restUnit === "minutes" ? 60 : 3600} step={group.restUnit === "minutes" ? "any" : 1} value={displayedRest(group)} onChange={(event) => setGroups((current) => current.map((entry, index) => index === groupIndex ? { ...entry, restSeconds: event.target.value === "" ? "" : Math.round(Number(event.target.value) * (entry.restUnit === "minutes" ? 60 : 1)) } : entry))} className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" placeholder="--" /><SelectMenu value={group.restUnit ?? "seconds"} onChange={(value) => setGroups((current) => current.map((entry, index) => index === groupIndex ? { ...entry, restUnit: value as RestUnit } : entry))} options={restUnitOptions} className="w-36" /></div></div><textarea aria-label="Observações da série" value={group.notes ?? ""} maxLength={1000} rows={3} onChange={(event) => setGroups((current) => current.map((entry, index) => index === groupIndex ? { ...entry, notes: event.target.value } : entry))} placeholder="Observações da série" className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" /></div></div>)}</div></section>
      <input type="hidden" name="groups" value={JSON.stringify(payload)} /><FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} /><div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur"><div className="mx-auto grid max-w-3xl grid-cols-2 gap-3"><button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="m8 5 11 7-11 7V5Z" /></svg>Visualizar</button><button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Salvando..." : workout ? "Salvar alterações" : "Salvar treino"}</button></div></div>
    </>}
    {step === 2 ? <><input type="hidden" name="name" value={fields.name} /><input type="hidden" name="description" value={fields.description} /></> : null}
  </form>{previewOpen ? <div className="fixed inset-0 z-50 overflow-y-auto"><WorkoutPlayer preview workoutId="preview" name={fields.name || "Prévia do treino"} steps={payload.flatMap((group) => group.exercises.map((item) => { const exercise = exercises.find((entry) => entry.id === item.exerciseId); return { ...item, load: item.load === undefined ? null : String(item.load), id: item.id ?? `${group.type}-${item.exerciseId}`, name: exercise?.name ?? "Exercício", description: exercise?.description ?? null, type: group.type, groupId: group.id ?? group.type, restSeconds: group.restSeconds, notes: group.notes?.trim() || null }; }))} onClose={() => setPreviewOpen(false)} /></div> : null}</>;
}
