import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-slate-950 sm:px-8">
      <section className="w-full max-w-sm px-1 py-10 sm:px-4 sm:py-12">
        <header className="mb-8 text-center">
          <p className="text-4xl font-normal leading-none tracking-tight">
            just<strong className="font-bold">OneMore</strong>
          </p>
          <div
            aria-hidden="true"
            className="mx-auto my-4 h-px w-12 bg-slate-300"
          />
          <p className="text-sm leading-5 text-slate-400">
            Entre para continuar seu treino.
          </p>
        </header>

        <LoginForm />

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">ou</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/cadastro"
            className="group flex w-20 flex-col items-center gap-2 rounded-lg text-xs font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-slate-200">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0M19.5 8.25v4.5m2.25-2.25h-4.5"
                />
              </svg>
            </span>
            <span>Cadastre-se</span>
          </Link>
        </div>

        <Link
          href="/"
          className="mx-auto mt-7 block w-fit rounded text-xs font-normal text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
        >
          Voltar para o início
        </Link>
      </section>
    </main>
  );
}
