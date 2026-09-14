"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getOfferStatusLabel,
  getRequestStatusLabel,
  isRequestActive,
  isRequestClosed,
  isRequestOpen,
  normalizeOfferStatus,
} from "@/lib/statuses";
import { getRequestCategoryLabel } from "@/lib/requestCategories";

type RequestData = {
  id: string | number;
  title: string | null;
  city: string | null;
  category: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
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
    id: string | number;
    name: string | null;
    city: string | null;
    region: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  } | null;
};

export default function RequestAccessPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [request, setRequest] = useState<RequestData | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRequest = async () => {
      try {
        const response = await fetch("/api/request-access/" + token);
        const data = await response.json();

        if (!response.ok) {
          setErrorMessage(
            data?.error || "Link do zlecenia jest nieprawidłowy albo wygasł."
          );
          setLoading(false);
          return;
        }

        setRequest(data.request);
        setOffers(data.offers || []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Nie udało się pobrać zlecenia."
        );
      }

      setLoading(false);
    };

    loadRequest();
  }, [token]);

  const updateOfferStatus = async (
    offerId: string | number,
    status: OfferAction
  ) => {
    if (!request || isRequestClosed(request.status) || isRequestActive(request.status)) return;

    const actionKey = offerId + ":" + status;
    setActionLoadingId(actionKey);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/request-access/" + token + "/offers/" + offerId,
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

  const updateRequestStatus = async (status: "completed" | "cancelled") => {
    if (!request) return;

    const confirmed = window.confirm(
      status === "completed"
        ? "Oznaczyć zlecenie jako zakończone?"
        : "Anulować zlecenie? Firmy nie będą mogły już wysyłać odpowiedzi."
    );

    if (!confirmed) return;

    setActionLoadingId("request");
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/request-access/" + token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error || "Nie udało się zaktualizować zlecenia.");
        setActionLoadingId(null);
        return;
      }

      if (status === "cancelled") {
        setOffers((currentOffers) =>
          currentOffers.map((offer) =>
            normalizeOfferStatus(offer.status) === "chosen"
              ? offer
              : { ...offer, status: "rejected" }
          )
        );
      }

      setRequest({ ...request, status });
      setMessage(
        status === "completed"
          ? "Zlecenie zostało oznaczone jako zakończone."
          : "Zlecenie zostało anulowane."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nie udało się zaktualizować zlecenia."
      );
    }

    setActionLoadingId(null);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie zlecenia...
      </main>
    );
  }

  if (!request) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4 text-white">
        <div className="max-w-lg rounded-2xl border border-slate-800 bg-[#0d1218] p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Nie znaleziono zlecenia</h1>
          <p className="mt-3 text-gray-400">{errorMessage}</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white">
            Strona główna
          </Link>
        </div>
      </main>
    );
  }

  const canManageOffers = !isRequestClosed(request.status) && !isRequestActive(request.status);

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6 lg:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.18em] text-orange-400">
                Prywatny dostęp do zlecenia
              </div>

              <h1 className="mt-2 text-3xl font-bold text-white lg:text-4xl">
                {request.title || "Zlecenie bez tytułu"}
              </h1>

              <div className="mt-2 text-sm font-medium text-orange-400">
                {getRequestCategoryLabel(request.category)}
              </div>

              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
                <span>{request.city || "Brak miejscowości"}</span>
                <span>{formatDate(request.created_at)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />

              {isRequestOpen(request.status) && (
                <button
                  type="button"
                  onClick={() => updateRequestStatus("cancelled")}
                  disabled={actionLoadingId === "request"}
                  className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-[#070b10] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anuluj
                </button>
              )}

              {isRequestActive(request.status) && (
                <button
                  type="button"
                  onClick={() => updateRequestStatus("completed")}
                  disabled={actionLoadingId === "request"}
                  className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Zakończ
                </button>
              )}
            </div>
          </div>

          {request.description && (
            <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-gray-300">
              {request.description}
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#05070a] p-5">
            <div className="text-sm font-medium text-white">Dane klienta</div>
            <div className="mt-3 grid gap-3 text-sm text-gray-400 sm:grid-cols-3">
              <div>{request.customer_name || "Brak imienia"}</div>
              <div>{request.customer_phone || "Brak telefonu"}</div>
              <div className="truncate">{request.customer_email || "Brak emaila"}</div>
            </div>
          </div>
        </section>

        {(message || errorMessage) && (
          <div className="space-y-3">
            {message && (
              <div className="rounded-xl border border-slate-800 bg-[#0d1218] px-4 py-3 text-sm text-gray-300">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Odpowiedzi firm</h2>
              <p className="mt-1 text-sm text-gray-400">
                Poproś wybrane firmy o kontakt, a po rozmowie oznacz wykonawcę, którego wybierasz.
              </p>
            </div>

            <Link href="/register" className="text-sm font-medium text-orange-400 hover:text-orange-300">
              Zapisz zlecenie na koncie
            </Link>
          </div>

          {offers.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1218]">
              {offers.map((offer) => {
                const offerStatus = normalizeOfferStatus(offer.status);
                const interested = offerStatus === "interested";
                const chosen = offerStatus === "chosen";
                const rejected = offerStatus === "rejected";
                const profileHref = "/company/" + offer.company_id;

                return (
                  <article key={offer.id} className="border-b border-slate-800 px-4 py-4 last:border-b-0">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <Link
                            href={profileHref}
                            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-black transition hover:border-orange-500"
                            aria-label={"Profil firmy " + (offer.companies?.name || "")}
                          >
                            {offer.companies?.logo_url ? (
                              <Image
                                src={offer.companies.logo_url}
                                alt={offer.companies.name || "Firma"}
                                fill
                                sizes="40px"
                                className="object-cover"
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

                      <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">

                        {!interested && !chosen && !rejected && (
                          <button
                            type="button"
                            onClick={() => updateOfferStatus(offer.id, "interested")}
                            disabled={!canManageOffers || actionLoadingId === offer.id + ":interested"}
                            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Poproś o kontakt
                          </button>
                        )}

                        {interested && (
                          <span className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-gray-300">
                            Kontakt wysłany
                          </span>
                        )}

                        {interested && (
                          <button
                            type="button"
                            onClick={() => updateOfferStatus(offer.id, "chosen")}
                            disabled={!canManageOffers || actionLoadingId === offer.id + ":chosen"}
                            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Wybrałem tę firmę
                          </button>
                        )}

                        {chosen && (
                          <span className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                            Wybrana firma
                          </span>
                        )}

                        {!chosen && !rejected && (
                          <button
                            type="button"
                            onClick={() => updateOfferStatus(offer.id, "rejected")}
                            disabled={!canManageOffers || actionLoadingId === offer.id + ":rejected"}
                            className="rounded-lg px-4 py-2 text-sm text-gray-300 transition hover:bg-[#070b10] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
              Nie ma jeszcze odpowiedzi firm. Gdy wykonawca odpowie, zobaczysz ofertę tutaj.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-300">
      {getRequestStatusLabel(status)}
    </span>
  );
}

function OfferStatusBadge({ status }: { status: string | null }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-300">
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
