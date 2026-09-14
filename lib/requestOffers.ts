export const OWN_REQUEST_OFFER_ERROR =
  "Nie możesz wysłać oferty na własne zlecenie.";

export function isOwnRequestOffer(
  requestCustomerId: string | null | undefined,
  userId: string
) {
  return Boolean(requestCustomerId && requestCustomerId === userId);
}

export function getDashboardOfferHref(offerId: string | number) {
  return `/dashboard/offers/${encodeURIComponent(String(offerId))}`;
}
