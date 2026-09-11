import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { escapeHtml, sendEmail } from "@/lib/email";
import { isRequestOpen } from "@/lib/statuses";

type RequestBody = {
  requestId?: string | number;
  companyId?: string | number;
  message?: string;
  priceEstimate?: string;
  availability?: string;
};

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Zaloguj się ponownie, aby wysłać odpowiedź." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as RequestBody;
    const requestId = body.requestId;
    const companyId = body.companyId;
    const message = body.message?.trim() || "";
    const priceEstimate = body.priceEstimate?.trim() || null;
    const availability = body.availability?.trim() || null;

    if (!requestId || !companyId || !message) {
      return NextResponse.json(
        { error: "Brakuje zlecenia, firmy albo wiadomości." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Zaloguj się ponownie, aby wysłać odpowiedź." },
        { status: 401 }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, owner_id")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Nie znaleziono wybranej firmy." },
        { status: 404 }
      );
    }

    if (company.owner_id !== userData.user.id) {
      return NextResponse.json(
        { error: "Nie możesz wysłać odpowiedzi z tej firmy." },
        { status: 403 }
      );
    }

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("id, title, city, category, status, customer_email, access_token, company_id")
      .eq("id", requestId)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: "Nie znaleziono zlecenia." },
        { status: 404 }
      );
    }

    if (requestData.company_id) {
      return NextResponse.json(
        { error: "To nie jest publiczne zlecenie do odpowiedzi." },
        { status: 400 }
      );
    }

    if (!isRequestOpen(requestData.status)) {
      return NextResponse.json(
        { error: "To zlecenie nie przyjmuje już nowych odpowiedzi." },
        { status: 409 }
      );
    }

    const { data: offer, error: offerError } = await supabase
      .from("request_offers")
      .insert({
        request_id: requestId,
        company_id: companyId,
        owner_id: userData.user.id,
        message,
        price_estimate: priceEstimate,
        availability,
        status: "sent",
      })
      .select("*, companies(name)")
      .single();

    if (offerError) {
      if (offerError.code === "23505") {
        return NextResponse.json(
          { error: "Ta firma już odpowiedziała na to zlecenie." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: offerError.message }, { status: 500 });
    }

    let mailWarning: string | null = null;

    if (requestData.customer_email && requestData.access_token) {
      try {
        const accessLink = buildRequestAccessLink(request, requestData.access_token);

        await sendEmail({
          to: requestData.customer_email,
          subject: "Masz nową ofertę do zlecenia w WeldHub",
          html: buildNewOfferEmailHtml({
            requestTitle: requestData.title || "Twoje zlecenie",
            companyName: company.name || "Firma wykonawcza",
            city: requestData.city,
            accessLink,
          }),
        });
      } catch (error) {
        mailWarning = error instanceof Error ? error.message : "Nie udało się wysłać maila do klienta.";
      }
    } else {
      mailWarning = "Zlecenie nie ma maila klienta albo prywatnego tokenu.";
    }

    return NextResponse.json({ ok: true, offer, mailWarning });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}

function buildRequestAccessLink(request: Request, token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const configuredOrigin = siteUrl?.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  const origin = configuredOrigin || new URL(request.url).origin;

  return origin + "/request-access/" + token;
}

function buildNewOfferEmailHtml({
  requestTitle,
  companyName,
  city,
  accessLink,
}: {
  requestTitle: string;
  companyName: string;
  city: string | null;
  accessLink: string;
}) {
  const safeTitle = escapeHtml(requestTitle);
  const safeCompanyName = escapeHtml(companyName);
  const safeCity = escapeHtml(city || "Nie podano lokalizacji");
  const safeAccessLink = escapeHtml(accessLink);

  return [
    '<div style="margin:0;padding:32px;background:#05070a;font-family:Arial,sans-serif;color:#ffffff;">',
    '<div style="max-width:560px;margin:0 auto;background:#0d1218;border:1px solid #1e293b;border-radius:18px;padding:28px;">',
    '<div style="font-size:22px;font-weight:700;margin-bottom:8px;">Weld<span style="color:#f97316;">Hub</span></div>',
    '<h1 style="font-size:24px;line-height:1.25;margin:24px 0 12px;color:#ffffff;">Masz nową ofertę</h1>',
    '<p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#cbd5e1;">Firma <strong>' + safeCompanyName + '</strong> odpowiedziała na Twoje zlecenie: <strong>' + safeTitle + '</strong>.</p>',
    '<p style="font-size:14px;line-height:1.6;margin:0 0 24px;color:#94a3b8;">Lokalizacja zlecenia: ' + safeCity + '</p>',
    '<a href="' + safeAccessLink + '" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;padding:14px 18px;">Zobacz ofertę</a>',
    '<p style="font-size:12px;line-height:1.6;margin:24px 0 0;color:#64748b;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br /><span style="color:#94a3b8;">' + safeAccessLink + '</span></p>',
    '</div>',
    '</div>',
  ].join("");
}
