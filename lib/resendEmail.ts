type SendResendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendResendEmail({
  to,
  subject,
  html,
}: SendResendEmailParams) {
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
      to,
      subject,
      html,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Nie udało się wysłać maila.");
  }

  return data;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
