"use client";

import { useActionState, useEffect, useState } from "react";
import { createWorkout, updateWorkout, type WorkoutFormState } from "@/app/workout-actions";
import { FormToast } from "@/app/ui/form-toast";
import { WorkoutPlayer } from "./workout-player";
import { WorkoutGroupEditor, type Exercise, type Group, type Item, type RestUnit } from "./workout-group-editor";

type MuscleGroup = { id: string; name: string };
export type WorkoutData = { id: string; name: string; description: string | null; groups: Group[] };
const initialState: WorkoutFormState = { message: "" };
const emptyItem = (): Item => ({ exerciseId: "", sets: 0, repetitions: 0, load: "" });

function initialRestUnit(restSeconds: Group["restSeconds"]): RestUnit {
  const seconds = Number(restSeconds);
  return seconds >= 60 && seconds % 60 === 0 ? "minutes" : "seconds";
}

export function WorkoutBuilder({ exercises, muscleGroups, workout, sheetId }: { exercises: Exercise[]; muscleGroups: MuscleGroup[]; workout?: WorkoutData; sheetId?: string }) {
  const [state, action, pending] = useActionState(workout ? updateWorkout : createWorkout, initialState);
  const [step, setStep] = useState(1);
  const [seriesStep, setSeriesStep] = useState(false);
  const [fields, setFields] = useState({ name: workout?.name ?? "", description: workout?.description ?? "" });
  const [groups, setGroups] = useState<Group[]>(workout?.groups.map((group) => ({ ...group, restUnit: initialRestUnit(group.restSeconds) })) ?? [{ muscleGroupId: null, restSeconds: null, restUnit: "seconds", notes: "", exercises: [emptyItem()] }]);
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
  const payload = groups.filter((group) => group.exercises.some((item) => item.exerciseId)).map((group) => ({ ...group, type: group.exercises.length > 1 ? "combined" as const : "single" as const, restSeconds: group.restSeconds === "" || group.restSeconds == null ? null : Number(group.restSeconds), exercises: group.exercises.map((item) => ({ ...item, load: item.load ? Number(item.load) : undefined })) }));
  const canAdvance = fields.name.trim().length > 0;
  const visibleGroups = seriesStep ? [{ group: groups[groups.length - 1], index: groups.length - 1 }] : groups.map((group, index) => ({ group, index }));
  return <><div className="mb-8"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{seriesStep ? "Novo exercício" : step === 2 ? (fields.name || "Novo treino") : workout ? "Editar treino" : "Novo treino"}</h1><p className="mt-1 text-sm text-slate-500">{step === 2 ? "Adicione os exercícios do treino." : "Monte e organize seus treinos."}</p></div><form action={action} className={`max-w-3xl space-y-8 ${step === 2 ? "pb-28" : ""}`} noValidate>
    {workout ? <input type="hidden" name="workoutId" value={workout.id} /> : null}
    {sheetId ? <input type="hidden" name="sheetId" value={sheetId} /> : null}
    {!sheetId ? <div className="flex flex-wrap items-center gap-3"><div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-400">{step === 2 ? <><button type="button" onClick={() => setSeriesStep(false)} className="text-slate-500 hover:text-slate-950">Exercícios</button><span>→</span><span className="text-slate-950">Exercício {seriesStep ? groups.length : 1}</span></> : <><span className="text-slate-950">Dados</span><span className="h-px w-8 bg-slate-200" /><span>Exercícios</span></>}</div></div> : null}
    {step === 1 ? <section className="space-y-5"><div><h2 className="text-lg font-semibold">Dados do treino</h2><p className="mt-1 text-sm text-slate-500">Dê um nome ao treino e, se quiser, inclua uma descrição.</p></div><input name="name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="Nome do treino" required className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" /><textarea name="description" value={fields.description} onChange={(event) => setFields({ ...fields, description: event.target.value })} rows={4} maxLength={1000} placeholder="Descrição (opcional)" className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" /><button type="button" onClick={() => { if (canAdvance) setStep(2); }} className="w-full rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={!canAdvance}>Inserir exercícios</button></section> : <>
      <section><div className="mt-6 space-y-5">{visibleGroups.map(({ group, index: groupIndex }) => <WorkoutGroupEditor key={group.id ?? groupIndex} group={group} index={groupIndex} exercises={exercises} onItemChange={(itemIndex, field, value) => updateItem(groupIndex, itemIndex, field, value)} onAddExercise={() => setGroups((current) => current.map((entry, index) => index === groupIndex ? { ...entry, exercises: [...entry.exercises, emptyItem()] } : entry))} onRemoveExercise={(itemIndex) => setGroups((current) => current.map((entry, index) => index === groupIndex ? { ...entry, exercises: entry.exercises.filter((_, position) => position !== itemIndex) } : entry))} onAddSeries={() => { setGroups((current) => [...current, { muscleGroupId: null, restSeconds: null, restUnit: "seconds", notes: "", exercises: [emptyItem()] }]); setSeriesStep(true); }} onIntervalChange={(seconds, unit) => setGroups((current) => current.map((entry, index) => index === groupIndex ? { ...entry, restSeconds: seconds, restUnit: unit } : entry))} onNotesChange={(value) => setGroups((current) => current.map((entry, index) => index === groupIndex ? { ...entry, notes: value } : entry))} />)}</div></section>
      <input type="hidden" name="groups" value={JSON.stringify(payload)} /><FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} /><div className="fixed inset-x-0 -bottom-8 z-30 bg-white px-4 pt-4 pb-[calc(2.75rem+env(safe-area-inset-bottom))]"><div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-full h-12 bg-linear-to-b from-transparent to-white" /><div className="mx-auto grid max-w-3xl grid-cols-2 gap-3"><button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="m8 5 11 7-11 7V5Z" /></svg>Visualizar</button><button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Salvando..." : "Salvar"}</button></div></div>
    </>}
    {step === 2 ? <><input type="hidden" name="name" value={fields.name} /><input type="hidden" name="description" value={fields.description} /></> : null}
  </form>{previewOpen ? <div className="fixed inset-0 z-50 overflow-y-auto"><WorkoutPlayer preview workoutId="preview" name={fields.name || "Prévia do treino"} steps={payload.flatMap((group, groupIndex) => group.exercises.filter((item) => item.exerciseId).map((item) => { const exercise = exercises.find((entry) => entry.id === item.exerciseId); return { ...item, load: item.load === undefined ? null : String(item.load), id: item.id ?? `${groupIndex}-${item.exerciseId}`, name: exercise?.name ?? "Exercício", description: exercise?.description ?? null, type: group.type, groupId: group.id ?? String(groupIndex), restSeconds: group.restSeconds, notes: group.notes?.trim() || null }; }))} onClose={() => setPreviewOpen(false)} /></div> : null}</>;
}
