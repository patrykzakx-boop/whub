import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-[#05070a] px-4 text-white">
      <div className="max-w-xl text-center">
        <div className="text-7xl font-black text-orange-500">404</div>
        <h1 className="mt-4 text-3xl font-bold">Nie znaleziono strony</h1>
        <p className="mt-3 text-gray-400">Adres jest nieprawidłowy albo ta treść została usunięta lub ukryta.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="rounded-xl bg-orange-500 px-5 py-3 font-semibold hover:bg-orange-600">Strona główna</Link>
          <Link href="/companies" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:border-slate-500">Przeglądaj firmy</Link>
        </div>
      </div>
    </main>
  );
}
