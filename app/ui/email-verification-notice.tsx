"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmail } from "@/app/auth-actions";

export function EmailVerificationNotice() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <aside className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><p className="font-semibold">Confirmação de e-mail pendente</p><p className="mt-1">Você pode usar o aplicativo normalmente. Confirme seu e-mail para manter sua conta atualizada.</p><button type="button" disabled={pending} onClick={() => startTransition(async () => { try { const result = await resendVerificationEmail(); setMessage(result.message); } catch { setMessage("Não foi possível enviar o link. Tente novamente."); } })} className="mt-2 font-semibold underline disabled:opacity-50">{pending ? "Enviando..." : "Enviar link de confirmação"}</button>{message ? <p role="status" className="mt-2">{message}</p> : null}</aside>;
}
