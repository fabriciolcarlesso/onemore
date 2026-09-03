import Link from "next/link";

export default function CadastroSucessoPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-center text-slate-950">
      <section className="w-full max-w-sm">
        <p className="text-4xl font-normal leading-none tracking-tight">
          One<strong className="font-bold">More</strong>
        </p>
        <div aria-hidden="true" className="mx-auto my-5 h-px w-12 bg-slate-300" />
        <h1 className="text-xl font-semibold">Confira seu e-mail</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enviamos um link de confirmação. Depois de confirmar seu endereço,
          você poderá entrar na sua conta.
        </p>
        <Link
          href="/login"
          className="mx-auto mt-7 block w-fit rounded text-sm font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
        >
          Ir para o login
        </Link>
      </section>
    </main>
  );
}
