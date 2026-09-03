"use client";

import { useActionState } from "react";
import { updatePassword, updateProfile, type AuthFormState } from "@/app/auth-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: AuthFormState = { message: "" };

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, initialState);
  const inputClass = "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";
  return <div className="max-w-xl space-y-10"><form action={formAction} noValidate autoComplete="off"><h2 className="text-lg font-semibold">Dados pessoais</h2><p className="mt-1 text-sm text-slate-500">Atualize as informações da sua conta.</p><div className="mt-6 space-y-4"><input id="profile-name" name="name" type="text" defaultValue={name} placeholder="Nome" className={inputClass} /><input id="profile-email" type="email" value={email} readOnly placeholder="E-mail" className={`${inputClass} text-slate-500`} /></div><FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} /><button type="submit" disabled={pending} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : "Salvar alterações"}</button></form><form action={passwordAction} noValidate autoComplete="off"><h2 className="text-lg font-semibold">Alterar senha</h2><p className="mt-1 text-sm text-slate-500">Escolha uma nova senha para sua conta.</p><div className="mt-6 space-y-4"><input id="current-password" name="currentPassword" type="password" placeholder="Senha atual" className={inputClass} /><input id="new-password" name="newPassword" type="password" placeholder="Nova senha" className={inputClass} /><input id="password-confirmation" name="passwordConfirmation" type="password" placeholder="Confirme a nova senha" className={inputClass} /></div><FormToast state={passwordState} variant={passwordState.message.includes("sucesso") ? "success" : "error"} /><button type="submit" disabled={passwordPending} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{passwordPending ? "Alterando..." : "Alterar senha"}</button></form></div>;
}
