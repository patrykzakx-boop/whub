export const REPORT_REASONS = [
  "Spam lub reklama",
  "Fałszywe informacje",
  "Treść obraźliwa",
  "Podejrzenie oszustwa",
  "Naruszenie prywatności",
  "Inny powód",
] as const;

export type ReportTargetType = "company" | "request";

export function parseReportInput(value: unknown) {
  const body = value as Record<string, unknown> | null;
  const targetType = body?.targetType;
  const targetId = Number(body?.targetId);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  const details = typeof body?.details === "string" ? body.details.trim() : "";

  if (targetType !== "company" && targetType !== "request") {
    throw new Error("Nieprawidłowy rodzaj zgłoszenia.");
  }
  if (!Number.isSafeInteger(targetId) || targetId <= 0) {
    throw new Error("Nieprawidłowy identyfikator zgłaszanej treści.");
  }
  if (reason.length < 3 || reason.length > 80) {
    throw new Error("Wybierz powód zgłoszenia.");
  }
  if (details.length > 2000) {
    throw new Error("Opis zgłoszenia może mieć maksymalnie 2000 znaków.");
  }

  return { targetType, targetId, reason, details: details || null };
}

export function parseModerationAction(value: unknown) {
  const body = value as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const targetType = typeof body?.targetType === "string" ? body.targetType : "";
  const targetId = typeof body?.targetId === "string" || typeof body?.targetId === "number"
    ? String(body.targetId)
    : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
  const allowed = new Set([
    "approve_company", "reject_company", "hide_request", "restore_request",
    "block_user", "unblock_user", "resolve_report", "dismiss_report",
  ]);

  if (!allowed.has(action) || !targetId) {
    throw new Error("Nieprawidłowa operacja moderacji.");
  }

  return { action, targetType, targetId, note: note || null };
}
