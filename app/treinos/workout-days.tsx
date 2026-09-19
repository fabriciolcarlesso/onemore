import { weekdays } from "@/lib/weekdays";

export function WorkoutDays({ days }: { days: string[] }) {
  if (!days.length) return null;
  return <div aria-label="Dias do treino" className="mt-3 flex flex-wrap gap-2">{weekdays.filter((day) => days.includes(day.value)).map((day) => <span key={day.value} className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-white">{day.label}</span>)}</div>;
}
