import type { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import RequestGallery from "@/components/requests/RequestGallery";
import RequestOfferForm from "@/components/requests/RequestOfferForm";
import { getRequestStatusLabel } from "@/lib/statuses";
import { getRequestCategoryLabel } from "@/lib/requestCategories";
import ReportButton from "@/components/moderation/ReportButton";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: request } = await supabase
    .from("public_request_listings")
    .select("title,description,city")
    .eq("id", id)
    .is("company_id", null)
    .maybeSingle();

  if (!request) return { title: "Zlecenie nie istnieje", robots: { index: false } };

  const title = request.title || "Zlecenie spawalnicze";
  const description = request.description
    ? String(request.description).slice(0, 155)
    : `${title}${request.city ? ` — ${request.city}` : ""}. Zobacz szczegóły w WeldHub.`;

  return {
    title,
    description,
    alternates: { canonical: `/request/${id}` },
    openGraph: { title, description, url: `/request/${id}` },
  };
}


export default async function RequestPage({
  params,
}: Props) {
  const { id } = await params;

  const { data: request, error } = await supabase
    .from("public_request_listings")
    .select("*")
    .eq("id", id)
    .is("company_id", null)
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
          {getRequestCategoryLabel(request.category)}
        </span>

        {request.request_type === "asap" && (
          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400">
            🚨 PILNE
          </span>
        )}

      </div>

      <h1 className="text-3xl font-bold text-white sm:text-4xl">
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
            Priorytet
          </div>

          <div className="text-white">
            {getRequestPriorityLabel(request.request_type)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-4">
          <div className="mb-1 text-xs uppercase text-gray-500">
            Status
          </div>

          <div className="text-white">
            {getRequestStatusLabel(request.status)}
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

    <RequestOfferForm requestId={request.id} requestStatus={request.status} />

    <ReportButton targetType="request" targetId={request.id} />

    {/* KONTAKT */}
    <div className="mt-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
      <h2 className="text-2xl font-semibold text-white">
        Kontakt z klientem
      </h2>

      <p className="mt-3 max-w-3xl text-gray-400">
        Dane kontaktowe klienta nie są publiczne. Wyślij odpowiedź przez WeldHub,
        a klient zobaczy ją w swoim prywatnym widoku zlecenia. Po wyborze wykonawcy
        strony mogą bezpiecznie przejść do kontaktu bezpośredniego.
      </p>
    </div>

  </div>
</main>
  );
}

function getRequestPriorityLabel(type: string | null) {
  if (type === "asap") return "Pilne / awaria";
  return "Standardowe";
}
