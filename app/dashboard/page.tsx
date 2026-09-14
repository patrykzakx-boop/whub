"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  getRequestStatusLabel,
  isNewContractorRequest,
  normalizeOfferStatus,
} from "@/lib/statuses";
import { getRequestCategoryLabel } from "@/lib/requestCategories";
import { RequestPriorityMeta, isUrgentRequest } from "@/lib/requestPriority";

type DashboardMode = "client" | "contractor";

type DashboardCompany = {
  id: string | number;
  name: string;
  logo_url: string | null;
  city: string | null;
  region: string | null;
  status: string | null;
  moderation_status: string | null;
};

type PrivateRequest = {
  id: string | number;
  title: string | null;
  city: string | null;
  category: string | null;
  status: string | null;
  contractor_status: string | null;
  request_type: string | null;
  created_at: string | null;
  company_id: string | number | null;
  companies?: {
    name: string | null;
  } | null;
};

type ClientRequest = {
  id: string | number;
  title: string | null;
  city: string | null;
  category: string | null;
  status: string | null;
  request_type: string | null;
  created_at: string | null;
};

type DashboardOffer = {
  id: string | number;
  status: string | null;
  request_id: string | number;
};

export default function DashboardPage() {
  const [mode, setMode] = useState<DashboardMode>("client");
  const [companies, setCompanies] = useState<DashboardCompany[]>([]);
  const [privateRequests, setPrivateRequests] = useState<PrivateRequest[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [offers, setOffers] = useState<DashboardOffer[]>([]);
  const [clientRequestOffers, setClientRequestOffers] = useState<DashboardOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data.user) {
        window.location.href = "/login";
        return;
      }

      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", data.user.id)
        .order("created_at", { ascending: false });

      if (companiesError) {
        setErrorMessage(companiesError.message);
      }

      const userCompanies = companiesData || [];
      setCompanies(userCompanies);

      const storedMode = window.localStorage.getItem("dashboard_mode") as DashboardMode | null;
      if (storedMode === "client" || storedMode === "contractor") {
        setMode(storedMode);
      } else {
        setMode(userCompanies.length > 0 ? "contractor" : "client");
      }

      const companyIds = userCompanies.map((company) => company.id);

      if (companyIds.length > 0) {
        const { data: requestsData, error: requestsError } = await supabase
          .from("requests")
          .select("id, title, city, category, status, contractor_status, request_type, created_at, company_id, companies(name)")
          .in("company_id", companyIds)
          .order("created_at", { ascending: false });

        if (requestsError) {
          setErrorMessage(requestsError.message);
        } else {
          setPrivateRequests(
            (requestsData || []).map((request) => ({
              ...request,
              companies: Array.isArray(request.companies)
                ? request.companies[0] || null
                : request.companies,
            }))
          );
        }
      }

      const { data: offersData, error: offersError } = await supabase
        .from("request_offers")
        .select("id, status, request_id")
        .eq("owner_id", data.user.id)
        .order("created_at", { ascending: false });

      if (offersError) {
        setErrorMessage(offersError.message);
      } else {
        setOffers(offersData || []);
      }

      const { data: clientRequestsData, error: clientRequestsError } = await supabase
        .from("requests")
        .select("id, title, city, category, status, request_type, created_at")
        .eq("customer_id", data.user.id)
        .order("created_at", { ascending: false });

      if (clientRequestsError) {
        setErrorMessage(clientRequestsError.message);
      } else {
        const userRequests = clientRequestsData || [];
        setClientRequests(userRequests);

        const requestIds = userRequests.map((request) => request.id);
        if (requestIds.length > 0) {
          const { data: requestOffersData, error: requestOffersError } = await supabase
            .from("request_offers")
            .select("id, status, request_id")
            .in("request_id", requestIds);

          if (requestOffersError) {
            setErrorMessage(requestOffersError.message);
          } else {
            setClientRequestOffers(requestOffersData || []);
          }
        }
      }

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const changeMode = (nextMode: DashboardMode) => {
    setMode(nextMode);
    window.localStorage.setItem("dashboard_mode", nextMode);
  };

  const publishedCompanies = companies.filter(
    (company) => company.status === "published" && company.moderation_status === "approved"
  ).length;

  const draftCompanies = companies.filter(
    (company) => company.status !== "published" || company.moderation_status !== "approved"
  ).length;

  const newPrivateRequests = privateRequests.filter((request) =>
    isNewContractorRequest(request.contractor_status) &&
    request.status !== "cancelled" &&
    request.status !== "canceled" &&
    request.status !== "completed" &&
    request.status !== "closed"
  );
  const latestPrivateRequests = newPrivateRequests.slice(0, 3);
  const acceptedOffers = offers.filter((offer) => normalizeOfferStatus(offer.status) === "chosen");

  const clientOffersByRequestId = useMemo(() => {
    return clientRequestOffers.reduce<Record<string, DashboardOffer[]>>((acc, offer) => {
      const key = String(offer.request_id);
      acc[key] = acc[key] || [];
      acc[key].push(offer);
      return acc;
    }, {});
  }, [clientRequestOffers]);

  const clientOpenRequests = clientRequests.filter(
    (request) => !request.status || request.status === "new"
  );
  const clientActiveRequests = clientRequests.filter(
    (request) => request.status === "active"
  );
  const clientCompletedRequests = clientRequests.filter(
    (request) => request.status === "completed" || request.status === "closed"
  );

  const updateCompanyStatus = async (
    companyId: string | number,
    status: "published" | "draft"
  ) => {
    setActionLoadingId(companyId);
    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("companies")
      .update({ status })
      .eq("id", companyId)
      .eq("owner_id", user.id);

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setCompanies((currentCompanies) =>
      currentCompanies.map((company) =>
        company.id === companyId ? { ...company, status } : company
      )
    );

    setMessage(
      status === "published"
        ? "Firma będzie publiczna po zatwierdzeniu przez administratora."
        : "Firma została ukryta z katalogu."
    );
  };

  const deleteCompany = async (companyId: string | number) => {
    const confirmed = window.confirm(
      "Usunąć tę firmę? Tej operacji nie da się cofnąć."
    );

    if (!confirmed) return;

    setActionLoadingId(companyId);
    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", companyId)
      .eq("owner_id", user.id);

    setActionLoadingId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setCompanies((currentCompanies) =>
      currentCompanies.filter((company) => company.id !== companyId)
    );

    setMessage("Firma została usunięta.");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie panelu...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-5 text-white lg:py-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
                {mode === "client" ? "Tryb klienta" : "Tryb wykonawcy"}
              </div>

              <h1 className="mt-1.5 text-2xl font-semibold text-white">
                {mode === "client" ? "Panel klienta" : "Panel wykonawcy"}
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
                {mode === "client"
                  ? "Zarządzaj swoimi zleceniami i odpowiedziami od wykonawców."
                  : "Zarządzaj firmami, zapytaniami i odpowiedziami wysłanymi do klientów."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800/90 bg-[#070b10] p-1">
                <button
                  type="button"
                  onClick={() => changeMode("client")}
                  className={
                    mode === "client"
                      ? "rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:text-white"
                  }
                >
                  Klient
                </button>

                <button
                  type="button"
                  onClick={() => changeMode("contractor")}
                  className={
                    mode === "contractor"
                      ? "rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-lg px-4 py-2 text-sm text-gray-500 transition hover:text-white"
                  }
                >
                  Wykonawca
                </button>
              </div>
            </div>
          </div>
        </section>

        <nav className="-mx-4 flex gap-2 overflow-x-auto border-b border-slate-800/80 px-4 pb-3 sm:mx-0 sm:px-0">
          {mode === "client" ? (
            <>
              <DashboardLink href="/dashboard" label="Moje zlecenia" active />
              <DashboardLink href="/dashboard/requests" label="Wszystkie zlecenia" />
              <DashboardLink href="/add-request" label="Dodaj zlecenie" />
              <DashboardLink href="/dashboard/account" label="Konto i hasło" />
            </>
          ) : (
            <>
              <DashboardLink href="/dashboard" label="Moje firmy" active />
              <DashboardLink href="/add-company" label="Dodaj firmę" />
              <DashboardLink
                href="/dashboard/messages?status=new"
                label="Zapytania"
                count={newPrivateRequests.length}
              />
              <DashboardLink href="/dashboard/offers" label="Odpowiedzi" />
              <DashboardLink href="/dashboard/account" label="Konto i hasło" />
            </>
          )}
        </nav>

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

        {mode === "client" ? (
          <ClientDashboard
            requests={clientRequests}
            offersByRequestId={clientOffersByRequestId}
            openCount={clientOpenRequests.length}
            activeCount={clientActiveRequests.length}
            completedCount={clientCompletedRequests.length}
          />
        ) : (
          <ContractorDashboard
            companies={companies}
            publishedCompanies={publishedCompanies}
            draftCompanies={draftCompanies}
            newRequests={newPrivateRequests}
            latestRequests={latestPrivateRequests}
            acceptedOffers={acceptedOffers}
            actionLoadingId={actionLoadingId}
            onUpdateCompanyStatus={updateCompanyStatus}
            onDeleteCompany={deleteCompany}
          />
        )}
      </div>
    </main>
  );
}

function ClientDashboard({
  requests,
  offersByRequestId,
  openCount,
  activeCount,
  completedCount,
}: {
  requests: ClientRequest[];
  offersByRequestId: Record<string, DashboardOffer[]>;
  openCount: number;
  activeCount: number;
  completedCount: number;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Moje zlecenia
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Zlecenia dodane z Twojego konta.
            </p>
          </div>

          <Link
            href="/dashboard/requests"
            className="shrink-0 text-sm font-medium text-orange-400 hover:text-orange-300"
          >
            Wszystkie
          </Link>
        </div>

        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.slice(0, 5).map((request) => {
              const requestOffers = offersByRequestId[String(request.id)] || [];

              return (
                <article
                  key={request.id}
                  className={[
                    "rounded-2xl border bg-[#0d1218] px-4 py-3 transition hover:bg-[#101722]",
                    isUrgentRequest(request.request_type)
                      ? "border-orange-500/55"
                      : "border-slate-800",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-white">
                          {request.title || "Zlecenie bez tytułu"}
                        </h3>
                        <RequestStatusBadge status={request.status} />
                      </div>

                      <div className="mt-1 truncate text-sm font-medium text-gray-400">
                        {getRequestCategoryLabel(request.category)}
                      </div>

                      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span>{request.city || "Brak miejscowości"}</span>
                        <span>{formatDate(request.created_at)}</span>
                        <RequestPriorityMeta type={request.request_type} />
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm">
                      <div className="text-gray-500">
                        {requestOffers.length} ofert
                      </div>

                      <Link
                        href={"/dashboard/requests/" + request.id}
                        className="font-medium text-orange-400 transition hover:text-orange-300"
                      >
                        Szczegóły
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-8 text-center">
            <div className="font-medium text-white">
              Nie masz jeszcze dodanych zleceń.
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Dodaj pierwsze zapytanie, a odpowiedzi wykonawców pojawią się tutaj.
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

      <SummaryPanel
        title="Podsumowanie"
        description="Krótki stan Twoich zleceń."
        items={[
          ["Moje zlecenia", String(requests.length)],
          ["Otwarte", String(openCount)],
          ["Wybrano wykonawcę", String(activeCount)],
          ["Zakończone", String(completedCount)],
        ]}
      />
    </div>
  );
}

function ContractorDashboard({
  companies,
  publishedCompanies,
  draftCompanies,
  newRequests,
  latestRequests,
  acceptedOffers,
  actionLoadingId,
  onUpdateCompanyStatus,
  onDeleteCompany,
}: {
  companies: DashboardCompany[];
  publishedCompanies: number;
  draftCompanies: number;
  newRequests: PrivateRequest[];
  latestRequests: PrivateRequest[];
  acceptedOffers: DashboardOffer[];
  actionLoadingId: string | number | null;
  onUpdateCompanyStatus: (companyId: string | number, status: "published" | "draft") => void;
  onDeleteCompany: (companyId: string | number) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section id="companies" className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Moje firmy
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Profile wykonawcy przypisane do Twojego konta.
              </p>
            </div>
          </div>

          {companies.length > 0 ? (
            <div className="space-y-3">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="rounded-2xl border border-slate-800 bg-[#0d1218] px-4 py-3 transition hover:bg-[#101722]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-black">
                        {company.logo_url ? (
                          <Image
                            src={company.logo_url}
                            alt={company.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">Logo</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-[15px] font-semibold text-white">
                            {company.name}
                          </h3>
                          <CompanyStatusBadge status={company.status} moderationStatus={company.moderation_status} />
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {[company.city, company.region].filter(Boolean).join(", ") || "Brak lokalizacji"}
                        </p>
                      </div>
                    </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm lg:justify-end">
                      {company.status === "published" && company.moderation_status === "approved" && (
                        <Link
                          href={"/company/" + company.id}
                          className="text-gray-400 transition hover:text-white"
                        >
                          Profil
                        </Link>
                      )}

                      <Link
                        href={"/dashboard/company/" + company.id + "/edit"}
                        className="font-medium text-orange-400 transition hover:text-orange-300"
                      >
                        Edytuj dane
                      </Link>

                      <Link
                        href={"/dashboard/company/" + company.id + "/gallery"}
                        className="text-gray-400 transition hover:text-white"
                      >
                        Galeria zdjęć
                      </Link>

                      {company.status === "published" ? (
                        <button
                          type="button"
                          onClick={() => onUpdateCompanyStatus(company.id, "draft")}
                          disabled={actionLoadingId === company.id}
                          className="text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Ukryj
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateCompanyStatus(company.id, "published")}
                          disabled={actionLoadingId === company.id}
                          className="text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Opublikuj
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteCompany(company.id)}
                        disabled={actionLoadingId === company.id}
                          className="text-gray-600 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-8 text-center">
              <div className="font-medium text-white">
                Nie masz jeszcze dodanej firmy.
              </div>
              <p className="mt-2 text-sm text-gray-400">
                Dodaj profil firmy, żeby odpowiadać na zlecenia jako wykonawca.
              </p>
              <Link
                href="/add-company"
                className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Dodaj firmę
              </Link>
            </div>
          )}
        </section>

        <aside className="min-w-0 space-y-6">
          <SummaryPanel
            title="Podsumowanie"
            description="Krótki stan konta wykonawcy."
            items={[
              ["Moje firmy", String(companies.length)],
              ["Opublikowane", String(publishedCompanies)],
              ["Ukryte", String(draftCompanies)],
              ["Nowe zapytania", String(newRequests.length)],
              ["Wygrane zlecenia", String(acceptedOffers.length)],
            ]}
          />

          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Nowe zapytania
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Wiadomości wysłane bezpośrednio do Twoich firm.
              </p>
            </div>

            <Link
              href="/dashboard/messages?status=new"
              className="shrink-0 text-sm font-medium text-orange-400 hover:text-orange-300"
            >
              Wszystkie
            </Link>
          </div>

          <div className={latestRequests.length > 0 ? "space-y-3" : ""}>
            {latestRequests.length > 0 ? (
              latestRequests.map((request) => (
                <Link
                  key={request.id}
                  href={"/dashboard/messages/" + request.id}
                  className={[
                    "block rounded-2xl border bg-[#0d1218] px-4 py-3 transition hover:bg-[#101722]",
                    isUrgentRequest(request.request_type)
                      ? "border-orange-500/55"
                      : "border-slate-800",
                  ].join(" ")}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {request.title || "Zapytanie bez tytułu"}
                    </div>
                    <div className="mt-1 truncate text-xs text-gray-500">
                      {getRequestCategoryLabel(request.category)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500">
                      <span>{request.city || "Brak miejscowości"}</span>
                      <span>{formatDate(request.created_at)}</span>
                      <RequestPriorityMeta type={request.request_type} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-slate-800 bg-[#0d1218] p-5 text-sm text-gray-400">
                Brak nowych zapytań do Twoich firm.
              </p>
            )}
          </div>
        </aside>
    </div>
  );
}

function DashboardLink({
  href,
  label,
  active = false,
  count = 0,
}: {
  href: string;
  label: string;
  active?: boolean;
  count?: number;
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
      <span>{label}</span>
      {count > 0 && (
        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function SummaryPanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Array<[string, string]>;
}) {
  return (
    <section className="h-fit rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4">
      <h2 className="text-base font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-xs leading-5 text-gray-600">
        {description}
      </p>

      <div className="mt-3 divide-y divide-slate-800/80">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="text-sm text-gray-500">
              {label}
            </span>

            <span className="text-sm font-semibold text-white">
              {value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function RequestStatusBadge({ status }: { status: string | null }) {
  return (
    <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-medium text-gray-300">
      {getRequestStatusLabel(status)}
    </span>
  );
}

function CompanyStatusBadge({ status, moderationStatus }: { status: string | null; moderationStatus: string | null }) {
  const published = status === "published";
  const approved = moderationStatus === "approved";
  const rejected = moderationStatus === "rejected";
  const label = !published ? "Ukryta" : approved ? "Opublikowana" : rejected ? "Odrzucona" : "Oczekuje na akceptację";

  return (
    <span
      className={
        published && approved
          ? "inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-300"
          : "inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-gray-500"
      }
    >
      {label}
    </span>
  );
}
