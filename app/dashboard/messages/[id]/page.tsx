"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getRequestCategoryLabel } from "@/lib/requestCategories";

type ContractorStatus = "new" | "read" | "answered" | "rejected" | "completed";

type RequestDetails = {
  id: string | number;
  title: string | null;
  category: string | null;
  description: string | null;
  city: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  request_type: string | null;
  status: string | null;
  contractor_status: string | null;
  created_at: string | null;
  company_id: string | number | null;
  image_url: string | null;
  image_urls?: string[] | null;
  companies?: {
    name: string | null;
  } | null;
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function DashboardMessageDetailsPage({ params }: Props) {
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadRequest = async () => {
      const { id } = await params;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("requests")
        .select("*, companies!inner(name, owner_id)")
        .eq("id", id)
        .eq("companies.owner_id", user.id)
        .maybeSingle();

      if (error || !data) {
        if (error) console.error(error);
        setErrorMessage("Nie znaleziono zapytania albo nie masz do niego dostępu.");
        setLoading(false);
        return;
      }

      if (!data.contractor_status || data.contractor_status === "new") {
        const { error: readError } = await supabase
          .from("requests")
          .update({ contractor_status: "read" })
          .eq("id", id);

        if (!readError) {
          setRequest({
            ...data,
            contractor_status: "read",
          });
          setLoading(false);
          return;
        }
      }

      setRequest(data);
      setLoading(false);
    };

    loadRequest();
  }, [params]);

  const updateContractorStatus = async (contractorStatus: ContractorStatus) => {
    if (!request) return;

    setActionLoading(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("requests")
      .update({ contractor_status: contractorStatus })
      .eq("id", request.id);

    setActionLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRequest({
      ...request,
      contractor_status: contractorStatus,
    });
    setMessage(getStatusMessage(contractorStatus));
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie zapytania...
      </main>
    );
  }

  if (!request) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4 text-white">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8 text-center">
          <h1 className="text-xl font-semibold text-white">Nie znaleziono zapytania</h1>
          <p className="mt-3 text-sm text-gray-400">{errorMessage || "To zapytanie nie istnieje albo nie należy do Twojej firmy."}</p>
          <Link
            href="/dashboard/messages"
            className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Wróć do zapytań
          </Link>
        </div>
      </main>
    );
  }

  const imageUrls = getImageUrls(request);

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="border-b border-slate-800 pb-6">
          <Link
            href="/dashboard/messages"
            className="mb-5 inline-flex text-sm text-gray-500 transition hover:text-white"
          >
            ← Powrót do zapytań
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-orange-400">
              Szczegóły zapytania
            </div>

            <h1 className="mt-2 max-w-4xl text-2xl font-bold text-white sm:text-3xl">
              {request.title || "Zapytanie bez tytułu"}
            </h1>

            <div className="mt-2 text-sm font-medium text-orange-400">
              {getRequestCategoryLabel(request.category)}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
              <span>{request.city || "Brak miejscowości"}</span>
              <span>•</span>
              <span>{formatDate(request.created_at)}</span>
            </div>
          </div>

          <div className="shrink-0">
            <StatusSelect
              value={normalizeContractorStatus(request.contractor_status)}
              disabled={actionLoading}
              onChange={updateContractorStatus}
            />
          </div>
        </div>
        </section>

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

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-gray-600">
                Opis
              </div>
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                {request.description || "Klient nie dodał opisu."}
              </p>
            </div>

            {imageUrls.length > 0 && (
              <div>
                <div className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-gray-600">
                  Zdjęcia
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {imageUrls.map((imageUrl) => (
                    <a
                      key={imageUrl}
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative h-56 overflow-hidden rounded-xl border border-slate-800 bg-black"
                    >
                      <Image
                        src={imageUrl}
                        alt={request.title || "Zdjęcie zapytania"}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0d1218] p-5">
              <h2 className="text-base font-semibold text-white">Kontakt klienta</h2>
              <div className="mt-2">
                <ContactValue label="Klient" value={request.customer_name} />
                <ContactValue
                  label="Telefon"
                  value={request.customer_phone}
                  href={request.customer_phone ? "tel:" + request.customer_phone : null}
                />
                <ContactValue
                  label="E-mail"
                  value={request.customer_email}
                  href={request.customer_email ? "mailto:" + request.customer_email : null}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1218] p-5">
              <h2 className="text-base font-semibold text-white">Obsługa</h2>
              <div className="mt-2 text-sm">
                <InfoRow label="Priorytet" value={getRequestPriorityLabel(request.request_type)} />
                <InfoRow label="Firma" value={request.companies?.name || "Nie podano"} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function ContactValue({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string | null;
}) {
  const content = (
    <div className="border-b border-slate-800 py-3 last:border-b-0">
      <div className="text-xs text-gray-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm text-white">{value || "Nie podano"}</div>
    </div>
  );

  if (!href || !value) return content;

  return (
    <a href={href} className="block transition hover:text-orange-400">
      {content}
    </a>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800 py-3 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}

function StatusSelect({
  value,
  disabled,
  onChange,
}: {
  value: ContractorStatus;
  disabled: boolean;
  onChange: (status: ContractorStatus) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ContractorStatus)}
      className="rounded-full border border-slate-700 bg-[#0d1218] px-3 py-1 text-xs font-medium text-gray-200 outline-none transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <option value="new">Nowe</option>
      <option value="read">Przeczytane</option>
      <option value="answered">Odpowiedziane</option>
      <option value="rejected">Odrzucone</option>
      <option value="completed">Zakończone</option>
    </select>
  );
}

function normalizeContractorStatus(status: string | null): ContractorStatus {
  if (status === "read" || status === "active" || status === "in_progress") return "read";
  if (status === "answered") return "answered";
  if (status === "rejected") return "rejected";
  if (status === "completed" || status === "closed") return "completed";
  return "new";
}

function getStatusMessage(status: ContractorStatus) {
  if (status === "read") return "Zapytanie oznaczone jako przeczytane.";
  if (status === "answered") return "Zapytanie oznaczone jako odpowiedziane.";
  if (status === "rejected") return "Zapytanie zostało odrzucone.";
  if (status === "completed") return "Zapytanie zostało zakończone.";
  return "Zapytanie oznaczone jako nowe.";
}

function getRequestPriorityLabel(type: string | null) {
  if (type === "asap") return "Pilne / awaria";
  return "Standardowe";
}

function getImageUrls(request: RequestDetails) {
  if (Array.isArray(request.image_urls) && request.image_urls.length > 0) {
    return request.image_urls;
  }

  return request.image_url ? [request.image_url] : [];
}

function formatDate(value: string | null) {
  if (!value) return "Brak daty";

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
