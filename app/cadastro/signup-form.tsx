"use client";

import { useActionState, useState } from "react";
import { signUp, type AuthFormState } from "@/app/auth-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: AuthFormState = { message: "" };

export function SignupForm() {
  const [fields, setFields] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [state, formAction, pending] = useActionState(
    signUp,
    initialState,
  );

  const inputClassName =
    "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";

  function updateField(field: keyof typeof fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={formAction} className="space-y-4" autoComplete="off" noValidate>
      <div>
        <label htmlFor="name" className="sr-only">
          Nome
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
          placeholder="Nome"
          value={fields.name}
          onChange={(event) => updateField("name", event.target.value)}
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
          placeholder="E-mail"
          value={fields.email}
          onChange={(event) => updateField("email", event.target.value)}
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
          placeholder="Senha"
          value={fields.password}
          onChange={(event) => updateField("password", event.target.value)}
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
          placeholder="Confirme sua senha"
          value={fields.passwordConfirmation}
          onChange={(event) =>
            updateField("passwordConfirmation", event.target.value)
          }
          className={inputClassName}
        />
      </div>

      <FormToast state={state} />

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
