import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function RequestsPage() {
  const { data: requests, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  return (
    <main className="min-h-screen bg-[#05070a]">
      <div className="mx-auto max-w-screen-2xl px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">
            Aktywne zlecenia
          </h1>

          <p className="mt-3 text-gray-400">
            Przeglądaj najnowsze zapytania klientów.
          </p>
        </div>

        {/* Filtry */}
        <div className="mb-8 flex flex-wrap gap-3 rounded-3xl border border-slate-800 bg-[#0d1218] p-4">

          <button className="rounded-xl border border-slate-700 bg-[#05070a] px-5 py-3 text-sm text-white transition hover:border-orange-500">
            Wszystkie kategorie ▼
          </button>

          <button className="rounded-xl border border-slate-700 bg-[#05070a] px-5 py-3 text-sm text-white transition hover:border-orange-500">
            Wszystkie lokalizacje ▼
          </button>

          <button className="ml-auto rounded-xl border border-slate-700 bg-[#05070a] px-5 py-3 text-sm text-white transition hover:border-orange-500">
            Sortuj: Najnowsze ▼
          </button>

        </div>

        {/* Brak ogłoszeń */}
        {requests?.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-12 text-center text-gray-400">
            Brak aktywnych zapytań.
          </div>
        )}

        {/* Lista zleceń */}
        {requests && requests.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1218]">

            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/request/${request.id}`}
                className="
                  block
                  border-b
                  border-slate-800
                  p-6
                  transition-all
                  duration-200
                  hover:bg-[#111827]
                "
              >
                <div className="grid gap-4 md:grid-cols-[1fr_180px_140px_40px] md:items-center">

                  <div>
                    <div className="mb-3 inline-flex rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
                      {request.category}
                    </div>

                    <h2 className="text-lg font-semibold text-white">
                      {request.title}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm text-gray-400">
                      {request.description}
                    </p>
                  </div>

                  <div className="text-sm text-gray-300">
                    {request.city}
                  </div>

                  <div className="text-sm text-gray-500">
                    {new Date(request.created_at).toLocaleDateString("pl-PL")}
                  </div>

                  <div className="text-right text-2xl text-orange-500">
                    →
                  </div>

                </div>
              </Link>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}