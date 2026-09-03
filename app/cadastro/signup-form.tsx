"use client";

import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/app/auth-actions";

const initialState: AuthFormState = { message: "" };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(
    signUp,
    initialState,
  );

  const inputClassName =
    "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";

  return (
    <form action={formAction} className="space-y-4" autoComplete="off">
      <div>
        <label htmlFor="name" className="sr-only">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          required
          minLength={2}
          maxLength={120}
          placeholder="Nome"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="signup-email" className="sr-only">
          E-mail
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="off"
          required
          maxLength={255}
          placeholder="E-mail"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="signup-password" className="sr-only">
          Senha
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          placeholder="Senha"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="password-confirmation" className="sr-only">
          Confirme sua senha
        </label>
        <input
          id="password-confirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          placeholder="Confirme sua senha"
          className={inputClassName}
        />
      </div>

      {state.message ? (
        <p aria-live="polite" className="text-center text-sm text-red-600">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:opacity-60"
      >
        {pending ? "Criando conta..." : "Criar conta"}
      </button>
    </form>
  );
}
