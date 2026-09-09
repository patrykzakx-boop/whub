"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizeOfferStatus } from "@/lib/statuses";
import RequestCategoryImage from "@/components/requests/RequestCategoryImage";
import { RequestPriorityMeta, isUrgentRequest } from "@/lib/requestPriority";
import { getRequestCategoryLabel } from "@/lib/requestCategories";

type Offer = {
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

export default function DashboardOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOffers = async () => {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: offersData, error } = await supabase
        .from("my_offer_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setOffers(offersData || []);
      }

      setLoading(false);
    };

    loadOffers();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie odpowiedzi...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-5 text-white lg:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="border-b border-slate-800/80 pb-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
              Panel wykonawcy
            </div>

            <h1 className="mt-1.5 text-2xl font-semibold text-white">
              Moje odpowiedzi
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
              Odpowiedzi wysłane z profili Twoich firm. Zainteresowane i wybrane oferty pokazują kontakt do klienta.
            </p>
          </div>
        </header>

        <nav className="-mx-4 flex gap-2 overflow-x-auto border-b border-slate-800/80 px-4 pb-3 sm:mx-0 sm:px-0">
          <DashboardNavLink href="/dashboard" label="Moje firmy" />
          <DashboardNavLink href="/add-company" label="Dodaj firmę" />
          <DashboardNavLink href="/dashboard/messages?status=new" label="Zapytania" />
          <DashboardNavLink href="/dashboard/offers" label="Odpowiedzi" active />
        </nav>

        <section className="min-w-0 space-y-6">

          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {offers.length > 0 ? (
            <div className="space-y-3">
              {offers.map((offer) => {
                const offerStatus = normalizeOfferStatus(offer.status);
                const contactVisible = offerStatus === "interested" || offerStatus === "chosen";

                return (
                <Link
                  key={offer.id}
                  href={"/request/" + offer.request_id}
                  className={
                    isUrgentRequest(offer.request_type)
                      ? "flex items-center gap-3 rounded-2xl border border-orange-500/50 bg-[#0d1218] px-3 py-3 transition hover:bg-[#101722] sm:gap-4 sm:px-4"
                      : "flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0d1218] px-3 py-3 transition hover:bg-[#101722] sm:gap-4 sm:px-4"
                  }
                >
                  <RequestCategoryImage
                    category={offer.request_category}
                    title={offer.request_title}
                    className="h-14 w-20 sm:h-16 sm:w-20"
                  />

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-white">
                      {offer.request_title || "Zlecenie bez tytułu"}
                    </h2>

                    <div className="mt-1 truncate text-sm font-medium text-gray-400">
                      {getRequestCategoryLabel(offer.request_category)}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                      <span>{offer.request_city || "Brak miejscowości"}</span>
                      <span>•</span>
                      <span>{formatDate(offer.created_at)}</span>
                      <RequestPriorityMeta type={offer.request_type} />
                    </div>

                    {contactVisible && (
                      <div className="mt-1 truncate text-xs text-gray-500">
                        Kontakt klienta dostępny
                      </div>
                    )}
                  </div>

                </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-8 text-center">
              <div className="font-medium text-white">
                Nie masz jeszcze wysłanych odpowiedzi.
              </div>

              <p className="mt-2 text-sm text-gray-400">
                Wejdź w publiczne zlecenie i odpowiedz z profilu jednej ze swoich firm.
              </p>

              <Link
                href="/requests"
                className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Zobacz zlecenia
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardNavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "flex shrink-0 items-center gap-2 rounded-xl bg-[#0d1218] px-4 py-2.5 text-sm font-medium text-white"
          : "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-gray-500 transition hover:bg-[#0d1218] hover:text-white"
      }
    >
      {label}
    </Link>
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
