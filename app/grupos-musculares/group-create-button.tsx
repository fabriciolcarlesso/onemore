"use client";

import { useState } from "react";
import { createMuscleGroup } from "./actions";
import { useEscape } from "@/app/ui/use-escape";

export function GroupCreateButton() {
  const [open, setOpen] = useState(false);
  useEscape(() => setOpen(false), open);
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Adicionar grupo muscular" title="Adicionar grupo muscular" className="fixed right-8 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-30 flex size-16 items-center justify-center rounded-full bg-slate-950 text-4xl font-light leading-none text-white shadow-[0_5px_14px_rgba(15,23,42,0.28)] transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 sm:right-10 sm:bottom-auto sm:top-52 xl:right-12"><span aria-hidden="true">+</span></button>
    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Adicionar grupo muscular"><button type="button" aria-label="Fechar" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm" /><form action={async (formData) => { await createMuscleGroup(formData); setOpen(false); }} className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-semibold text-slate-950">Novo grupo muscular</h2><label className="mt-5 block text-sm font-medium text-slate-700">Nome<input required name="name" placeholder="Ex.: Peitoral maior" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" /></label><label className="mt-4 block text-sm font-medium text-slate-700">Descrição<textarea required name="description" rows={4} placeholder="Descreva esse grupo muscular" className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-950" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancelar</button><button type="submit" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Cadastrar</button></div></form></div> : null}
  </>;
}
