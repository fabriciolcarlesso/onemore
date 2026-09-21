"use client";

import Link from "next/link";
import { EmailVerificationNotice } from "@/app/ui/email-verification-notice";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeWorkout } from "@/app/workout-actions";
import { ExerciseInfo } from "./exercise-info";
import { LoadPicker } from "./load-picker";

type Step = {
  id: string;
  name: string;
  description: string | null;
  sets: number;
  repetitions: number;
  restSeconds: number | null;
  notes: string | null;
  load: string | null;
  type: "single" | "bi_set" | "tri_set" | "combined";
  groupId: string;
};

export function WorkoutPlayer({ workoutId, name, steps, gender = "masculino", emailPending = false, preview = false, onClose, backHref = "/treinos" }: { emailPending?: boolean; workoutId: string; name: string; steps: Step[]; gender?: "masculino" | "feminino"; preview?: boolean; onClose?: () => void; backHref?: string }) {
  const router = useRouter();
  const [finishing, startFinishing] = useTransition();
  const [finishError, setFinishError] = useState("");
  const finishLock = useRef(false);
  function finish() {
    if (finishLock.current) return;
    finishLock.current = true;
    setFinishError("");
    startFinishing(async () => {
      try {
        const result = await completeWorkout(workoutId);
        if (result.ok) router.push("/dashboard");
        else setFinishError(result.message);
      } catch { setFinishError("Não foi possível finalizar o treino. Tente novamente."); }
      finally { finishLock.current = false; }
    });
  }
  const groups = Array.from(new Set(steps.map((step) => step.groupId))).map((id) => ({
    id,
    exercises: steps.filter((step) => step.groupId === id),
  }));

  return <main className="min-h-dvh bg-slate-50 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-slate-950">
    <div className="mx-auto w-full max-w-2xl">
      <header className="mb-4">{preview ? <button type="button" onClick={onClose} className="inline-block py-2 text-sm text-slate-500">← Fechar prévia</button> : <Link href={backHref} className="inline-block py-2 text-sm text-slate-500">← Voltar</Link>}<h1 className="mt-2 text-2xl font-semibold tracking-tight">{name}</h1></header>
      {emailPending ? <EmailVerificationNotice /> : null}
      {groups.length ? <div className="space-y-3">{groups.map((group) => <section key={group.id} aria-label={group.exercises.length > 1 ? "Exercícios combinados" : "Série com um exercício"} className="overflow-hidden rounded-xl border border-slate-300 bg-white py-1">
        <div className="mx-4 divide-y divide-slate-100">{group.exercises.map((exercise) => <div key={exercise.id} className="grid grid-cols-[minmax(0,1fr)_32px_32px_auto] items-start gap-2 py-2">
          <h3 className="min-w-0"><ExerciseInfo name={exercise.name} description={exercise.description} gender={gender} /></h3>
          <div className="text-center"><p className="text-[10px] leading-4 text-slate-400">Séries</p><p className="flex h-8 items-center justify-center text-sm font-semibold tabular-nums">{exercise.sets}</p></div>
          <div className="text-center"><p className="text-[10px] leading-4 text-slate-400">Reps</p><p className="flex h-8 items-center justify-center text-sm font-semibold tabular-nums">{exercise.repetitions}</p></div>
            <div><p className="text-center text-[10px] leading-4 text-slate-400">Carga</p>{preview ? <p className="flex h-8 items-center justify-center text-sm font-semibold">{exercise.load ? `${exercise.load} kg` : "--"}</p> : <LoadPicker workoutExerciseId={exercise.id} exerciseName={exercise.name} initialLoad={exercise.load} />}</div>
        </div>)}</div>
        <p className="px-4 pt-1 pb-3 text-xs text-slate-500">Intervalo entre séries: <strong className="font-semibold text-slate-950">{group.exercises[0].restSeconds === null ? "--" : `${group.exercises[0].restSeconds}s`}</strong></p>
        {group.exercises[0].notes ? <p className="mx-4 mb-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600"><strong className="text-slate-950">Observações:</strong> {group.exercises[0].notes}</p> : null}
      </section>)}</div> : <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Nenhum exercício neste treino.</p>}
      {finishError ? <p role="alert" className="mt-4 text-sm text-red-600">{finishError}</p> : null}
      {!preview && steps.length ? <button type="button" disabled={finishing} onClick={finish} className="mt-4 h-12 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white disabled:opacity-60">{finishing ? "Salvando..." : "Finalizar treino"}</button> : null}
    </div>
  </main>;
}
