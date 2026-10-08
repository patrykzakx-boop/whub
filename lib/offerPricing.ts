export const MAX_OFFER_PRICE = 100_000_000;

export type OfferWithPrice = {
  price_amount?: number | string | null;
  created_at?: string | null;
};

export type OfferSortMode = "price-asc" | "price-desc" | "newest";

export function parseOfferPrice(value: unknown) {
  if (typeof value === "number") {
    return isValidOfferPrice(value) ? roundCurrency(value) : null;
  }

  if (typeof value !== "string") return null;

  const normalized = value.trim().replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return isValidOfferPrice(parsed) ? roundCurrency(parsed) : null;
}

export function getOfferPriceNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatOfferPrice(
  value: number | string | null | undefined,
  legacyValue?: string | null,
) {
  const amount = getOfferPriceNumber(value);

  if (amount === null) return legacyValue || "Do ustalenia";

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function sortOffersByPrice<T extends OfferWithPrice>(
  offers: T[],
  mode: OfferSortMode,
) {
  return [...offers].sort((left, right) => {
    if (mode === "newest") {
      return getTimestamp(right.created_at) - getTimestamp(left.created_at);
    }

    const leftPrice = getOfferPriceNumber(left.price_amount);
    const rightPrice = getOfferPriceNumber(right.price_amount);

    if (leftPrice === null && rightPrice === null) return 0;
    if (leftPrice === null) return 1;
    if (rightPrice === null) return -1;

    return mode === "price-desc"
      ? rightPrice - leftPrice
      : leftPrice - rightPrice;
  });
}

function isValidOfferPrice(value: number) {
  return Number.isFinite(value) && value > 0 && value <= MAX_OFFER_PRICE;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getTimestamp(value: string | null | undefined) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
