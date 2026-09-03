import Link from "next/link";
import { ComingSoonButton } from "./coming-soon-button";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-slate-950 sm:px-8">
      <section className="w-full max-w-sm px-1 py-6 sm:px-4 sm:py-8">
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
          <span className="text-xs text-slate-400">ou escolha uma opção</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="flex items-start justify-center gap-3 sm:gap-5">
          <ComingSoonButton provider="Google">
            <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-slate-200">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-6 opacity-70"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10.1 10.1 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6a5.5 5.5 0 0 1 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10.1 10.1 0 0 0-8.9 5.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"
                />
              </svg>
            </span>
            <span>Google</span>
          </ComingSoonButton>

          <ComingSoonButton provider="Apple">
            <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-slate-200">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6 opacity-70"
              >
                <path d="M17.1 12.5c0-2.5 2.1-3.7 2.2-3.8a4.7 4.7 0 0 0-3.7-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.8A4.9 4.9 0 0 0 4.2 9c-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5a11.2 11.2 0 0 0 1.4-2.9 4.5 4.5 0 0 1-2.9-3.9ZM14.6 5.1A4.6 4.6 0 0 0 15.7 2a4.7 4.7 0 0 0-3 1.5 4.3 4.3 0 0 0-1.1 3c1.1.1 2.2-.5 3-1.4Z" />
              </svg>
            </span>
            <span>Apple</span>
          </ComingSoonButton>

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
