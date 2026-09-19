"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";
import { selectStudentPlan } from "./actions";

const plans = [
  { id: "free", name: "Free", period: "Válido por 15 dias", price: "Grátis", monthlyCents: 0, description: "Experimente gratuitamente durante 15 dias." },
  { id: "monthly", name: "Mensal", period: "por mês", price: "R$ 59,90", monthlyCents: 5990, description: "Uma opção para começar sua rotina." },
  { id: "quarterly", name: "Trimestral", period: "por mês · plano de 3 meses", price: "R$ 49,90", monthlyCents: 4990, description: "Um período para manter a consistência." },
  { id: "semiannual", name: "Semestral", period: "por mês · plano de 6 meses", price: "R$ 39,90", monthlyCents: 3990, description: "Seis meses para evoluir no seu ritmo." },
  { id: "yearly", name: "Anual", period: "por mês · plano de 12 meses", price: "R$ 29,90", monthlyCents: 2990, description: "Um compromisso com seus objetivos ao longo do ano." },
];

export function PlanPicker({ initialPlanId }: { initialPlanId: string }) {
  const [selectedId, setSelectedId] = useState(initialPlanId);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const saving = useRef(false);
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const candidate = plans.find((plan) => plan.id === candidateId);
  useEffect(() => {
    if (candidateId) dialog.current?.showModal();
    else dialog.current?.close();
  }, [candidateId]);
  function cancelSelection() {
    if (saving.current) return;
    setCandidateId(null);
    setError("");
  }
  function choosePlan(planId: string) {
    if (saving.current) return;
    saving.current = true;
    setError("");
    startTransition(async () => {
      try {
        const result = await selectStudentPlan(planId);
        if (result.ok) { setSelectedId(planId); setCandidateId(null); router.push("/dashboard"); router.refresh(); }
        else { setError(result.message); }
      } catch {
        setError("Não foi possível salvar seu plano. Tente novamente.");
      } finally { saving.current = false; }
    });
  }
  const selected = plans.find((plan) => plan.id === selectedId);

  return <div>
    <p className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-500">Experimente o Free por 15 dias ou escolha um plano a partir de R$ 29,90 por mês. Escolha um plano para continuar. A seleção não realiza cobrança.</p>
    <fieldset disabled={pending} aria-busy={pending} className="min-w-0 disabled:opacity-70">
      <legend className="sr-only">Escolha a duração do plano</legend>
      <div className="grid auto-cols-[minmax(210px,1fr)] grid-flow-col gap-4 overflow-x-auto p-1 pb-4">
        {plans.map((plan) => {
          const isSelected = selectedId === plan.id;
          const discount = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format((1 - plan.monthlyCents / 10000) * 100);
          return <label key={plan.id} className="relative flex min-w-0 cursor-pointer">
            <input type="radio" name="plan" value={plan.id} checked={isSelected} onChange={() => { setError(""); setCandidateId(plan.id); }} className="peer sr-only" />
            <span className={`flex w-full flex-col rounded-2xl border-2 p-6 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-slate-950 ${isSelected ? "border-slate-950 bg-slate-950 text-white shadow-lg" : "border-slate-200 bg-white text-slate-950 hover:border-slate-400"}`}>
              <span className="flex items-center justify-between gap-3"><span className="text-lg font-semibold">{plan.name}</span><span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-white bg-white text-slate-950" : "border-slate-300"}`}>{isSelected ? "✓" : ""}</span></span>
              <span className={`mt-4 self-start rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"}`}>{plan.id === "free" ? "100% grátis · 15 dias" : `${discount}% de desconto`}</span>
              <span className={`mt-2 min-h-16 text-sm ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{plan.description}</span>
              <span className="mt-8 text-3xl font-semibold tracking-tight">{plan.price}</span>
              <span className={`mt-2 text-sm ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{plan.period}</span>
              <span className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold ${isSelected ? "bg-white text-slate-950" : "bg-slate-100 text-slate-700"}`}>{isSelected ? pending ? "Salvando..." : "Selecionado" : "Escolher plano"}</span>
            </span>
          </label>;
        })}
      </div>
    </fieldset>
    <p className="mt-2 text-xs text-slate-500">Descontos calculados sobre o preço de referência de R$ 100,00 por mês. O Free é gratuito por 15 dias.</p>
    <section aria-live="polite" className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-sm font-semibold">{selected ? `Plano ${selected.name.toLowerCase()} selecionado` : "Selecione uma opção acima"}</h2><p className="mt-1 text-sm text-slate-500">{selected ? "Seu plano fica vinculado à sua conta. Você pode escolher outra opção." : "Compare as durações para escolher a que combina com você."}</p></div>
      <span className="shrink-0 self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 sm:self-auto">{pending ? "Salvando..." : "Sem cobrança nesta etapa"}</span>
    </section>
    <dialog ref={dialog} aria-labelledby="plan-confirm-title" aria-describedby="plan-confirm-description" onCancel={(event) => { event.preventDefault(); cancelSelection(); }} onClick={(event) => { if (event.target === event.currentTarget) cancelSelection(); }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm">
      {candidate ? <div className="p-6 sm:p-8">
        <h2 id="plan-confirm-title" className="text-xl font-semibold">Confirmar escolha do plano</h2>
        <p id="plan-confirm-description" className="mt-2 text-sm leading-6 text-slate-500">{selected ? `Deseja trocar o plano ${selected.name} pelo ${candidate.name}?` : `Deseja escolher o plano ${candidate.name}?`}</p>
        <div className="my-6 rounded-xl bg-slate-50 p-5"><p className="font-semibold">{candidate.name}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{candidate.price}</p><p className="mt-1 text-sm text-slate-500">{candidate.period}</p></div>
        <p className="text-sm text-slate-500">A confirmação salva o plano na sua conta. Nenhuma cobrança será realizada nesta etapa.</p>
        {error ? <p role="alert" className="mt-4 text-sm text-red-600">{error}</p> : null}
        <div className="mt-6 flex gap-3"><button type="button" autoFocus disabled={pending} onClick={cancelSelection} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Cancelar</button><button type="button" disabled={pending} onClick={() => choosePlan(candidate.id)} className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{pending ? "Salvando..." : "Confirmar"}</button></div>
      </div> : null}
    </dialog>
  </div>;
}
