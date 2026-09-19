"use client";

import { useState } from "react";

export function WorkoutCalendar({ days, today }: { days: string[]; today: string }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const offset = firstDay.getUTCDay();
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const trainedDays = new Set(days);
  const monthDays = [...trainedDays].filter((day) => day.startsWith(month)).length;
  function changeMonth(delta: number) {
    setMonth(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7));
  }

  return <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
    <h2 className="text-sm font-semibold text-slate-950">Treinos concluídos</h2>
    <div className="mt-4 flex items-center justify-between gap-2"><button type="button" aria-label="Mês anterior" onClick={() => changeMonth(-1)} className="flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">←</button><p aria-live="polite" className="text-sm font-semibold capitalize">{new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(firstDay)}</p><button type="button" aria-label="Próximo mês" disabled={month >= today.slice(0, 7)} onClick={() => changeMonth(1)} className="flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-25">→</button></div>
    <div className="mt-3 grid grid-cols-7 gap-y-2 text-center">
      {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => <span key={index} className="pb-1 text-xs font-medium text-slate-400">{day}</span>)}
      {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
      {Array.from({ length: count }, (_, index) => {
        const number = index + 1;
        const date = `${month}-${String(number).padStart(2, "0")}`;
        const trained = trainedDays.has(date);
        return <time key={date} dateTime={date} aria-current={date === today ? "date" : undefined} aria-label={`${number}/${monthNumber}/${year}${trained ? ", treino concluído" : ""}`} title={trained ? "Treino concluído" : undefined} className={`mx-auto flex size-8 items-center justify-center rounded-full text-sm ${trained ? "bg-slate-950 font-semibold text-white" : date === today ? "ring-1 ring-slate-300 text-slate-950" : "text-slate-500"}`}>{number}</time>;
      })}
    </div>
    <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><span className="size-2.5 rounded-full bg-slate-950" />{monthDays ? `${monthDays} ${monthDays === 1 ? "dia de treino" : "dias de treino"} neste mês` : "Nenhum treino concluído neste mês"}</p>
  </article>;
}
