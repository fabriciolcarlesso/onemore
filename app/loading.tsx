export default function Loading() {
  return (
    <main className="min-h-dvh bg-slate-50 px-8 py-8 sm:px-10 sm:py-10" aria-label="Carregando página">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-8 h-1 w-[30px] rounded-full bg-slate-200" />
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="mt-8 space-y-3">
          <div className="h-20 rounded-2xl border border-slate-200 bg-white" />
          <div className="h-20 rounded-2xl border border-slate-200 bg-white" />
          <div className="h-20 rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
