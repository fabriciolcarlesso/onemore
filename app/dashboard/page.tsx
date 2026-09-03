import { requireUser } from "@/lib/auth/session";
import { signOut } from "@/app/auth-actions";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-slate-950">
      <section className="w-full max-w-lg text-center">
        <p className="text-4xl font-normal leading-none tracking-tight">
          One<strong className="font-bold">More</strong>
        </p>
        <div aria-hidden="true" className="mx-auto my-5 h-px w-12 bg-slate-300" />
        <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>
        <p className="mt-2 text-sm text-slate-400">{user.email}</p>
        <p className="mt-6 text-sm leading-6 text-slate-500">
          Sua área de treinos está pronta para receber as próximas funcionalidades.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-8 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          >
            Sair
          </button>
        </form>
      </section>
    </main>
  );
}
