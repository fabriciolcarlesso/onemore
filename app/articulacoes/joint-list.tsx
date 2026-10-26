"use client";

import { useEffect, useRef, useState } from "react";
import { JointCard } from "./joint-card";

type Joint = { id: string; name: string; region: string | null; description: string | null };

export function JointList({ initialJoints }: { initialJoints: Joint[] }) {
  const [joints, setJoints] = useState(initialJoints);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(initialJoints.length);
  const [hasMore, setHasMore] = useState(initialJoints.length === 20);
  const [loading, setLoading] = useState(false);
  const [openJointId, setOpenJointId] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/articulacoes?q=${encodeURIComponent(query)}&offset=0`);
      const data = await response.json() as { joints: Joint[]; hasMore: boolean };
      setJoints(data.joints); setOffset(data.joints.length); setHasMore(data.hasMore); setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (!sentinel.current || !hasMore) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || loading) return;
      setLoading(true);
      const response = await fetch(`/api/articulacoes?q=${encodeURIComponent(query)}&offset=${offset}`);
      const data = await response.json() as { joints: Joint[]; hasMore: boolean };
      setJoints((current) => [...current, ...data.joints]); setOffset((current) => current + data.joints.length); setHasMore(data.hasMore); setLoading(false);
    }, { rootMargin: "240px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query]);
  return <>
    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar articulação" className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950" />
    <div className="mx-auto my-5 h-px w-1/5 bg-slate-200" aria-hidden="true" />
    {joints.length ? <div className="space-y-3">{joints.map((joint) => <JointCard key={joint.id} joint={joint} open={openJointId === joint.id} onOpenChange={(open) => setOpenJointId(open ? joint.id : null)} />)}</div> : <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-400">Nenhuma articulação encontrada.</div>}
    <div ref={sentinel} className="h-12 py-4 text-center text-xs text-slate-400" aria-live="polite">{loading ? "Carregando…" : null}</div>
  </>;
}
