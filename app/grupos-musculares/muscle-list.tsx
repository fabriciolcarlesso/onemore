"use client";

import { useEffect, useRef, useState } from "react";
import { GroupCard } from "./group-card";

type Group = { id: string; name: string; description: string | null };

export function MuscleList({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState(initialGroups);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(initialGroups.length);
  const [hasMore, setHasMore] = useState(initialGroups.length === 20);
  const [loading, setLoading] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/grupos-musculares?q=${encodeURIComponent(query)}&offset=0`);
      const data = await response.json() as { groups: Group[]; hasMore: boolean };
      setGroups(data.groups);
      setOffset(data.groups.length);
      setHasMore(data.hasMore);
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!sentinel.current || !hasMore) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loading) return;
      setLoading(true);
      const response = await fetch(`/api/grupos-musculares?q=${encodeURIComponent(query)}&offset=${offset}`);
      const data = await response.json() as { groups: Group[]; hasMore: boolean };
      setGroups((current) => [...current, ...data.groups]);
      setOffset((current) => current + data.groups.length);
      setHasMore(data.hasMore);
      setLoading(false);
    }, { rootMargin: "240px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query]);

  return <>
    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar grupo muscular" className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950" />
    <div className="mx-auto my-5 h-px w-1/5 bg-slate-200" aria-hidden="true" />
    {groups.length ? <div className="space-y-3">{groups.map((group) => <GroupCard key={group.id} group={group} open={openGroupId === group.id} onOpenChange={(open) => setOpenGroupId(open ? group.id : null)} />)}</div> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">Nenhum grupo muscular encontrado.</div>}
    <div ref={sentinel} className="h-12 py-4 text-center text-xs text-slate-400" aria-live="polite">{loading ? "Carregando…" : null}</div>
  </>;
}
