import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import RequestCategoryImage from "@/components/requests/RequestCategoryImage";
import { RequestPriorityMeta, isUrgentRequest } from "@/lib/requestPriority";
import {
  REQUEST_CATEGORIES,
  getRequestCategoryLabel,
} from "@/lib/requestCategories";

type SearchParams = {
  category?: string;
  city?: string;
  sort?: string;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function RequestsPage({ searchParams }: Props) {
  const filters = await searchParams;
  const selectedSort = filters.sort || "newest";

  const { data: locations } = await supabase
    .from("public_request_listings")
    .select("city")
    .is("company_id", null)
    .in("status", ["new", "contacting"])
    .not("city", "is", null);

  const cities = Array.from(
    new Set(
      locations
        ?.map((request) => request.city)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "pl"));

  let query = supabase
    .from("public_request_listings")
    .select("*")
    .is("company_id", null)
    .in("status", ["new", "contacting"]);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  if (filters.city) {
    query = query.eq("city", filters.city);
  }

  if (selectedSort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: requestsData, error } = await query;

  const requests =
    selectedSort === "urgent"
      ? [...(requestsData || [])].sort((a, b) => {
          const urgentA = isUrgentRequest(a.request_type) ? 1 : 0;
          const urgentB = isUrgentRequest(b.request_type) ? 1 : 0;

          if (urgentA !== urgentB) return urgentB - urgentA;

          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        })
      : requestsData;

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
        <form
          action="/requests"
          className="mb-8 grid gap-3 rounded-3xl border border-slate-800 bg-[#0d1218] p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto]"
        >
          <select
            name="category"
            defaultValue={filters.category || ""}
            className="rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
          >
            <option value="">Wszystkie kategorie</option>

            {REQUEST_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            name="city"
            defaultValue={filters.city || ""}
            className="rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
          >
            <option value="">Wszystkie lokalizacje</option>

            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={selectedSort}
            className="rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
          >
            <option value="newest">Sortuj: najnowsze</option>
            <option value="oldest">Sortuj: najstarsze</option>
            <option value="urgent">Sortuj: pilne najpierw</option>
          </select>

          <button className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
            Filtruj
          </button>

          <Link
            href="/requests"
            className="rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-gray-300 transition hover:border-slate-500 hover:text-white"
          >
            Wyczyść
          </Link>
        </form>

        {/* Brak wyników */}
        {requests?.length === 0 && (
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-12 text-center text-gray-400">
            Brak aktywnych zapytań.
          </div>
        )}

        {/* Lista */}
        {requests && requests.length > 0 && (
          <div className="space-y-3">

            {/* Nagłówek tabeli desktop */}
            <div className="hidden rounded-2xl border border-slate-800 bg-[#0b1016] lg:grid lg:grid-cols-[80px_1fr_180px_140px_120px] lg:gap-4 lg:px-4 lg:py-3">

              <div></div>

              <div className="text-xs uppercase tracking-wide text-gray-500">
                Zlecenie
              </div>

              <div className="text-xs uppercase tracking-wide text-gray-500">
                Kategoria
              </div>

              <div className="text-xs uppercase tracking-wide text-gray-500">
                Lokalizacja
              </div>

              <div className="text-xs uppercase tracking-wide text-gray-500">
                Dodano
              </div>

            </div>

            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/request/${request.id}`}
                className={
                  isUrgentRequest(request.request_type)
                    ? "block rounded-2xl border border-orange-500/50 bg-[#0d1218] transition hover:bg-[#111827]"
                    : "block rounded-2xl border border-slate-800 bg-[#0d1218] transition hover:bg-[#111827]"
                }
              >
                {/* Desktop */}
                <div className="hidden lg:grid lg:grid-cols-[80px_1fr_180px_140px_120px] lg:items-center lg:gap-4 lg:p-4">

                  <RequestCategoryImage
                    category={request.category}
                    title={request.title}
                    className="h-14 w-20 rounded-lg"
                  />

                  <div className="min-w-0">
                    <h2 className="truncate font-medium text-white">
                      {request.title}
                    </h2>
                  </div>

                  <div className="text-sm text-gray-400">
                    {getRequestCategoryLabel(request.category)}
                  </div>

                  <div className="text-sm text-gray-300">
                    {request.city}
                  </div>

                  <div className="text-sm text-gray-500">
                    <div>
                      {new Date(
                        request.created_at
                      ).toLocaleDateString("pl-PL")}
                    </div>
                    {isUrgentRequest(request.request_type) && (
                      <div className="mt-1 text-xs font-medium text-orange-300">
                        Pilne
                      </div>
                    )}
                  </div>

                </div>

                {/* Tablet + Mobile */}
                <div className="flex items-center gap-3 p-3 sm:p-4 lg:hidden">

                  <RequestCategoryImage
                    category={request.category}
                    title={request.title}
                    className="h-16 w-20 sm:h-20 sm:w-24"
                  />

                  <div className="min-w-0 flex-1">

                    <h2 className="truncate text-base font-semibold text-white">
                      {request.title}
                    </h2>

                    <div className="mt-1 text-sm text-gray-400">
                      {getRequestCategoryLabel(request.category)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-400">
                      <span>
                        {request.city} •{" "}
                        {new Date(
                          request.created_at
                        ).toLocaleDateString("pl-PL")}
                      </span>
                      <RequestPriorityMeta type={request.request_type} />
                    </div>

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
