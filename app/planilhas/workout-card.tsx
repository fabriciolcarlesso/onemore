"use client";

import Link from "next/link";
import { useState } from "react";
import { RichDescription } from "@/app/exercicios/rich-description";
import { WorkoutDays } from "@/app/treinos/workout-days";

type WorkoutCardData = { id: string; name: string; description: string | null; weekdays: string[] };

export function WorkoutCard({ workout }: { workout: WorkoutCardData }) {
  const [expanded, setExpanded] = useState(false);

  return <li className="relative flex flex-col rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm">
    <Link href={`/treinos/${workout.id}`} className="flex min-w-0 items-start p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">
      <div className="min-w-0 flex-1">
        <div className={`relative ${expanded ? "" : "max-h-6 overflow-hidden"}`}><h2 className={`font-semibold ${expanded ? "" : "line-clamp-1"}`}>{workout.name}</h2>{!expanded ? <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-r from-transparent to-white" /> : null}</div>
        <WorkoutDays days={workout.weekdays} />
        {workout.description ? <div className={`relative ${expanded ? "" : "max-h-12 overflow-hidden"}`}><RichDescription text={workout.description} className="mt-3 text-sm leading-6 text-slate-500" />{!expanded ? <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-linear-to-t from-white to-transparent" /> : null}</div> : <p className="mt-3 text-sm text-slate-400">Sem descrição.</p>}
      </div>
    </Link>
    <button type="button" aria-label={expanded ? "Recolher treino" : "Expandir treino"} title={expanded ? "Recolher" : "Expandir"} onClick={() => setExpanded((current) => !current)} className="flex h-8 items-center justify-center text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" /></svg></button>
  </li>;
}
