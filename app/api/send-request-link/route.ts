import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { escapeHtml, sendResendEmail } from "@/lib/resendEmail";

type RequestBody = {
  email?: string;
  title?: string;
  accessLink?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const email = body.email?.trim();
    const title = body.title?.trim() || "Twoje zlecenie";
    const accessLink = body.accessLink?.trim();

    if (!email || !accessLink) {
      return NextResponse.json(
        { error: "Brakuje adresu email albo prywatnego linku." },
        { status: 400 }
      );
    }

    const accessToken = getAccessTokenFromLink(accessLink);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Prywatny link do zlecenia jest nieprawidłowy." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("id, title, customer_email, access_token")
      .eq("access_token", accessToken)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: "Nie znaleziono zlecenia dla podanego linku." },
        { status: 404 }
      );
    }

    const savedEmail = requestData.customer_email?.trim().toLowerCase();

    if (!savedEmail || savedEmail !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Adres email nie pasuje do tego zlecenia." },
        { status: 403 }
      );
    }

    const data = await sendResendEmail({
      to: email,
      subject: "Prywatny link do Twojego zlecenia w WeldHub",
      html: buildEmailHtml({
        title: requestData.title || title,
        accessLink,
      }),
    });

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nieoczekiwany błąd podczas wysyłki maila.",
      },
      { status: 500 }
    );
  }
}

function getAccessTokenFromLink(accessLink: string) {
  const marker = "/request-access/";
  const markerIndex = accessLink.indexOf(marker);

  if (markerIndex === -1) return "";

  return accessLink
    .slice(markerIndex + marker.length)
    .split(/[?#/]/)[0]
    .trim();
}

function buildEmailHtml({
  title,
  accessLink,
}: {
  title: string;
  accessLink: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeAccessLink = escapeHtml(accessLink);

  return [
    '<div style="margin:0;padding:32px;background:#05070a;font-family:Arial,sans-serif;color:#ffffff;">',
    '<div style="max-width:560px;margin:0 auto;background:#0d1218;border:1px solid #1e293b;border-radius:18px;padding:28px;">',
    '<div style="font-size:22px;font-weight:700;margin-bottom:8px;">Weld<span style="color:#f97316;">Hub</span></div>',
    '<h1 style="font-size:24px;line-height:1.25;margin:24px 0 12px;color:#ffffff;">Twoje zapytanie zostało dodane</h1>',
    '<p style="font-size:15px;line-height:1.7;margin:0 0 18px;color:#cbd5e1;">Zapisaliśmy zlecenie: <strong>' + safeTitle + '</strong>. Firmy mogą teraz wysyłać odpowiedzi przez WeldHub.</p>',
    '<p style="font-size:15px;line-height:1.7;margin:0 0 24px;color:#cbd5e1;">Ten prywatny link pozwala zobaczyć odpowiedzi, wybrać wykonawcę, anulować albo zakończyć zlecenie. Nie udostępniaj go publicznie.</p>',
    '<a href="' + safeAccessLink + '" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;padding:14px 18px;">Otwórz moje zlecenie</a>',
    '<p style="font-size:12px;line-height:1.6;margin:24px 0 0;color:#64748b;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br /><span style="color:#94a3b8;">' + safeAccessLink + '</span></p>',
    '</div>',
    '</div>',
  ].join("");
}
