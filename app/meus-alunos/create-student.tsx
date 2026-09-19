"use client";

import { useActionState, useRef, useState } from "react";
import { createStudent, type CreateStudentState } from "./actions";

const initial: CreateStudentState = { message: "" };

function StudentForm({ close }: { close: () => void }) {
  const [state, action, pending] = useActionState(createStudent, initial);
  return <form action={action} className="space-y-4">
    <h2 id="create-student-title" className="text-xl font-semibold">Cadastrar aluno</h2>
    {state.pin ? <><p className="text-sm text-slate-600">{state.message}</p><p className="break-all text-sm">Login: <strong>{state.email}</strong></p><div className="rounded-xl bg-slate-100 p-5 text-center"><p className="text-xs text-slate-500">PIN provisório de acesso</p><p className="mt-2 text-3xl font-semibold tracking-[0.25em]">{state.pin}</p></div><p className="text-sm text-slate-500">Anote e entregue este PIN ao aluno. Ele precisará definir uma nova senha no primeiro acesso. O plano Free já está escolhido, válido por 15 dias.</p></> : <><p className="text-sm text-slate-500">O aluno será vinculado a você e receberá o plano Free por 15 dias.</p><label className="block text-sm font-medium">Nome<input name="name" required minLength={2} maxLength={120} autoComplete="name" className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3" /></label><label className="block text-sm font-medium">E-mail<input name="email" type="email" required maxLength={255} autoComplete="email" className="mt-1 h-12 w-full rounded-xl border border-slate-300 px-3" /></label>{state.message ? <p role="alert" className="text-sm text-red-600">{state.message}</p> : null}</>}
    <div className="flex gap-3"><button type="button" disabled={pending} onClick={close} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">{state.pin ? "Concluir" : "Cancelar"}</button>{!state.pin ? <button disabled={pending} className="flex-1 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Cadastrando..." : "Cadastrar"}</button> : null}</div>
  </form>;
}

export function CreateStudent() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [version, setVersion] = useState(0);
  return <><button type="button" onClick={() => { setVersion((value) => value + 1); dialog.current?.showModal(); }} className="mb-6 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">+ Cadastrar aluno</button><dialog ref={dialog} aria-labelledby="create-student-title" onCancel={(event) => event.preventDefault()} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-auto rounded-2xl bg-white p-6 text-slate-950 backdrop:bg-slate-950/40"><StudentForm key={version} close={() => { dialog.current?.close(); setVersion((value) => value + 1); }} /></dialog></>;
}
