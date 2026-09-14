"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  getOfferStatusLabel,
  getRequestStatusLabel,
  isRequestActive,
  isRequestClosed,
  normalizeOfferStatus,
} from "@/lib/statuses";
import { getRequestCategoryLabel } from "@/lib/requestCategories";

type CustomerRequest = {
  id: string | number;
  title: string | null;
  city: string | null;
  category: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
  access_token: string | null;
};

type OfferAction = "interested" | "chosen" | "rejected";

type Offer = {
  id: string | number;
  request_id: string | number;
  company_id: string | number;
  message: string | null;
  price_estimate: string | null;
  availability: string | null;
  status: string | null;
  created_at: string | null;
  companies?: {
    name: string | null;
    city: string | null;
    region: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  } | null;
};

export default function DashboardRequestDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requestId = params.id;

  const [request, setRequest] = useState<CustomerRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRequest = async () => {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: requestData, error } = await supabase
        .from("requests")
        .select("id, title, city, category, description, status, created_at, access_token")
        .eq("id", requestId)
        .eq("customer_id", data.user.id)
        .maybeSingle();

      if (error || !requestData) {
        if (error) console.error(error);
        setErrorMessage("Nie znaleziono zlecenia albo nie masz do niego dostępu.");
        setLoading(false);
        return;
      }

      setRequest(requestData);

      const { data: offersData, error: offersError } = await supabase
        .from("request_offers")
        .select("*, companies(name, city, region, phone, email, logo_url)")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });

      if (offersError) {
        console.error(offersError);
        setErrorMessage("Nie udało się pobrać odpowiedzi do tego zlecenia.");
      } else {
        setOffers(offersData || []);
      }

      setLoading(false);
    };

    loadRequest();
  }, [requestId]);

  const updateOfferStatus = async (
    offerId: string | number,
    status: OfferAction
  ) => {
    if (!request || isRequestClosed(request.status) || isRequestActive(request.status)) return;

    if (!request.access_token) {
      setErrorMessage("Brakuje prywatnego tokenu zlecenia.");
      return;
    }

    const actionKey = offerId + ":" + status;
    setActionLoadingId(actionKey);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/request-access/" + request.access_token + "/offers/" + offerId,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error || "Nie udało się zaktualizować oferty.");
        setActionLoadingId(null);
        return;
      }

      if (status === "interested") {
        setRequest({
          ...request,
          status: data.requestStatus || request.status,
        });
        setOffers((currentOffers) =>
          currentOffers.map((offer) =>
            offer.id === offerId ? { ...offer, status: "interested" } : offer
          )
        );
        setMessage(
          data.mailWarning
            ? "Wysłano prośbę o kontakt, ale mail do wykonawcy nie został wysłany: " + data.mailWarning
            : "Wysłano prośbę o kontakt. Firma dostała dane kontaktowe klienta."
        );
      }

      if (status === "chosen") {
        setRequest({ ...request, status: data.requestStatus || "active" });
        setOffers((currentOffers) =>
          currentOffers.map((offer) =>
            offer.id === offerId
              ? { ...offer, status: "chosen" }
              : { ...offer, status: "rejected" }
          )
        );
        setMessage(
          data.mailWarning
            ? "Firma została wybrana, ale mail do wykonawcy nie został wysłany: " + data.mailWarning
            : "Firma została oznaczona jako wybrany wykonawca. To będzie liczyć się do jej statystyk."
        );
      }

      if (status === "rejected") {
        setOffers((currentOffers) =>
          currentOffers.map((offer) =>
            offer.id === offerId ? { ...offer, status: "rejected" } : offer
          )
        );
        setMessage("Oferta została odrzucona.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się zaktualizować oferty."
      );
    }

    setActionLoadingId(null);
  };

  const completeRequest = async () => {
    if (!request) return;

    if (!window.confirm("Oznaczyć zlecenie jako zakończone?")) return;

    setActionLoadingId("request");
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("requests")
      .update({ status: "completed" })
      .eq("id", request.id);

    if (error) {
      setErrorMessage(error.message);
      setActionLoadingId(null);
      return;
    }

    setRequest({ ...request, status: "completed" });
    setMessage("Zlecenie zostało oznaczone jako zakończone.");
    setActionLoadingId(null);
  };

  const deleteRequest = async () => {
    if (!request) return;

    const confirmed = window.confirm(
      "Usunąć ogłoszenie? Zniknie z Twojego panelu oraz z listy zleceń. Tej akcji nie da się cofnąć."
    );

    if (!confirmed) return;

    setActionLoadingId("delete-request");
    setMessage("");
    setErrorMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setErrorMessage("Zaloguj się ponownie, aby usunąć ogłoszenie.");
      setActionLoadingId(null);
      return;
    }

    try {
      const response = await fetch("/api/dashboard/requests/" + request.id, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(data?.error || "Nie udało się usunąć ogłoszenia.");
        setActionLoadingId(null);
        return;
      }

      router.push("/dashboard/requests");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć ogłoszenia."
      );
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie zlecenia...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white lg:py-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[240px_1fr]">
        <DashboardSidebar active="requests" />

        <section className="min-w-0 space-y-6">
          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-slate-800 bg-[#0d1218] px-4 py-3 text-sm text-gray-300">
              {message}
            </div>
          )}

          {request && (
            <>
              <section className="border-b border-slate-800 pb-6">
                <Link
                  href="/dashboard/requests"
                  className="mb-5 inline-flex text-sm text-gray-500 transition hover:text-white"
                >
                  ← Powrót do zleceń
                </Link>

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-medium uppercase tracking-[0.18em] text-orange-400">
                      Moje zlecenie
                    </div>

                    <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                      {request.title || "Zlecenie bez tytułu"}
                    </h1>

                    <div className="mt-2 text-sm font-medium text-orange-400">
                      {getRequestCategoryLabel(request.category)}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
                      <span>{request.city || "Brak miejscowości"}</span>
                      <span>•</span>
                      <span>{formatDate(request.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} />

                    {isRequestActive(request.status) && (
                      <button
                        type="button"
                        onClick={completeRequest}
                        disabled={actionLoadingId === "request"}
                        className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Zakończ
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={deleteRequest}
                      disabled={actionLoadingId === "delete-request"}
                      className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Usuń ogłoszenie
                    </button>
                  </div>
                </div>

                <div className="mt-5 max-w-3xl">
                  <div className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-gray-600">
                    Opis
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                    {request.description || "Brak opisu zlecenia."}
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Odpowiedzi firm
                    </h2>

                    <p className="mt-1 text-sm text-gray-400">
                      Poproś wybrane firmy o kontakt, a po rozmowie oznacz wykonawcę, którego wybierasz.
                    </p>
                  </div>
                </div>

                {offers.length > 0 ? (
                  <div className="space-y-3">
                    {offers.map((offer) => {
                      const offerStatus = normalizeOfferStatus(offer.status);
                      const interested = offerStatus === "interested";
                      const chosen = offerStatus === "chosen";
                      const rejected = offerStatus === "rejected";
                      const profileHref = "/company/" + offer.company_id;

                      return (
                      <article
                        key={offer.id}
                        className="rounded-2xl border border-slate-800 bg-[#0d1218] px-4 py-4 transition hover:bg-[#101722]"
                      >
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <Link
                                href={profileHref}
                                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-black transition hover:border-orange-500"
                                aria-label={"Profil firmy " + (offer.companies?.name || "")}
                              >
                                {offer.companies?.logo_url ? (
                                  <img
                                    src={offer.companies.logo_url}
                                    alt={offer.companies.name || "Firma"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] text-gray-500">Logo</span>
                                )}
                              </Link>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={profileHref}
                                    className="font-semibold text-white transition hover:text-orange-400"
                                  >
                                    {offer.companies?.name || "Firma"}
                                  </Link>

                                  <OfferStatusBadge status={offer.status} />
                                </div>

                                <div className="mt-1 text-xs text-gray-500">
                                  {[offer.companies?.city, offer.companies?.region]
                                    .filter(Boolean)
                                    .join(", ") || "Brak lokalizacji"}
                                </div>
                              </div>
                            </div>

                            <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                              {offer.message}
                            </p>

                            {(offer.price_estimate || offer.availability) && (
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                {offer.price_estimate && (
                                  <span>
                                    Cena: {offer.price_estimate}
                                  </span>
                                )}

                                {offer.availability && (
                                  <span>
                                    Termin: {offer.availability}
                                  </span>
                                )}
                              </div>
                            )}

                            {(interested || chosen) && (offer.companies?.phone || offer.companies?.email) && (
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                                {offer.companies.phone && (
                                  <a href={"tel:" + offer.companies.phone} className="hover:text-white">
                                    {offer.companies.phone}
                                  </a>
                                )}
                                {offer.companies.email && (
                                  <a href={"mailto:" + offer.companies.email} className="hover:text-white">
                                    {offer.companies.email}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">

                            {!interested && !chosen && !rejected && (
                              <button
                                type="button"
                                onClick={() => updateOfferStatus(offer.id, "interested")}
                                disabled={actionLoadingId === offer.id + ":interested" || isRequestClosed(request.status) || isRequestActive(request.status)}
                                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Poproś o kontakt
                              </button>
                            )}

                            {interested && (
                              <span className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm text-gray-300">
                                Kontakt wysłany
                              </span>
                            )}

                            {interested && (
                              <button
                                type="button"
                                onClick={() => updateOfferStatus(offer.id, "chosen")}
                                disabled={actionLoadingId === offer.id + ":chosen" || isRequestClosed(request.status) || isRequestActive(request.status)}
                                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Wybrałem tę firmę
                              </button>
                            )}

                            {chosen && (
                              <span className="rounded-lg bg-orange-500 px-4 py-2 text-center text-sm font-semibold text-white">
                                Wybrana firma
                              </span>
                            )}

                            {!chosen && !rejected && (
                              <button
                                type="button"
                                onClick={() => updateOfferStatus(offer.id, "rejected")}
                                disabled={actionLoadingId === offer.id + ":rejected" || isRequestClosed(request.status) || isRequestActive(request.status)}
                                className="rounded-lg border border-slate-800 px-4 py-2 text-sm text-gray-300 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Odrzuć
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-8 text-center text-gray-400">
                    To zlecenie nie ma jeszcze odpowiedzi firm.
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardSidebar({
  active,
}: {
  active: "companies" | "requests" | "messages" | "offers" | "settings";
}) {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] lg:border-r lg:border-slate-800 lg:pr-6">
      <nav className="-mx-4 flex gap-1 overflow-x-auto border-y border-slate-800 px-4 py-3 lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:border-0 lg:px-0 lg:py-0">
        <DashboardLink href="/dashboard#companies" label="Moje firmy" active={active === "companies"} />
        <DashboardLink href="/dashboard/requests" label="Moje zlecenia" active={active === "requests"} />
        <DashboardLink href="/add-company" label="Dodaj firmę" />
        <DashboardLink href="/dashboard/messages?status=new" label="Zapytania" active={active === "messages"} />
        <DashboardLink href="/dashboard/offers" label="Odpowiedzi" active={active === "offers"} />
      </nav>

    </aside>
  );
}

function DashboardLink({
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
          ? "flex shrink-0 items-center gap-2 rounded-lg bg-[#0d1218] px-3 py-2 text-sm font-medium text-white lg:px-4 lg:py-3"
          : "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-[#0d1218] hover:text-white lg:px-4 lg:py-3"
      }
    >
      {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-gray-300">
      {getRequestStatusLabel(status)}
    </span>
  );
}

function OfferStatusBadge({ status }: { status: string | null }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-gray-300">
      {getOfferStatusLabel(status)}
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
