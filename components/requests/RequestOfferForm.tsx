"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getRequestStatusLabel, isRequestOpen } from "@/lib/statuses";

type Company = {
  id: string | number;
  name: string;
};

type Offer = {
  id: string | number;
  company_id: string | number;
  message: string | null;
  price_estimate: string | null;
  availability: string | null;
  created_at: string | null;
  companies?: {
    name: string | null;
  } | null;
};

type Props = {
  requestId: string | number;
  requestStatus?: string | null;
};

export default function RequestOfferForm({ requestId, requestStatus }: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [message, setMessage] = useState("");
  const [priceEstimate, setPriceEstimate] = useState("");
  const [availability, setAvailability] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const requestOpen = isRequestOpen(requestStatus);

  const selectedCompanyAlreadyAnswered = useMemo(
    () => offers.some((offer) => String(offer.company_id) === companyId),
    [companyId, offers]
  );

  useEffect(() => {
    const loadUserCompanies = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (companiesError) {
        setErrorMessage(companiesError.message);
        setLoading(false);
        return;
      }

      const userCompanies = companiesData || [];
      setCompanies(userCompanies);

      if (userCompanies.length > 0) {
        setCompanyId(String(userCompanies[0].id));

        const companyIds = userCompanies.map((company) => company.id);

        const { data: offersData, error: offersError } = await supabase
          .from("request_offers")
          .select("*, companies(name)")
          .eq("request_id", requestId)
          .in("company_id", companyIds)
          .order("created_at", { ascending: false });

        if (offersError) {
          setErrorMessage(offersError.message);
        } else {
          setOffers(offersData || []);
        }
      }

      setLoading(false);
    };

    loadUserCompanies();
  }, [requestId]);

  const submitOffer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!requestOpen) {
      setErrorMessage("To zlecenie nie przyjmuje już nowych odpowiedzi.");
      return;
    }

    if (!companyId) {
      setErrorMessage("Wybierz firmę, którą chcesz odpowiedzieć na zlecenie.");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Dodaj krótką wiadomość do klienta.");
      return;
    }

    if (selectedCompanyAlreadyAnswered) {
      setErrorMessage("Ta firma już odpowiedziała na to zlecenie.");
      return;
    }

    setSubmitting(true);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      setSubmitting(false);
      setErrorMessage("Zaloguj się ponownie, aby wysłać odpowiedź.");
      return;
    }

    try {
      const response = await fetch("/api/request-offers", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + session.access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          companyId,
          message: message.trim(),
          priceEstimate: priceEstimate.trim(),
          availability: availability.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data?.error || "Nie udało się wysłać odpowiedzi.");
        setSubmitting(false);
        return;
      }

      setOffers((currentOffers) => [data.offer, ...currentOffers]);
      setMessage("");
      setPriceEstimate("");
      setAvailability("");
      setSuccessMessage(
        data.mailWarning
          ? "Odpowiedź została wysłana, ale mail do klienta nie został wysłany: " + data.mailWarning
          : "Odpowiedź została wysłana. Klient dostał powiadomienie mailowe."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Nie udało się wysłać odpowiedzi."
      );
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <section className="mt-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-8 text-gray-400">
        Ładowanie formularza odpowiedzi...
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="mt-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
        <h2 className="text-2xl font-semibold text-white">
          Odpowiedz na zlecenie
        </h2>

        <p className="mt-3 max-w-2xl text-gray-400">
          Zaloguj się jako wykonawca, żeby wysłać klientowi odpowiedź z profilu swojej firmy.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Zaloguj
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-orange-500 hover:text-white"
          >
            Załóż konto
          </Link>
        </div>
      </section>
    );
  }

  if (companies.length === 0) {
    return (
      <section className="mt-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
        <h2 className="text-2xl font-semibold text-white">
          Odpowiedz na zlecenie
        </h2>

        <p className="mt-3 max-w-2xl text-gray-400">
          Najpierw dodaj profil firmy. Odpowiedzi na zlecenia są wysyłane z konkretnego profilu wykonawcy.
        </p>

        <Link
          href="/add-company"
          className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Dodaj firmę
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Odpowiedz na zlecenie
          </h2>

          <p className="mt-2 text-gray-400">
            Wyślij krótką wiadomość z profilu swojej firmy.
          </p>
        </div>

        {offers.length > 0 && (
          <Link
            href="/dashboard/offers"
            className="text-sm font-medium text-orange-400 hover:text-orange-300"
          >
            Moje odpowiedzi
          </Link>
        )}
      </div>

      {offers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-[#05070a] p-5">
          <div className="text-sm font-medium text-white">
            Wysłane odpowiedzi
          </div>

          <div className="mt-4 space-y-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="border-t border-slate-800 pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-gray-200">
                    {offer.companies?.name || "Firma"}
                  </div>

                  <div className="text-xs text-gray-500">
                    {formatDate(offer.created_at)}
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">
                  {offer.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!requestOpen && (
        <div className="mt-6 rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-400">
          Status zlecenia: {getRequestStatusLabel(requestStatus)}. Nie można już wysłać nowej odpowiedzi.
        </div>
      )}

      <form onSubmit={submitOffer} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-1">
            <span className="mb-2 block text-sm text-gray-400">
              Firma
            </span>

            <select
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block md:col-span-1">
            <span className="mb-2 block text-sm text-gray-400">
              Orientacyjna cena
            </span>

            <input
              value={priceEstimate}
              onChange={(event) => setPriceEstimate(event.target.value)}
              placeholder="np. do ustalenia / od 1200 zł"
              className="w-full rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-orange-500"
            />
          </label>

          <label className="block md:col-span-1">
            <span className="mb-2 block text-sm text-gray-400">
              Termin
            </span>

            <input
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              placeholder="np. w tym tygodniu"
              className="w-full rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-orange-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm text-gray-400">
            Wiadomość do klienta
          </span>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            placeholder="Napisz krótko, co możesz zaproponować, kiedy możesz zacząć i jak klient ma się z Tobą skontaktować."
            className="w-full resize-none rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 transition focus:border-orange-500"
          />
        </label>

        {selectedCompanyAlreadyAnswered && (
          <div className="rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-400">
            Wybrana firma już odpowiedziała na to zlecenie.
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-300">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || selectedCompanyAlreadyAnswered || !requestOpen}
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Wysyłanie..." : "Wyślij odpowiedź"}
        </button>
      </form>
    </section>
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
