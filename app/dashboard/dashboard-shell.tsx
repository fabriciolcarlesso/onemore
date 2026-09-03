"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

type DashboardUser = {
  name: string;
  email: string;
  role: "admin" | "trainer" | "student";
};

type IconName = "grid" | "dumbbell" | "users" | "chart" | "settings";
type DashboardPage = "overview" | "exercises";

const navigation: { label: string; icon: IconName; page: DashboardPage | null; href: string }[] = [
  { label: "Exercícios", icon: "dumbbell", page: "exercises", href: "/exercicios" },
];

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
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
  activePage = "overview",
}: {
  user: DashboardUser;
  signOut: () => Promise<void>;
  children?: ReactNode;
  activePage?: DashboardPage;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [locked, setLocked] = useState(false);
  const sidebarExpanded = !collapsed || hoverExpanded || locked;

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
          <span className="text-2xl font-normal tracking-tight"><span className={sidebarExpanded ? "" : "lg:hidden"}>One<strong className="font-bold">More</strong></span><span className={sidebarExpanded ? "lg:hidden" : ""}>ON</span></span>
          {sidebarExpanded ? <button type="button" aria-label={locked ? "Desbloquear e recolher menu" : "Fixar menu expandido"} onClick={toggleSidebarLock} className="hidden size-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-950 lg:flex">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d={locked ? "M7 10V7a5 5 0 0 1 10 0v3M6 10h12v10H6V10Z" : "M7 10V7a5 5 0 0 1 10 0M6 10h12v10H6V10Zm6 4v2"} /></svg>
          </button> : null}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navegação principal">
          {navigation.map((item) => <Link href={item.href} key={item.label} title={!sidebarExpanded ? item.label : undefined} onClick={() => setMobileOpen(false)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors ${item.page === activePage ? "bg-slate-100 text-slate-950" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"} ${!sidebarExpanded ? "lg:justify-center lg:px-0" : ""}`}><Icon name={item.icon} /><span className={!sidebarExpanded ? "lg:hidden" : ""}>{item.label}</span></Link>)}
        </nav>

        <div className={`border-t border-slate-100 p-3 ${!sidebarExpanded ? "lg:flex lg:justify-center" : ""}`}><Link href="/perfil" className={`flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 ${!sidebarExpanded ? "lg:p-2" : ""}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">{initials(user.name)}</span><span className={!sidebarExpanded ? "lg:hidden" : ""}><strong className="block truncate text-sm font-semibold">{user.name}</strong><span className="block text-xs capitalize text-slate-400">{user.role}</span></span></Link></div>
      </aside>

      <div className={`min-h-dvh transition-[padding] duration-200 ${sidebarExpanded ? "lg:pl-64" : "lg:pl-[76px]"}`}>
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-100 bg-white/90 px-8 backdrop-blur sm:px-10 xl:px-12">
          <button type="button" aria-label="Abrir menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" /></svg></button>
          <div className="hidden lg:block"><p className="text-sm font-medium text-slate-400">Área de trabalho</p><p className="text-base font-semibold">{activePage === "exercises" ? "Exercícios" : "Visão geral"}</p></div>
          <div className="ml-auto flex items-center gap-3"><span className="hidden text-right sm:block"><strong className="block text-sm font-semibold">{user.name}</strong><span className="text-xs text-slate-400">Conta ativa</span></span><span className="flex size-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{initials(user.name)}</span><form action={signOut}><button type="submit" aria-label="Sair" title="Sair" className="flex size-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M18 9l3 3m0 0-3 3m3-3H9" /></svg></button></form></div>
        </header>

        <main className="mx-auto w-full max-w-none px-8 py-8 sm:px-10 sm:py-10 xl:px-12 xl:py-12">{children ?? <><div className="mb-8"><p className="text-sm font-medium text-slate-400">Hoje</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Bom treino, {user.name.split(" ")[0]}.</h1><p className="mt-2 text-sm text-slate-500">Acompanhe seu progresso e mantenha o ritmo.</p></div><section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"><article className="rounded-2xl bg-slate-950 p-7 text-white sm:p-9"><p className="text-sm text-slate-400">Treinos concluídos</p><p className="mt-5 text-4xl font-semibold tracking-tight">0</p><p className="mt-4 text-xs text-slate-400">Comece seu primeiro treino</p></article><article className="rounded-2xl border border-slate-200 bg-white p-7 sm:p-9"><p className="text-sm text-slate-400">Sequência atual</p><p className="mt-5 text-4xl font-semibold tracking-tight">0 <span className="text-base font-normal text-slate-400">dias</span></p><p className="mt-4 text-xs text-slate-400">Consistência gera resultado</p></article><article className="rounded-2xl border border-slate-200 bg-white p-7 sm:col-span-2 sm:p-9 xl:col-span-1"><p className="text-sm text-slate-400">Próximo passo</p><p className="mt-5 text-lg font-semibold">Monte seu primeiro treino</p><button type="button" className="mt-5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">Começar agora</button></article></section><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-7 sm:p-9"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Atividade recente</p><p className="mt-1 text-xs text-slate-400">Seus últimos movimentos aparecerão aqui.</p></div><Icon name="chart" className="size-5 text-slate-300" /></div><div className="mt-8 flex min-h-44 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">Nenhuma atividade registrada ainda.</div></section></>}</main>
      </div>
    </div>
  );
}
