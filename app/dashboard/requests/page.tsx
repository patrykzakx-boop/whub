"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getRequestStatusLabel, normalizeOfferStatus } from "@/lib/statuses";
import RequestCategoryImage from "@/components/requests/RequestCategoryImage";
import { RequestPriorityMeta, isUrgentRequest } from "@/lib/requestPriority";
import { getRequestCategoryLabel } from "@/lib/requestCategories";

type CustomerRequest = {
  id: string | number;
  title: string | null;
  city: string | null;
  category: string | null;
  status: string | null;
  request_type: string | null;
  created_at: string | null;
  company_id: string | number | null;
  image_url: string | null;
};

type Offer = {
  id: string | number;
  request_id: string | number;
  status: string | null;
};

export default function DashboardRequestsPage() {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRequests = async () => {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: requestsData, error } = await supabase
        .from("requests")
        .select("id, title, city, category, status, request_type, created_at, company_id, image_url")
        .eq("customer_id", data.user.id)
        .not("status", "eq", "cancelled")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      const userRequests = requestsData || [];
      setRequests(userRequests);

      const requestIds = userRequests.map((request) => request.id);

      if (requestIds.length > 0) {
        const { data: offersData, error: offersError } = await supabase
          .from("request_offers")
          .select("id, request_id, status")
          .in("request_id", requestIds);

        if (offersError) {
          setErrorMessage(offersError.message);
        } else {
          setOffers(offersData || []);
        }
      }

      setLoading(false);
    };

    loadRequests();
  }, []);

  const offersByRequestId = useMemo(() => {
    return offers.reduce<Record<string, Offer[]>>((acc, offer) => {
      const key = String(offer.request_id);
      acc[key] = acc[key] || [];
      acc[key].push(offer);
      return acc;
    }, {});
  }, [offers]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie zleceń...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-5 text-white lg:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
                Panel klienta
              </div>

              <h1 className="mt-1.5 text-2xl font-semibold text-white">
                Moje zlecenia
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
                Zlecenia dodane z Twojego konta i odpowiedzi wykonawców.
              </p>
            </div>

            <Link
              href="/add-request"
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Dodaj zlecenie
            </Link>
          </div>
        </section>

        <nav className="-mx-4 flex gap-2 overflow-x-auto border-b border-slate-800/80 px-4 pb-3 sm:mx-0 sm:px-0">
          <DashboardNavLink href="/dashboard" label="Moje zlecenia" />
          <DashboardNavLink href="/dashboard/requests" label="Wszystkie zlecenia" active />
          <DashboardNavLink href="/add-request" label="Dodaj zlecenie" />
        </nav>

        <section className="min-w-0 space-y-6">

          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => {
                const requestOffers = offersByRequestId[String(request.id)] || [];
                const acceptedOffer = requestOffers.find(
                  (offer) => normalizeOfferStatus(offer.status) === "chosen"
                );

                return (
                  <Link
                    key={request.id}
                    href={"/dashboard/requests/" + request.id}
                    className={
                      isUrgentRequest(request.request_type)
                        ? "flex items-center gap-3 rounded-2xl border border-orange-500/50 bg-[#0d1218] px-3 py-3 transition hover:bg-[#101722] sm:gap-4 sm:px-4"
                        : "flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#0d1218] px-3 py-3 transition hover:bg-[#101722] sm:gap-4 sm:px-4"
                    }
                  >
                    <RequestCategoryImage
                      category={request.category}
                      title={request.title}
                      className="h-14 w-20 sm:h-16 sm:w-20"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-white">
                          {request.title || "Zlecenie bez tytułu"}
                        </h2>

                        <StatusBadge status={acceptedOffer ? "chosen" : request.status} />
                      </div>

                      <div className="mt-1 truncate text-sm font-medium text-gray-400">
                        {getRequestCategoryLabel(request.category)}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                        <span>{request.city || "Brak miejscowości"}</span>
                        <span>•</span>
                        <span>{formatDate(request.created_at)}</span>
                        <RequestPriorityMeta type={request.request_type} />
                        <span>•</span>
                        <span>{requestOffers.length} ofert</span>
                      </div>
                    </div>

                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-8 text-center">
              <div className="font-medium text-white">
                Nie masz jeszcze dodanych zleceń.
              </div>

              <p className="mt-2 text-sm text-gray-400">
                Dodaj pierwsze zlecenie, a odpowiedzi firm pojawią się tutaj.
              </p>

              <Link
                href="/add-request"
                className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Dodaj zlecenie
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

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-300">
      {getRequestStatusLabel(status)}
    </span>
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
