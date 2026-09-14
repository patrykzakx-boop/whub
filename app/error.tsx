"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-[#05070a] px-4 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-[#0d1218] p-8 text-center">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-red-400">Błąd strony</div>
        <h1 className="mt-3 text-3xl font-bold">Coś poszło nie tak</h1>
        <p className="mt-3 text-gray-400">Nie udało się wyświetlić tej części WeldHub. Spróbuj ponownie lub wróć na stronę główną.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="rounded-xl bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600">Spróbuj ponownie</button>
          <Link href="/" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:border-slate-500">Strona główna</Link>
        </div>
      </div>
    </main>
  );
}
