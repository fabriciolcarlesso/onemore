import Link from "next/link";
import { verifyEmailToken } from "@/app/auth-actions";

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailToken(token) : false;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-10 text-center text-slate-950">
      <section className="w-full max-w-sm">
        <p className="text-4xl font-normal leading-none tracking-tight">
          just<strong className="font-bold">OneMore</strong>
        </p>
        <div aria-hidden="true" className="mx-auto my-5 h-px w-12 bg-slate-300" />
        <h1 className="text-xl font-semibold">
          {verified ? "E-mail confirmado" : "Link inválido ou expirado"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {verified
            ? "Sua conta está pronta. Agora você já pode entrar."
            : "Solicite um novo link de confirmação para continuar."}
        </p>
        <Link
          href={verified ? "/login" : "/cadastro"}
          className="mx-auto mt-7 block w-fit rounded text-sm font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
        >
          {verified ? "Entrar" : "Voltar ao cadastro"}
        </Link>
      </section>
    </main>
  );
}
