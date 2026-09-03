import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-slate-950 sm:px-8">
      <section className="w-full max-w-sm px-1 py-6 sm:px-4 sm:py-8">
        <header className="mb-8 text-center">
          <p className="text-4xl font-normal leading-none tracking-tight">
            One<strong className="font-bold">More</strong>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Acesse sua conta
          </h1>
          <p className="mt-2 text-sm leading-5 text-slate-400">
            Entre para continuar seu treino.
          </p>
        </header>

        <form className="space-y-4" autoComplete="off">
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
              autoComplete="new-password"
              required
              placeholder="Senha"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          >
            Entrar
          </button>
        </form>

        <Link
          href="/"
          className="mx-auto mt-6 block w-fit rounded text-base font-bold text-slate-500 transition-colors hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
        >
          Voltar para o início
        </Link>
      </section>
    </main>
  );
}
