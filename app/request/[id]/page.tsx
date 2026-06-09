import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import RequestGallery from "@/components/requests/RequestGallery";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: request, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !request) {
    notFound();
  }

  const imageUrls: string[] =
    Array.isArray(request.image_urls) && request.image_urls.length > 0
      ? request.image_urls
      : request.image_url
        ? [request.image_url]
        : [];

  return (
  <main className="min-h-screen bg-[#05070a]">
  <div className="mx-auto max-w-6xl px-4 py-10">

    {/* HERO */}
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <div className="mb-5 flex flex-wrap gap-3">

        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400">
          {request.category}
        </span>

        {request.request_type === "asap" && (
          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400">
            🚨 PILNE
          </span>
        )}

        {request.request_type === "company" && (
          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-400">
            🏢 FIRMA
          </span>
        )}

      </div>

      <h1 className="text-4xl font-bold text-white">
        {request.title}
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-4">

        <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-4">
          <div className="mb-1 text-xs uppercase text-gray-500">
            Lokalizacja
          </div>

          <div className="text-white">
            📍 {request.city}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-4">
          <div className="mb-1 text-xs uppercase text-gray-500">
            Dodano
          </div>

          <div className="text-white">
            {new Date(request.created_at).toLocaleDateString("pl-PL")}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-4">
          <div className="mb-1 text-xs uppercase text-gray-500">
            Typ klienta
          </div>

          <div className="text-white">
            {request.request_type === "company"
              ? "Firma"
              : "Klient indywidualny"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-4">
          <div className="mb-1 text-xs uppercase text-gray-500">
            Status
          </div>

          <div className="text-green-400">
            Aktywne
          </div>
        </div>

      </div>

    </div>

    <RequestGallery imageUrls={imageUrls} title={request.title} />

    {/* OPIS */}
    <div className="mt-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <h2 className="mb-6 text-2xl font-semibold text-white">
        Szczegóły zlecenia
      </h2>

      <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-6">

        <p className="whitespace-pre-wrap text-lg leading-8 text-gray-300">
          {request.description}
        </p>

      </div>

    </div>

    {/* KONTAKT */}
    <div className="mt-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <div className="mb-6 flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-semibold text-white">
            Dane kontaktowe
          </h2>

          <p className="mt-2 text-gray-500">
            Skontaktuj się bezpośrednio z klientem
          </p>
        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-5">
          <div className="mb-2 text-xs uppercase text-gray-500">
            Osoba kontaktowa
          </div>

          <div className="text-lg font-medium text-white">
            {request.customer_name}
          </div>
        </div>

        <a
          href={`tel:${request.customer_phone}`}
          className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5 transition hover:bg-orange-500/20"
        >
          <div className="mb-2 text-xs uppercase text-orange-300">
            Telefon
          </div>

          <div className="text-lg font-medium text-white">
            📞 {request.customer_phone}
          </div>
        </a>

        <a
          href={`mailto:${request.customer_email}`}
          className="rounded-2xl border border-slate-700 bg-[#05070a] p-5 transition hover:border-orange-500"
        >
          <div className="mb-2 text-xs uppercase text-gray-500">
            Email
          </div>

          <div className="truncate text-lg font-medium text-white">
            ✉️ {request.customer_email}
          </div>
        </a>

      </div>

    </div>

  </div>
</main>
  );
}
