"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatOfferPrice,
  getOfferPriceNumber,
  sortOffersByPrice,
  type OfferSortMode,
} from "@/lib/offerPricing";
import { getOfferStatusLabel, normalizeOfferStatus } from "@/lib/statuses";

export type ComparableOffer = {
  id: string | number;
  request_id: string | number;
  company_id: string | number;
  message: string | null;
  price_estimate: string | null;
  price_amount: number | string | null;
  price_description: string | null;
  availability: string | null;
  status: string | null;
  created_at: string | null;
  companies?: {
    id?: string | number;
    name: string | null;
    city: string | null;
    region: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
  } | null;
};

type Props = {
  offers: ComparableOffer[];
  canManageOffers: boolean;
  actionLoadingId: string | number | null;
  onAction: (
    offerId: string | number,
    status: "interested" | "chosen" | "rejected",
  ) => void;
  emptyMessage: string;
};

export default function OfferComparison({
  offers,
  canManageOffers,
  actionLoadingId,
  onAction,
  emptyMessage,
}: Props) {
  const [sortMode, setSortMode] = useState<OfferSortMode>("price-asc");

  const sortedOffers = useMemo(
    () => sortOffersByPrice(offers, sortMode),
    [offers, sortMode],
  );

  const priceSummary = useMemo(() => {
    const prices = offers
      .map((offer) => getOfferPriceNumber(offer.price_amount))
      .filter((price): price is number => price !== null);

    if (prices.length === 0) return null;

    return {
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      count: prices.length,
    };
  }, [offers]);

  if (offers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0d1218] p-8 text-center text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Liczba ofert" value={String(offers.length)} />
        <SummaryCard
          label="Najniższa cena"
          value={
            priceSummary
              ? formatOfferPrice(priceSummary.lowest)
              : "Brak wycen"
          }
          highlighted
        />
        <SummaryCard
          label="Najwyższa cena"
          value={
            priceSummary
              ? formatOfferPrice(priceSummary.highest)
              : "Brak wycen"
          }
        />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#0d1218] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-white">Porównanie ofert</h3>
          <p className="mt-1 text-xs text-gray-400">
            {priceSummary
              ? `${priceSummary.count} z ${offers.length} ofert ma porównywalną cenę.`
              : "Oferty bez ceny liczbowej są wyświetlane na końcu."}
          </p>
        </div>

        <label className="flex items-center gap-3 text-sm text-gray-400">
          <span>Sortowanie</span>
          <select
            aria-label="Sortowanie ofert"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as OfferSortMode)}
            className="rounded-lg border border-slate-700 bg-[#05070a] px-3 py-2 text-sm text-white outline-none focus:border-orange-500"
          >
            <option value="price-asc">Cena: od najniższej</option>
            <option value="price-desc">Cena: od najwyższej</option>
            <option value="newest">Najnowsze</option>
          </select>
        </label>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-800 bg-[#0d1218] lg:block">
        <table className="w-full min-w-[920px] table-fixed text-left">
          <thead className="border-b border-slate-800 bg-[#090d12] text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="w-[32%] px-4 py-3 font-medium">Firma i oferta</th>
              <th className="w-[18%] px-4 py-3 font-medium">Cena</th>
              <th className="w-[15%] px-4 py-3 font-medium">Termin</th>
              <th className="w-[15%] px-4 py-3 font-medium">Status</th>
              <th className="w-[20%] px-4 py-3 font-medium">Decyzja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedOffers.map((offer) => (
              <tr key={offer.id} className="align-top">
                <td className="px-4 py-4">
                  <CompanySummary offer={offer} />
                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-400">
                    {offer.message}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <OfferPrice offer={offer} />
                </td>
                <td className="px-4 py-4 text-sm text-gray-300">
                  {offer.availability || "Nie podano"}
                </td>
                <td className="px-4 py-4">
                  <OfferStatusBadge status={offer.status} />
                  <ContactDetails offer={offer} />
                </td>
                <td className="px-4 py-4">
                  <OfferDecisionActions
                    offer={offer}
                    canManageOffers={canManageOffers}
                    actionLoadingId={actionLoadingId}
                    onAction={onAction}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {sortedOffers.map((offer) => (
          <article
            key={offer.id}
            className="rounded-2xl border border-slate-800 bg-[#0d1218] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <CompanySummary offer={offer} />
              <OfferStatusBadge status={offer.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-[#05070a] p-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  Cena
                </div>
                <div className="mt-1">
                  <OfferPrice offer={offer} compact />
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#05070a] p-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">
                  Termin
                </div>
                <div className="mt-1 text-sm text-gray-200">
                  {offer.availability || "Nie podano"}
                </div>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-400">
              {offer.message}
            </p>
            <ContactDetails offer={offer} />
            <div className="mt-4">
              <OfferDecisionActions
                offer={offer}
                canManageOffers={canManageOffers}
                actionLoadingId={actionLoadingId}
                onAction={onAction}
                horizontal
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={
        highlighted
          ? "rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4"
          : "rounded-2xl border border-slate-800 bg-[#0d1218] p-4"
      }
    >
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function CompanySummary({ offer }: { offer: ComparableOffer }) {
  const profileHref = `/company/${offer.company_id}`;
  const companyName = offer.companies?.name || "Firma";

  return (
    <div className="flex min-w-0 items-start gap-3">
      <Link
        href={profileHref}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-black transition hover:border-orange-500"
        aria-label={`Profil firmy ${companyName}`}
      >
        {offer.companies?.logo_url ? (
          <Image
            src={offer.companies.logo_url}
            alt={companyName}
            fill
            sizes="40px"
            className="object-cover"
          />
        ) : (
          <span className="text-[10px] text-gray-400">Logo</span>
        )}
      </Link>

      <div className="min-w-0">
        <Link
          href={profileHref}
          className="font-semibold text-white transition hover:text-orange-400"
        >
          {companyName}
        </Link>
        <div className="mt-1 text-xs text-gray-400">
          {[offer.companies?.city, offer.companies?.region]
            .filter(Boolean)
            .join(", ") || "Brak lokalizacji"}
        </div>
      </div>
    </div>
  );
}

function OfferPrice({
  offer,
  compact = false,
}: {
  offer: ComparableOffer;
  compact?: boolean;
}) {
  return (
    <div>
      <div className={compact ? "text-sm font-semibold text-white" : "font-semibold text-white"}>
        {formatOfferPrice(offer.price_amount, offer.price_estimate)}
      </div>
      {offer.price_description && (
        <div className="mt-1 text-xs leading-5 text-gray-400">
          {offer.price_description}
        </div>
      )}
    </div>
  );
}

function ContactDetails({ offer }: { offer: ComparableOffer }) {
  const status = normalizeOfferStatus(offer.status);

  if (
    (status !== "interested" && status !== "chosen") ||
    (!offer.companies?.phone && !offer.companies?.email)
  ) {
    return null;
  }

  return (
    <div className="mt-3 space-y-1 text-xs text-gray-400">
      {offer.companies.phone && (
        <a href={`tel:${offer.companies.phone}`} className="block hover:text-white">
          {offer.companies.phone}
        </a>
      )}
      {offer.companies.email && (
        <a href={`mailto:${offer.companies.email}`} className="block break-all hover:text-white">
          {offer.companies.email}
        </a>
      )}
    </div>
  );
}

function OfferStatusBadge({ status }: { status: string | null }) {
  return (
    <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-gray-300">
      {getOfferStatusLabel(status)}
    </span>
  );
}

function OfferDecisionActions({
  offer,
  canManageOffers,
  actionLoadingId,
  onAction,
  horizontal = false,
}: {
  offer: ComparableOffer;
  canManageOffers: boolean;
  actionLoadingId: string | number | null;
  onAction: Props["onAction"];
  horizontal?: boolean;
}) {
  const status = normalizeOfferStatus(offer.status);
  const interested = status === "interested";
  const chosen = status === "chosen";
  const rejected = status === "rejected";
  const layout = horizontal ? "flex flex-wrap gap-2" : "flex flex-col gap-2";

  return (
    <div className={layout}>
      {!interested && !chosen && !rejected && (
        <button
          type="button"
          onClick={() => onAction(offer.id, "interested")}
          disabled={!canManageOffers || actionLoadingId === `${offer.id}:interested`}
          className="rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Poproś o kontakt
        </button>
      )}

      {interested && (
        <button
          type="button"
          onClick={() => onAction(offer.id, "chosen")}
          disabled={!canManageOffers || actionLoadingId === `${offer.id}:chosen`}
          className="rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Wybierz firmę
        </button>
      )}

      {chosen && (
        <span className="rounded-lg bg-orange-700 px-3 py-2 text-center text-xs font-semibold text-white">
          Wybrana firma
        </span>
      )}

      {!chosen && !rejected && (
        <button
          type="button"
          onClick={() => onAction(offer.id, "rejected")}
          disabled={!canManageOffers || actionLoadingId === `${offer.id}:rejected`}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-gray-300 transition hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Odrzuć
        </button>
      )}

      {rejected && (
        <span className="rounded-lg border border-slate-800 px-3 py-2 text-center text-xs text-gray-400">
          Oferta odrzucona
        </span>
      )}
    </div>
  );
}
