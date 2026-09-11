import "server-only";

import { CONTACT_EMAIL } from "@/lib/siteConfig";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

type EmailResult = {
  id: string;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Brakuje RESEND_API_KEY w zmiennych środowiskowych.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "WeldHub <onboarding@resend.dev>",
      reply_to: process.env.EMAIL_REPLY_TO || CONTACT_EMAIL,
      to,
      subject,
      html,
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | { id?: string; message?: string }
    | null;

  if (!response.ok || !data?.id) {
    throw new Error(data?.message || "Nie udało się wysłać maila.");
  }

  return { id: data.id };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
