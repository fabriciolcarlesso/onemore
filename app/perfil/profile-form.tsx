"use client";

import Image from "next/image";
import { useActionState, useRef, useState, useTransition } from "react";
import { updatePassword, updateProfile, updatePreferredTeacher, type AuthFormState } from "@/app/auth-actions";
import { FormToast } from "@/app/ui/form-toast";

const initialState: AuthFormState = { message: "" };
type Role = "admin" | "professor" | "aluno";

export function ProfileForm({ name, email, role, preferredTeacher, weight, height }: { name: string; email: string; role: Role; preferredTeacher: "romeu" | "julieta" | null; weight: string | null; height: number | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePassword, initialState);
  const [selectedTeacher, setSelectedTeacher] = useState<"romeu" | "julieta" | "">(preferredTeacher ?? "");
  const [teacherPending, startTeacherTransition] = useTransition();
  const [teacherStatus, setTeacherStatus] = useState({ ok: true, message: "" });
  const savingTeacher = useRef(false);

  function selectTeacher(teacher: "romeu" | "julieta") {
    if (savingTeacher.current || teacher === selectedTeacher) return;
    savingTeacher.current = true;
    const previous = selectedTeacher;
    setSelectedTeacher(teacher);
    setTeacherStatus({ ok: true, message: "" });
    startTeacherTransition(async () => {
      try {
        const result = await updatePreferredTeacher(teacher);
        setTeacherStatus(result);
        if (!result.ok) setSelectedTeacher(previous);
      } catch {
        setSelectedTeacher(previous);
        setTeacherStatus({ ok: false, message: "Não foi possível salvar o assistente. Tente novamente." });
      } finally {
        savingTeacher.current = false;
      }
    });
  }

  const inputClass = "h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";
  const layoutClass = role === "aluno" ? "grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]" : "grid max-w-5xl gap-10 md:grid-cols-2";

  return <div className={layoutClass}>
    <FormToast state={teacherStatus} variant={teacherStatus.ok ? "success" : "error"} />
    {role === "aluno" ? <div className="space-y-5 lg:pr-2"><div><h2 className="text-lg font-semibold">Selecione seu assistente</h2><p className="mt-1 text-sm text-slate-500">Toque na foto para escolher e salvar seu assistente.</p></div><div className="flex flex-wrap gap-3 lg:flex-col lg:gap-4"><button type="button" disabled={teacherPending} onClick={() => selectTeacher("romeu")} aria-pressed={selectedTeacher === "romeu"} className={`group flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4 ${selectedTeacher === "romeu" ? "border-slate-950 bg-slate-100 text-slate-950 shadow-md" : "border-transparent text-slate-500 opacity-60 hover:bg-slate-50 hover:opacity-90"}`}><span className={`relative size-24 overflow-hidden sm:size-32 rounded-full border-4 bg-slate-100 transition ${selectedTeacher === "romeu" ? "border-slate-950 ring-2 ring-slate-950 ring-offset-2" : "border-transparent group-hover:border-slate-300"}`}><Image src="/images/exercises/agachamento-livre-masculino-1.png" alt="Romeu" fill sizes="128px" className="object-cover" /></span><span>Romeu</span><span className={`inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white ${selectedTeacher === "romeu" ? "visible" : "invisible"}`}><span aria-hidden="true">✓</span> {teacherPending ? "Salvando..." : "Selecionado"}</span></button><button type="button" disabled={teacherPending} onClick={() => selectTeacher("julieta")} aria-pressed={selectedTeacher === "julieta"} className={`group flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4 ${selectedTeacher === "julieta" ? "border-slate-950 bg-slate-100 text-slate-950 shadow-md" : "border-transparent text-slate-500 opacity-60 hover:bg-slate-50 hover:opacity-90"}`}><span className={`relative size-24 overflow-hidden sm:size-32 rounded-full border-4 bg-slate-100 transition ${selectedTeacher === "julieta" ? "border-slate-950 ring-2 ring-slate-950 ring-offset-2" : "border-transparent group-hover:border-slate-300"}`}><Image src="/images/exercises/agachamento-livre-feminino-1.png" alt="Julieta" fill sizes="128px" className="object-cover" /></span><span>Julieta</span><span className={`inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white ${selectedTeacher === "julieta" ? "visible" : "invisible"}`}><span aria-hidden="true">✓</span> {teacherPending ? "Salvando..." : "Selecionado"}</span></button></div></div> : null}
    <form action={formAction} noValidate autoComplete="off" className={`flex h-full flex-col ${role === "aluno" ? "lg:border-l lg:border-slate-200 lg:pl-10" : ""}`}><h2 className="text-lg font-semibold">Dados pessoais</h2><p className="mt-1 text-sm text-slate-500">Atualize as informações da sua conta.</p><div className="mt-6 space-y-4"><div className="relative"><label htmlFor="profile-name" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500">Nome</label><input id="profile-name" name="name" type="text" defaultValue={name} placeholder="Seu nome" className={`${inputClass} pb-2 pt-6`} /></div><div className="relative"><label htmlFor="profile-email" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500">E-mail</label><input id="profile-email" type="email" value={email} readOnly placeholder="seu@email.com" className={`${inputClass} pb-2 pt-6 text-slate-500`} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="relative"><label htmlFor="profile-weight" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500">Peso (kg)</label><input id="profile-weight" name="weight" type="number" min="1" max="500" step="0.1" defaultValue={weight ?? ""} placeholder="Ex.: 80" className={`${inputClass} pb-2 pt-6`} /></div><div className="relative"><label htmlFor="profile-height" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500">Altura (cm)</label><input id="profile-height" name="height" type="number" min="1" max="300" step="1" defaultValue={height ?? ""} placeholder="Ex.: 180" className={`${inputClass} pb-2 pt-6`} /></div></div></div><FormToast state={state} variant={state.message.includes("sucesso") ? "success" : "error"} /><button type="submit" disabled={pending} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{pending ? "Salvando..." : "Salvar alterações"}</button></form>
    <form action={passwordAction} noValidate autoComplete="off" className="flex h-full flex-col lg:border-l lg:border-slate-200 lg:pl-10"><h2 className="text-lg font-semibold">Alterar senha</h2><p className="mt-1 text-sm text-slate-500">Escolha uma nova senha para sua conta.</p><div className="mt-6 space-y-4"><div className="relative"><label htmlFor="current-password" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500">Senha atual</label><input id="current-password" name="currentPassword" type="password" placeholder="Digite sua senha atual" className={`${inputClass} pb-2 pt-6`} /></div><div className="relative"><label htmlFor="new-password" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500">Nova senha</label><input id="new-password" name="newPassword" type="password" placeholder="Digite a nova senha" className={`${inputClass} pb-2 pt-6`} /></div><div className="relative"><label htmlFor="password-confirmation" className="pointer-events-none absolute left-4 top-2 text-xs font-medium text-slate-500">Confirmação</label><input id="password-confirmation" name="passwordConfirmation" type="password" placeholder="Repita a nova senha" className={`${inputClass} pb-2 pt-6`} /></div></div><FormToast state={passwordState} variant={passwordState.message.includes("sucesso") ? "success" : "error"} /><button type="submit" disabled={passwordPending} className="mt-10 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">{passwordPending ? "Alterando..." : "Alterar senha"}</button></form>
  </div>;
}
