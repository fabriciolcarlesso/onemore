import Link from "next/link";

export default function Home() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-white px-6 py-10 text-slate-950 sm:px-10">
      <section className="flex max-w-full flex-col items-center gap-5 text-center sm:grid sm:w-full sm:max-w-xl sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-0 sm:text-left">
        <h1 className="text-4xl font-normal leading-none tracking-tight sm:justify-self-end sm:pr-7">
          One<strong className="font-bold">More</strong>
        </h1>

        <div
          aria-hidden="true"
          className="h-px w-16 bg-slate-300 sm:h-14 sm:w-px"
        />

        <p className="translate-y-1 text-base font-normal leading-none sm:justify-self-start sm:pl-7">
          Simplificando seu treino
        </p>
      </section>

      <Link
        href="/login"
        aria-label="Ir para a tela de login"
        className="group absolute bottom-[18dvh] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 rounded-lg text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 sm:bottom-[16dvh]"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-slate-200">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="size-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 9l3 3m0 0-3 3m3-3H9"
            />
          </svg>
        </span>
        <span>Entrar</span>
      </Link>
    </main>
  );
}
