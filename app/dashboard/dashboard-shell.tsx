"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { EmailVerificationNotice } from "@/app/ui/email-verification-notice";

type DashboardUser = {
  name: string;
  email: string;
  emailVerifiedAt?: Date | null;
  role: "admin" | "professor" | "aluno";
};

type IconName = "grid" | "dumbbell" | "users" | "chart" | "settings" | "card" | "clipboard";
type DashboardPage = "overview" | "exercises" | "workouts" | "relationships" | "plans" | "sheets";
type UserRole = "admin" | "professor" | "aluno";

const navigation: { label: string; icon: IconName; page: DashboardPage | null; href: string; roles?: UserRole[] }[] = [
  { label: "Treinos", icon: "grid", page: "workouts", href: "/treinos", roles: ["aluno", "admin"] },
  { label: "Planilhas", icon: "clipboard", page: "sheets", href: "/planilhas", roles: ["professor", "admin"] },
  { label: "Planos", icon: "card", page: "plans", href: "/planos", roles: ["aluno"] },
  { label: "Exercícios", icon: "dumbbell", page: "exercises", href: "/exercicios", roles: ["professor", "admin"] },
  { label: "Meus alunos", icon: "users", page: "relationships", href: "/meus-alunos", roles: ["professor"] },
  { label: "Meus professores", icon: "users", page: "relationships", href: "/meus-professores", roles: ["aluno"] },
];

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    card: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    dumbbell: <><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.4" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L9 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H7.7v-2h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L9 9l1.4-1.4.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function DashboardShell({
  user,
  signOut,
  children,
  completedWorkouts,
  recentWorkouts = [],
  activePage = "overview",
  hideFooter = false,
}: {
  user: DashboardUser;
  signOut: () => Promise<void>;
  children?: ReactNode;
  completedWorkouts?: ReactNode;
  recentWorkouts?: { id: string; name: string }[];
  activePage?: DashboardPage;
  hideFooter?: boolean;
}) {
  const hasWorkouts = recentWorkouts.length > 0;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [locked, setLocked] = useState(false);
  const sidebarExpanded = !collapsed || hoverExpanded || locked;

  useEffect(() => {
    if (!profileMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);

  function toggleSidebarLock() {
    if (locked) {
      setLocked(false);
      setCollapsed(true);
      return;
    }
    setLocked(true);
    setCollapsed(false);
  }

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-950">
      {mobileOpen ? <button type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[2px] lg:hidden" /> : null}

      <aside onMouseEnter={() => setHoverExpanded(true)} onMouseLeave={() => setHoverExpanded(false)} onTouchStart={() => setHoverExpanded(true)} className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white transition-all duration-200 lg:translate-x-0 ${sidebarExpanded ? "lg:w-64" : "lg:w-[76px]"} ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}`}>
        <div className={`relative flex h-20 items-center border-b border-slate-100 px-5 ${sidebarExpanded ? "justify-between" : "lg:justify-center lg:px-0"}`}>
          <Link href="/dashboard" aria-label="Ir para o painel principal" className="cursor-pointer text-2xl font-normal tracking-tight"><span className={sidebarExpanded ? "" : "lg:hidden"}>just<strong className="font-bold">OneMore</strong></span><span className={sidebarExpanded ? "lg:hidden" : ""}>jOM</span></Link>
          {sidebarExpanded ? <button type="button" aria-label={locked ? "Desbloquear e recolher menu" : "Fixar menu expandido"} onClick={toggleSidebarLock} className="hidden size-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 lg:flex">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d={locked ? "M7 10V7a5 5 0 0 1 10 0v3M6 10h12v10H6V10Z" : "M7 10V7a5 5 0 0 1 10 0M6 10h12v10H6V10Zm6 4v2"} /></svg>
          </button> : null}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navegação principal">
          {navigation.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => <Link href={item.href} key={item.label} title={!sidebarExpanded ? item.label : undefined} onClick={() => setMobileOpen(false)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${item.page === activePage ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"} ${!sidebarExpanded ? "lg:justify-center lg:px-0" : ""}`}><Icon name={item.icon} /><span className={!sidebarExpanded ? "lg:hidden" : ""}>{item.label}</span></Link>)}
        </nav>

        <div className={`border-t border-slate-100 p-3 ${!sidebarExpanded ? "lg:flex lg:justify-center" : ""}`}><Link href="/perfil" className={`flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 ${!sidebarExpanded ? "lg:p-2" : ""}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">{initials(user.name)}</span><span className={!sidebarExpanded ? "lg:hidden" : ""}><strong className="block truncate text-sm font-semibold">{user.name}</strong><span className="block text-xs capitalize text-slate-400">{user.role}</span></span></Link></div>
      </aside>

      <button type="button" aria-label="Fechar menu da conta" tabIndex={profileMenuOpen ? 0 : -1} onClick={() => setProfileMenuOpen(false)} className={`fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] transition-opacity duration-200 ${profileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside id="profile-panel" aria-label="Menu da conta" aria-hidden={!profileMenuOpen} inert={!profileMenuOpen} className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col border-l border-slate-100 bg-white shadow-2xl shadow-slate-950/15 transition-transform duration-200 ease-in-out ${profileMenuOpen ? "translate-x-0" : "pointer-events-none translate-x-full"}`}>
        <div className="flex h-20 items-center justify-end border-b border-slate-100 px-5">
          <button type="button" aria-label="Fechar menu da conta" onClick={() => setProfileMenuOpen(false)} className="flex size-10 items-center justify-center rounded-full text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-950">×</button>
        </div>
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{initials(user.name)}</span>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{user.name}</p><p className="truncate text-xs text-slate-400">{user.email}</p></div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Opções da conta">
          <Link href="/perfil" onClick={() => setProfileMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">Meu perfil</Link>
        </nav>
        <div className="border-t border-slate-100 p-3"><form action={signOut}><button type="submit" className="w-full rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">Sair</button></form></div>
      </aside>

      <div className={`flex min-h-dvh flex-col transition-[padding] duration-200 ${sidebarExpanded ? "lg:pl-64" : "lg:pl-[76px]"}`}>
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-100 bg-white/90 px-8 backdrop-blur sm:px-10 xl:px-12">
          <button type="button" aria-label="Abrir menu" onClick={() => setMobileOpen(true)} className="-ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg></button>
          <div className="hidden lg:block"><p className="text-sm font-medium text-slate-400">Área de trabalho</p><p className="text-base font-semibold">{activePage === "exercises" ? "Exercícios" : activePage === "workouts" ? "Treinos" : activePage === "sheets" ? "Planilhas" : activePage === "plans" ? "Planos" : activePage === "relationships" ? "Relacionamentos" : "Visão geral"}</p></div>
          <button type="button" aria-label="Abrir menu da conta" aria-expanded={profileMenuOpen} aria-controls="profile-panel" onClick={() => setProfileMenuOpen((open) => !open)} className="ml-auto flex size-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950">{initials(user.name)}</button>
        </header>

        <main className="mx-auto w-full max-w-none flex-1 px-8 py-8 pb-32 sm:px-10 sm:py-10 sm:pb-32 xl:px-12 xl:py-12 xl:pb-32">{user.role === "aluno" && !user.emailVerifiedAt ? <EmailVerificationNotice /> : null}{children ?? <><div className="mb-8"><p className="text-sm font-medium text-slate-400">Hoje</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Bom treino, {user.name.split(" ")[0]}.</h1><p className="mt-2 text-sm text-slate-500">Acompanhe seu progresso e mantenha o ritmo.</p></div><section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{completedWorkouts ?? <article className="rounded-2xl bg-slate-950 p-7 text-white sm:p-9"><p className="text-sm text-slate-400">Treinos concluídos</p><p className="mt-5 text-4xl font-semibold tracking-tight">0</p><p className="mt-4 text-xs text-slate-400">Comece seu primeiro treino</p></article>}<article className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9"><p className="text-sm text-slate-400">Sequência atual</p><p className="mt-5 text-4xl font-semibold tracking-tight">0 <span className="text-base font-normal text-slate-400">dias</span></p><p className="mt-4 text-xs text-slate-400">Consistência gera resultado</p></article><article className="rounded-2xl border border-slate-200 bg-white p-7 sm:col-span-2 sm:p-9 xl:col-span-1"><p className="text-sm text-slate-400">Próximo passo</p><p className="mt-5 text-lg font-semibold">{hasWorkouts ? "Tudo pronto para treinar" : user.role === "aluno" ? "Peça seu treino ao professor" : "Monte seu primeiro treino"}</p>{hasWorkouts ? <ul className="mt-4 divide-y divide-slate-100">{recentWorkouts.map((workout) => <li key={workout.id} className="break-words py-3 text-sm text-slate-600">{workout.name}</li>)}</ul> : null}<Link href={hasWorkouts ? "/treinos" : user.role === "aluno" ? "/meus-professores" : "/treinos/novo"} className="mt-5 inline-block rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">{hasWorkouts ? "Ver todos os treinos" : user.role === "aluno" ? "Ver meus professores" : "Começar agora"}</Link></article></section><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 sm:p-9"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Atividade recente</p><p className="mt-1 text-xs text-slate-400">Seus últimos movimentos aparecerão aqui.</p></div><Icon name="chart" className="size-5 text-slate-300" /></div><div className="mt-8 flex min-h-44 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">Nenhuma atividade registrada ainda.</div></section></>}</main>
        {hideFooter ? null : <footer className={`fixed bottom-0 right-0 z-20 w-auto border-t border-slate-200 bg-slate-50 px-8 py-4 text-right text-xs text-slate-400 sm:px-10 xl:px-12 ${sidebarExpanded ? "lg:left-64" : "lg:left-[76px]"}`}><p>just<strong className="font-semibold text-slate-500">OneMore</strong></p><p className="mt-1">Desde 2026 · Simplificando seu treino</p></footer>}
      </div>
    </div>
  );
}
