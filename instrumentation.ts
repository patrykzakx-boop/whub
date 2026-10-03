import type { Instrumentation } from "next";

const ALERT_THROTTLE_MS = 15 * 60 * 1_000;
const recentAlerts = new Map<string, number>();

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_RUNTIME !== "nodejs" ||
    !process.env.RESEND_API_KEY
  ) {
    return;
  }

  const digest = getErrorDigest(error);
  const route = context.routePath || request.path.split("?")[0] || "unknown";
  const alertKey = `${route}:${digest}`;
  const now = Date.now();
  const previousAlert = recentAlerts.get(alertKey) || 0;

  if (now - previousAlert < ALERT_THROTTLE_MS) return;

  recentAlerts.set(alertKey, now);
  pruneAlertThrottle(now);

  try {
    const [{ escapeHtml, sendEmail }, { CONTACT_EMAIL }] = await Promise.all([
      import("@/lib/email"),
      import("@/lib/siteConfig"),
    ]);
    const recipient =
      process.env.ERROR_ALERT_EMAIL ||
      process.env.EMAIL_REPLY_TO ||
      CONTACT_EMAIL;

    await sendEmail({
      to: recipient,
      subject: `[WeldHub] Błąd serwera na ${route}`,
      html: [
        "<h1>WeldHub — błąd serwera</h1>",
        `<p><strong>Trasa:</strong> ${escapeHtml(route)}</p>`,
        `<p><strong>Metoda:</strong> ${escapeHtml(request.method)}</p>`,
        `<p><strong>Typ:</strong> ${escapeHtml(context.routeType)}</p>`,
        `<p><strong>Identyfikator:</strong> ${escapeHtml(digest)}</p>`,
        "<p>Szczegóły techniczne są dostępne w logach wdrożenia Vercel.</p>",
      ].join(""),
    });
  } catch (alertError) {
    console.error("Nie udało się wysłać alertu o błędzie WeldHub.", alertError);
  }
};

function getErrorDigest(error: unknown) {
  if (typeof error === "object" && error !== null && "digest" in error) {
    return String(error.digest).slice(0, 160);
  }

  if (error instanceof Error) {
    return error.name.slice(0, 160) || "Error";
  }

  return "UnknownError";
}

function pruneAlertThrottle(now: number) {
  if (recentAlerts.size <= 100) return;

  for (const [key, timestamp] of recentAlerts) {
    if (now - timestamp >= ALERT_THROTTLE_MS) recentAlerts.delete(key);
  }
}
