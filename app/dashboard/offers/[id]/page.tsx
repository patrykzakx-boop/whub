"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import RequestCategoryImage from "@/components/requests/RequestCategoryImage";
import { getRequestCategoryLabel } from "@/lib/requestCategories";
import { supabase } from "@/lib/supabaseClient";
import { getOfferStatusLabel, getRequestStatusLabel } from "@/lib/statuses";

type OfferDetails = {
  id: string | number;
  request_id: string | number;
  company_id: string | number;
  message: string | null;
  price_estimate: string | null;
  availability: string | null;
  status: string | null;
  created_at: string | null;
  company_name: string | null;
  request_title: string | null;
  request_city: string | null;
  request_category: string | null;
  request_type: string | null;
  request_created_at: string | null;
  request_image_url: string | null;
  request_status: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
};

export default function DashboardOfferDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOffer = async () => {
      const offerId = params?.id;

      if (!offerId) {
        setErrorMessage("Brak identyfikatora odpowiedzi.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("my_offer_details")
        .select("*")
        .eq("id", offerId)
        .maybeSingle();

      if (error || !data) {
        if (error) console.error(error);
        setErrorMessage(
          "Nie znaleziono odpowiedzi albo nie masz do niej dostępu."
        );
        setLoading(false);
        return;
      }

      setOffer(data);
      setLoading(false);
    };

    loadOffer();
  }, [params?.id, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie odpowiedzi...
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4 text-white">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8 text-center">
          <h1 className="text-2xl font-semibold">Nie można otworzyć odpowiedzi</h1>
          <p className="mt-3 text-gray-400">{errorMessage}</p>
          <Link
            href="/dashboard/offers"
            className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Wróć do odpowiedzi
          </Link>
        </div>
      </main>
    );
  }

  const contactVisible = Boolean(
    offer.customer_name || offer.customer_phone || offer.customer_email
  );

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white lg:py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/offers"
          className="inline-flex text-sm text-gray-500 transition hover:text-white"
        >
          ← Powrót do odpowiedzi
        </Link>

        <section className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <RequestCategoryImage
              category={offer.request_category}
              title={offer.request_title}
              className="h-24 w-full sm:w-32"
            />

            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
                Szczegóły odpowiedzi
              </div>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                {offer.request_title || "Zlecenie bez tytułu"}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-400">
                <span>{getRequestCategoryLabel(offer.request_category)}</span>
                <span>•</span>
                <span>{offer.request_city || "Brak miejscowości"}</span>
                <span>•</span>
                <span>{formatDate(offer.request_created_at)}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge label={getOfferStatusLabel(offer.status)} />
                <StatusBadge label={getRequestStatusLabel(offer.request_status)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
              Twoja odpowiedź
            </div>
            <h2 className="mt-2 text-xl font-semibold">
              {offer.company_name || "Firma wykonawcza"}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-300">
              {offer.message || "Brak wiadomości."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Detail label="Cena" value={offer.price_estimate || "Nie podano"} />
              <Detail label="Termin" value={offer.availability || "Nie podano"} />
            </div>
            <Link
              href={`/company/${offer.company_id}`}
              className="mt-5 inline-flex text-sm font-medium text-orange-400 hover:text-orange-300"
            >
              Zobacz profil firmy
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
              Kontakt do klienta
            </div>

            {contactVisible ? (
              <div className="mt-4 space-y-3">
                <Detail label="Klient" value={offer.customer_name || "Nie podano"} />
                <ContactLink
                  label="Telefon"
                  value={offer.customer_phone}
                  href={offer.customer_phone ? `tel:${offer.customer_phone}` : null}
                />
                <ContactLink
                  label="E-mail"
                  value={offer.customer_email}
                  href={offer.customer_email ? `mailto:${offer.customer_email}` : null}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-gray-400">
                Dane klienta będą dostępne, gdy klient poprosi Twoją firmę o kontakt.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-700 bg-[#05070a] px-3 py-1 text-xs text-gray-300">
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-4">
      <div className="text-xs uppercase tracking-wide text-gray-600">{label}</div>
      <div className="mt-1 break-words text-sm text-gray-200">{value}</div>
    </div>
  );
}

function ContactLink({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href: string | null;
}) {
  if (!value || !href) {
    return <Detail label={label} value="Nie podano" />;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#05070a] p-4">
      <div className="text-xs uppercase tracking-wide text-gray-600">{label}</div>
      <a
        href={href}
        className="mt-1 block break-words text-sm font-medium text-orange-400 hover:text-orange-300"
      >
        {value}
      </a>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
