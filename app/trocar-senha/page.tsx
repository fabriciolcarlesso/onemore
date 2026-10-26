import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PasswordForm } from "./password-form";

export default async function ChangeTemporaryPasswordPage() {
  const user = await getCurrentUser({ allowTemporaryPassword: true });
  if (!user) redirect("/login");
  if (!user.mustChangePassword) redirect("/dashboard");
  return <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-5 py-8"><section className="w-full max-w-md rounded-2xl bg-white p-6"><span className="mb-3 block h-1 w-[30px] rounded-full bg-slate-950" aria-hidden="true" /><h1 className="text-2xl font-semibold">Crie sua nova senha</h1><PasswordForm /></section></main>;
}
