"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizeContractorRequestStatus } from "@/lib/statuses";
import RequestCategoryImage from "@/components/requests/RequestCategoryImage";
import { RequestPriorityMeta, isUrgentRequest } from "@/lib/requestPriority";
import { getRequestCategoryLabel } from "@/lib/requestCategories";

type RequestFilter = "all" | "new" | "read" | "answered" | "rejected" | "completed" | "cancelled";

type RequestItem = {
  id: string | number;
  title: string | null;
  category: string | null;
  description: string | null;
  city: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status: string | null;
  contractor_status: string | null;
  request_type: string | null;
  created_at: string | null;
  company_id: string | number | null;
  image_url: string | null;
  companies?: {
    name: string | null;
  } | null;
};

export default function DashboardMessagesPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [activeFilter, setActiveFilter] = useState<RequestFilter>("all");

  useEffect(() => {
    const loadRequests = async () => {
      const params = new URLSearchParams(window.location.search);
      const requestId = params.get("requestId") || "";
      setSelectedRequestId(requestId);

      const statusFilter = params.get("status") || "";
      if (isRequestFilter(statusFilter)) {
        setActiveFilter(statusFilter);
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

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
      const companyIds = userCompanies.map((company) => company.id);

      if (companyIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from("requests")
        .select("*, companies(name)")
        .in("company_id", companyIds)
        .order("created_at", { ascending: false });

      if (requestsError) {
        setErrorMessage(requestsError.message);
      } else {
        setRequests(requestsData || []);
      }

      setLoading(false);
    };

    loadRequests();
  }, []);

  const newRequests = requests.filter(
    (request) => getEffectiveStatus(request) === "new"
  );
  const readRequests = requests.filter(
    (request) => getEffectiveStatus(request) === "read"
  );
  const answeredRequests = requests.filter(
    (request) => getEffectiveStatus(request) === "answered"
  );
  const rejectedRequests = requests.filter(
    (request) => getEffectiveStatus(request) === "rejected"
  );
  const completedRequests = requests.filter(
    (request) => getEffectiveStatus(request) === "completed"
  );
  const cancelledRequests = requests.filter(
    (request) => getEffectiveStatus(request) === "cancelled"
  );

  const filteredRequests = requests.filter((request) =>
    matchesRequestFilter(request, activeFilter)
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie zapytań...
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
              Zapytania
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
              Prywatne zapytania wysłane z profili Twoich firm.
            </p>
          </div>
        </header>

        <nav className="-mx-4 flex gap-2 overflow-x-auto border-b border-slate-800/80 px-4 pb-3 sm:mx-0 sm:px-0">
          <DashboardNavLink href="/dashboard" label="Moje firmy" />
          <DashboardNavLink href="/add-company" label="Dodaj firmę" />
          <DashboardNavLink href="/dashboard/messages?status=new" label="Zapytania" active />
          <DashboardNavLink href="/dashboard/offers" label="Odpowiedzi" />
        </nav>

        <section className="min-w-0 space-y-6">
        {errorMessage && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2 sm:grid sm:min-w-0 sm:grid-cols-5 sm:gap-3">
            <SummaryCard label="Nowe" value={String(newRequests.length)} />
            <SummaryCard label="Przeczytane" value={String(readRequests.length)} />
            <SummaryCard label="Odpowiedziane" value={String(answeredRequests.length)} />
            <SummaryCard label="Odrzucone" value={String(rejectedRequests.length)} />
            <SummaryCard label="Zakończone" value={String(completedRequests.length)} />
          </div>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterButton label="Wszystkie" value="all" count={requests.length} activeFilter={activeFilter} onClick={setActiveFilter} />
          <FilterButton label="Nowe" value="new" count={newRequests.length} activeFilter={activeFilter} onClick={setActiveFilter} />
          <FilterButton label="Przeczytane" value="read" count={readRequests.length} activeFilter={activeFilter} onClick={setActiveFilter} />
          <FilterButton label="Odpowiedziane" value="answered" count={answeredRequests.length} activeFilter={activeFilter} onClick={setActiveFilter} />
          <FilterButton label="Odrzucone" value="rejected" count={rejectedRequests.length} activeFilter={activeFilter} onClick={setActiveFilter} />
          <FilterButton label="Zakończone" value="completed" count={completedRequests.length} activeFilter={activeFilter} onClick={setActiveFilter} />
          <FilterButton label="Anulowane" value="cancelled" count={cancelledRequests.length} activeFilter={activeFilter} onClick={setActiveFilter} />
        </div>

        {filteredRequests.length > 0 ? (
          <section className="space-y-3">
            {filteredRequests.map((request) => (
              <Link
                id={`request-${request.id}`}
                key={request.id}
                href={`/dashboard/messages/${request.id}`}
                className={[
                  "flex items-center gap-3 rounded-2xl border px-3 py-3 transition sm:gap-4 sm:px-4",
                  String(request.id) === selectedRequestId
                    ? "border-slate-700 bg-[#101722] hover:bg-[#111a26]"
                    : "border-slate-800 bg-[#0d1218] hover:bg-[#101722]",
                  isUrgentRequest(request.request_type)
                    ? "border-orange-500/50"
                    : "",
                ].join(" ")}
              >
                <RequestCategoryImage
                  category={request.category}
                  title={request.title}
                  className="h-14 w-20 sm:h-16 sm:w-20"
                />

                <div className="min-w-0 flex-1">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white">
                      {request.title || "Zapytanie bez tytułu"}
                    </h2>

                    <div className="mt-1 truncate text-sm font-medium text-gray-400">
                      {getRequestCategoryLabel(request.category)}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                      <span>{request.city || "Brak miejscowości"}</span>
                      <span>•</span>
                      <span>{formatDate(request.created_at)}</span>
                      <RequestPriorityMeta type={request.request_type} />
                    </div>
                  </div>
                </div>

              </Link>
            ))}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-10 text-center">
            <h2 className="text-xl font-semibold text-white">
              {requests.length > 0 ? "Brak zapytań w tym statusie" : "Brak zapytań"}
            </h2>

            <p className="mt-3 text-sm text-gray-400">
              {requests.length > 0
                ? "Wybierz inny filtr, aby zobaczyć pozostałe zapytania."
                : "Gdy klient wyśle zapytanie z profilu Twojej firmy, pojawi się ono w tym miejscu."}
            </p>
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

function FilterButton({
  label,
  value,
  count,
  activeFilter,
  onClick,
}: {
  label: string;
  value: RequestFilter;
  count: number;
  activeFilter: RequestFilter;
  onClick: (value: RequestFilter) => void;
}) {
  const active = activeFilter === value;

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={
        active
          ? "shrink-0 rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-950"
          : "shrink-0 rounded-full border border-slate-800 px-4 py-2 text-sm text-gray-500 transition hover:border-slate-600 hover:text-white"
      }
    >
      {label} <span className={active ? "text-slate-600" : "text-gray-600"}>{count}</span>
    </button>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-[132px] shrink-0 items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0d1218] px-3 py-2.5 sm:w-auto sm:px-4">
      <div className="truncate text-xs font-medium text-gray-500 sm:text-sm">{label}</div>
      <div className="text-base font-semibold text-white">{value}</div>
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

function isRequestFilter(value: string): value is RequestFilter {
  return ["all", "new", "read", "answered", "rejected", "completed", "cancelled"].includes(value);
}

function matchesRequestFilter(request: RequestItem, filter: RequestFilter) {
  if (filter === "all") return true;
  return getEffectiveStatus(request) === filter;
}

function getEffectiveStatus(request: RequestItem) {
  if (request.status === "cancelled" || request.status === "canceled") {
    return "cancelled";
  }

  if (request.status === "completed" || request.status === "closed") {
    return "completed";
  }

  return normalizeContractorRequestStatus(request.contractor_status);
}
