import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function CadastroPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-slate-950 sm:px-8">
      <section className="w-full max-w-sm px-1 py-6 sm:px-4 sm:py-8">
        <header className="mb-8 text-center">
          <p className="text-4xl font-normal leading-none tracking-tight">
            One<strong className="font-bold">More</strong>
          </p>
          <div
            aria-hidden="true"
            className="mx-auto my-4 h-px w-12 bg-slate-300"
          />
          <p className="text-sm leading-5 text-slate-400">
            Comece agora sua jornada de treinos.
          </p>
        </header>

        <SignupForm />

        <p className="mt-6 text-center text-sm text-slate-500">
          Já possui uma conta?{" "}
          <Link
            href="/login"
            className="rounded font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
          >
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
