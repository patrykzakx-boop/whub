export default function Loading() {
  return (
    <main className="min-h-[65vh] bg-[#05070a] px-4 py-10 text-white" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-800" />
        <div className="mt-5 h-10 max-w-xl rounded bg-slate-800" />
        <div className="mt-3 h-5 max-w-2xl rounded bg-slate-900" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-40 rounded-2xl border border-slate-800 bg-[#0d1218]" />
          ))}
        </div>
        <span className="sr-only">Ładowanie strony…</span>
      </div>
    </main>
  );
}
