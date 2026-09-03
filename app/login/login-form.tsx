"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/app/auth-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: AuthFormState = { message: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signIn,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4" autoComplete="off">
      <div>
        <label htmlFor="email" className="sr-only">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="off"
          required
          placeholder="E-mail"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
      </div>

      <div>
        <label htmlFor="password" className="sr-only">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="off"
          required
          placeholder="Senha"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
      </div>

      <FormToast message={state.message} />

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
