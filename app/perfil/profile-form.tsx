"use client";

import { useActionState } from "react";
import { updateProfile, type AuthFormState } from "@/app/auth-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: AuthFormState = { message: "" };

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  return <form action={formAction} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8" noValidate autoComplete="off"><h2 className="text-lg font-semibold">Dados pessoais</h2><p className="mt-1 text-sm text-slate-500">Atualize as informações da sua conta.</p><div className="mt-6 space-y-4"><div><label htmlFor="profile-name" className="mb-2 block text-sm font-medium text-slate-700">Nome</label><input id="profile-name" name="name" type="text" defaultValue={name} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10" /></div><div><label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-slate-700">E-mail</label><input id="profile-email" type="email" value={email} readOnly className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-500 outline-none" /></div></div><FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} /><button type="submit" disabled={pending} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : "Salvar alterações"}</button></form>;
}
