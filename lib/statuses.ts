export type RequestStatus = "new" | "contacting" | "active" | "rejected" | "completed" | "cancelled";
export type ContractorRequestStatus = "new" | "read" | "answered" | "rejected" | "completed";
export type OfferStatus = "sent" | "interested" | "chosen" | "accepted" | "rejected";

export function normalizeRequestStatus(status: string | null | undefined): RequestStatus {
  if (status === "contacting") return "contacting";
  if (status === "active" || status === "in_progress") return "active";
  if (status === "rejected") return "rejected";
  if (status === "completed" || status === "closed") return "completed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  return "new";
}

export function normalizeOfferStatus(status: string | null | undefined): OfferStatus {
  if (status === "interested") return "interested";
  if (status === "chosen" || status === "accepted") return "chosen";
  if (status === "rejected") return "rejected";
  return "sent";
}

export function normalizeContractorRequestStatus(
  status: string | null | undefined
): ContractorRequestStatus {
  if (status === "read" || status === "active" || status === "in_progress") return "read";
  if (status === "answered") return "answered";
  if (status === "rejected") return "rejected";
  if (status === "completed" || status === "closed") return "completed";
  return "new";
}

export function getRequestStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeRequestStatus(status);

  if (normalizedStatus === "contacting") return "Kontakt z firmami";
  if (normalizedStatus === "active") return "Wybrano wykonawcę";
  if (normalizedStatus === "rejected") return "Odrzucone";
  if (normalizedStatus === "completed") return "Zakończone";
  if (normalizedStatus === "cancelled") return "Anulowane";
  return "Otwarte";
}

export function getPrivateRequestStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeRequestStatus(status);

  if (normalizedStatus === "contacting") return "Kontakt z firmami";
  if (normalizedStatus === "active") return "Wybrano wykonawcę";
  if (normalizedStatus === "rejected") return "Odrzucone";
  if (normalizedStatus === "completed") return "Zakończone";
  if (normalizedStatus === "cancelled") return "Anulowane";
  return "Nowe";
}

export function getContractorRequestStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeContractorRequestStatus(status);

  if (normalizedStatus === "read") return "Przeczytane";
  if (normalizedStatus === "answered") return "Odpowiedziane";
  if (normalizedStatus === "rejected") return "Odrzucone";
  if (normalizedStatus === "completed") return "Zakończone";
  return "Nowe";
}

export function getOfferStatusLabel(status: string | null | undefined) {
  const normalizedStatus = normalizeOfferStatus(status);

  if (normalizedStatus === "interested") return "Poproszono o kontakt";
  if (normalizedStatus === "chosen") return "Wybrana";
  if (normalizedStatus === "rejected") return "Odrzucona";
  return "Wysłana";
}

export function isRequestOpen(status: string | null | undefined) {
  const normalizedStatus = normalizeRequestStatus(status);
  return normalizedStatus === "new" || normalizedStatus === "contacting";
}

export function isRequestActive(status: string | null | undefined) {
  return normalizeRequestStatus(status) === "active";
}

export function isRequestClosed(status: string | null | undefined) {
  const normalizedStatus = normalizeRequestStatus(status);
  return normalizedStatus === "rejected" || normalizedStatus === "completed" || normalizedStatus === "cancelled";
}

export function isNewPrivateRequest(status: string | null | undefined) {
  return !status || status === "new";
}

export function isNewContractorRequest(status: string | null | undefined) {
  return normalizeContractorRequestStatus(status) === "new";
}
