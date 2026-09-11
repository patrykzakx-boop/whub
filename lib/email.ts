import "server-only";

import nodemailer from "nodemailer";
import { CONTACT_EMAIL } from "@/lib/siteConfig";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

type EmailResult = {
  id: string;
};

const FASTMAIL_SMTP_HOST = "smtp.fastmail.com";
const FASTMAIL_SMTP_PORT = 465;

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<EmailResult> {
  const fastmailPassword = process.env.FASTMAIL_SMTP_APP_PASSWORD;

  if (fastmailPassword) {
    return sendFastmailEmail({ to, subject, html }, fastmailPassword);
  }

  return sendResendEmail({ to, subject, html });
}

async function sendFastmailEmail(
  { to, subject, html }: SendEmailParams,
  password: string
): Promise<EmailResult> {
  const user = process.env.FASTMAIL_SMTP_USER || CONTACT_EMAIL;
  const transporter = nodemailer.createTransport({
    host: FASTMAIL_SMTP_HOST,
    port: FASTMAIL_SMTP_PORT,
    secure: true,
    auth: { user, pass: password },
  });

  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `WeldHub <${user}>`,
    replyTo: process.env.EMAIL_REPLY_TO || CONTACT_EMAIL,
    to,
    subject,
    html,
  });

  return { id: result.messageId };
}

async function sendResendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Brakuje konfiguracji Fastmail SMTP oraz awaryjnego klucza Resend."
    );
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

