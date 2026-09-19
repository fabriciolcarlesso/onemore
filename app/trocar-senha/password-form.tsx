"use client";

import { useActionState } from "react";
import { signOut, updatePassword } from "@/app/auth-actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, { message: "" });
  const inputClass = "mt-1 h-12 w-full rounded-xl border border-slate-300 px-3";
  return <><form action={action} className="mt-6 space-y-4"><label className="block text-sm font-medium">PIN provisório<input name="currentPassword" type="password" inputMode="numeric" autoComplete="current-password" required className={inputClass} /></label><label className="block text-sm font-medium">Nova senha<input name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={inputClass} /></label><label className="block text-sm font-medium">Confirme a nova senha<input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className={inputClass} /></label>{state.message ? <p role="alert" className="text-sm text-red-600">{state.message}</p> : null}<button disabled={pending} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Salvando..." : "Salvar e continuar"}</button></form><form action={signOut}><button className="mt-4 w-full text-sm text-slate-500">Sair</button></form></>;
}
