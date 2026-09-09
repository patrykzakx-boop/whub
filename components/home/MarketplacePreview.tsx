import Link from "next/link";

import { SERVICES } from "@/components/company-form/constants/services";
import { MATERIALS } from "@/components/company-form/constants/materials";
import { METHODS } from "@/components/company-form/constants/methods";
import {
  getRequestCategoryImage,
  getRequestCategoryLabel,
} from "@/lib/requestCategories";
import { isUrgentRequest } from "@/lib/requestPriority";
import { supabase } from "@/lib/supabaseClient";

type RequestItem = {
  id: string | number;
  title: string | null;
  city: string | null;
  category: string | null;
  request_type: string | null;
  created_at: string | null;
};

type CompanyItem = {
  id: string | number;
  name: string | null;
  logo_url: string | null;
  city: string | null;
  region: string | null;
  services: string[] | null;
  materials: string[] | null;
  welding_methods: string[] | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  google_maps_url: string | null;
};

export default async function MarketplacePreview() {
  const [{ data: requests }, { data: companies }] = await Promise.all([
    supabase
      .from("public_request_listings")
      .select("id,title,city,category,request_type,created_at")
      .is("company_id", null)
      .neq("status", "deleted")
      .neq("status", "cancelled")
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("companies")
      .select("id,name,logo_url,city,region,services,materials,welding_methods,google_rating,google_reviews_count,google_maps_url")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const recommendedCompanies = getRecommendedCompanies(companies || []);

  return (
    <section className="bg-[#05070a] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.9fr_1.6fr]">
        <div>
          <SectionHeader
            title="Ostatnie zapytania klientów"
            href="/requests"
            linkLabel="Zobacz wszystkie"
          />

          <div className="mt-5 space-y-3">
            {requests && requests.length > 0 ? (
              requests.map((request: RequestItem) => (
                <LatestRequestCard key={request.id} request={request} />
              ))
            ) : (
              <EmptyState text="Nie ma jeszcze publicznych zapytań." />
            )}
          </div>
        </div>

        <div>
          <SectionHeader
            title="Polecani wykonawcy"
            href="/companies"
            linkLabel="Zobacz wszystkich"
          />

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {recommendedCompanies.length > 0 ? (
              recommendedCompanies.map((company: CompanyItem) => (
                <RecommendedCompanyCard key={company.id} company={company} />
              ))
            ) : (
              <div className="md:col-span-3">
                <EmptyState text="Nie ma jeszcze opublikowanych firm." />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold tracking-tight text-white">
        {title}
      </h2>

      <Link
        href={href}
        className="shrink-0 text-sm font-semibold text-orange-400 transition hover:text-orange-300"
      >
        {linkLabel} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function LatestRequestCard({ request }: { request: RequestItem }) {
  const categoryLabel = getRequestCategoryLabel(request.category);
  const categoryImage = getRequestCategoryImage(request.category);
  const isUrgent = isUrgentRequest(request.request_type);

  return (
    <Link
      href={`/request/${request.id}`}
      className={
        isUrgent
          ? "group grid grid-cols-[52px_1fr] gap-4 rounded-2xl border border-orange-500/70 bg-[#0b1016] p-4 shadow-[0_0_0_1px_rgba(249,115,22,0.12)] transition hover:border-orange-400"
          : "group grid grid-cols-[52px_1fr] gap-4 rounded-2xl border border-slate-800 bg-[#0b1016] p-4 transition hover:border-slate-700"
      }
    >
      <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-[#070b10] p-2">
        <img
          src={categoryImage}
          alt=""
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <h3 className="truncate text-base font-semibold text-white">
            {request.title || "Zapytanie klienta"}
          </h3>

          <span className="shrink-0 text-xs text-gray-500">
            {formatTimeAgo(request.created_at)}
          </span>
        </div>

        <div className="mt-1 text-sm font-medium text-orange-400">
          {categoryLabel}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
          <span>{formatLocation(request.city)}</span>

          {isUrgent && (
            <>
              <span className="text-slate-700">•</span>
              <span className="font-medium text-orange-300">Pilne</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function RecommendedCompanyCard({ company }: { company: CompanyItem }) {
  const tags = getCompanyTags(company);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1016] transition hover:border-slate-700">
      <div className="flex h-28 items-center justify-center border-b border-slate-800 bg-black">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name || "Logo firmy"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-[#05070a] text-lg font-bold text-gray-500">
            {getInitials(company.name)}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-white">
          {company.name || "Firma"}
        </h3>

        <div className="mt-1 text-sm text-gray-400">
          {formatLocation(company.city, company.region)}
        </div>

        <GoogleRating company={company} />

        <div className="mt-3 flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg border border-slate-800 bg-[#05070a] px-2 py-1 text-xs text-gray-300"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">Profil do uzupełnienia</span>
          )}
        </div>

        <Link
          href={`/company/${company.id}`}
          className="mt-4 flex h-10 items-center justify-center rounded-xl border border-orange-500/70 text-sm font-semibold text-orange-400 transition hover:bg-orange-500 hover:text-white"
        >
          Zobacz profil
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0b1016] p-6 text-sm text-gray-500">
      {text}
    </div>
  );
}

function GoogleRating({ company }: { company: CompanyItem }) {
  if (!company.google_rating || !company.google_reviews_count) {
    return (
      <div className="mt-2 text-xs font-medium text-gray-500">
        Brak ocen Google
      </div>
    );
  }

  const content = (
    <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-[#05070a] px-2.5 py-1.5 text-xs">
      <span className="font-semibold text-orange-400">
        {Number(company.google_rating).toFixed(1)}
      </span>
      <span className="text-gray-400">
        Google
      </span>
      <span className="text-gray-600">
        ({company.google_reviews_count})
      </span>
    </div>
  );

  if (!company.google_maps_url) return content;

  return (
    <a
      href={company.google_maps_url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex"
    >
      {content}
    </a>
  );
}

function getCompanyTags(company: CompanyItem) {
  const serviceTags =
    company.services
      ?.slice(0, 2)
      .map((service) => SERVICES.find((item) => item.id === service)?.title || service) || [];

  const methodTags =
    company.welding_methods
      ?.slice(0, 1)
      .map((method) => METHODS.find((item) => item.id === method)?.title || method) || [];

  const materialTags =
    company.materials
      ?.slice(0, 1)
      .map((material) => MATERIALS.find((item) => item.id === material)?.title || material) || [];

  return [...serviceTags, ...methodTags, ...materialTags].slice(0, 4);
}

function formatLocation(city?: string | null, region?: string | null) {
  return [city, region].filter(Boolean).join(", ") || "Lokalizacja niepodana";
}

function formatTimeAgo(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 2) return "przed chwilą";
  if (diffMinutes < 60) return `${diffMinutes} min temu`;

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} ${getPlural(diffHours, "godz.", "godz.", "godz.")} temu`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) return "1 dzień temu";

  return `${diffDays} dni temu`;
}

function getPlural(count: number, one: string, few: string, many: string) {
  if (count === 1) return one;
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
    return few;
  }

  return many;
}

function getInitials(name?: string | null) {
  const words = (name || "WH")
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getRecommendedCompanies(companies: CompanyItem[]) {
  const trustedCompanies = companies.filter(
    (company) =>
      Number(company.google_rating || 0) >= 4.5 &&
      Number(company.google_reviews_count || 0) >= 20
  );

  const remainingCompanies = companies.filter(
    (company) => !trustedCompanies.some((trusted) => trusted.id === company.id)
  );

  return [
    ...shuffleItems(trustedCompanies),
    ...shuffleItems(remainingCompanies),
  ].slice(0, 3);
}

function shuffleItems<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
