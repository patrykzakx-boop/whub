import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { escapeHtml, sendEmail } from "@/lib/email";

type RequestBody = {
  requestId?: string | number;
  accessToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const requestId = body.requestId;
    const accessToken = body.accessToken?.trim();

    if (!requestId || !accessToken) {
      return NextResponse.json(
        { error: "Brakuje ID zapytania albo prywatnego tokenu." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select(
        "id, title, city, category, description, created_at, customer_name, customer_phone, customer_email, company_id, access_token"
      )
      .eq("id", requestId)
      .eq("access_token", accessToken)
      .not("company_id", "is", null)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: "Nie znaleziono prywatnego zapytania do firmy." },
        { status: 404 }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, email, owner_id")
      .eq("id", requestData.company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Nie znaleziono firmy dla tego zapytania." },
        { status: 404 }
      );
    }

    let recipientEmail = company.email || null;

    if (!recipientEmail && company.owner_id) {
      const { data: ownerData } = await supabase.auth.admin.getUserById(
        company.owner_id
      );
      recipientEmail = ownerData.user?.email || null;
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Firma nie ma adresu email do powiadomień." },
        { status: 400 }
      );
    }

    const dashboardLink = buildDashboardRequestLink(request, requestData.id);

    await sendEmail({
      to: recipientEmail,
      subject: "Nowe prywatne zapytanie do Twojej firmy w WeldHub",
      html: buildCompanyRequestEmailHtml({
        companyName: company.name || "Twoja firma",
        title: requestData.title || "Nowe zapytanie",
        city: requestData.city,
        category: requestData.category,
        description: requestData.description,
        customerName: requestData.customer_name,
        customerPhone: requestData.customer_phone,
        customerEmail: requestData.customer_email,
        dashboardLink,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się wysłać powiadomienia do firmy.",
      },
      { status: 500 }
    );
  }
}

function buildDashboardRequestLink(request: Request, requestId: string | number) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const origin = siteUrl?.endsWith("/")
    ? siteUrl.slice(0, -1)
    : siteUrl || new URL(request.url).origin;

  return origin + "/dashboard/messages/" + requestId;
}

function buildCompanyRequestEmailHtml({
  companyName,
  title,
  city,
  category,
  description,
  customerName,
  customerPhone,
  customerEmail,
  dashboardLink,
}: {
  companyName: string;
  title: string;
  city: string | null;
  category: string | null;
  description: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  dashboardLink: string;
}) {
  const safeCompanyName = escapeHtml(companyName);
  const safeTitle = escapeHtml(title);
  const safeCity = escapeHtml(city || "Nie podano lokalizacji");
  const safeCategory = escapeHtml(category || "Nie podano kategorii");
  const safeDescription = escapeHtml(description || "Brak opisu");
  const safeCustomerName = escapeHtml(customerName || "Klient");
  const safeCustomerPhone = escapeHtml(customerPhone || "Nie podano telefonu");
  const safeCustomerEmail = escapeHtml(customerEmail || "Nie podano emaila");
  const safeDashboardLink = escapeHtml(dashboardLink);

  return [
    '<div style="margin:0;padding:32px;background:#05070a;font-family:Arial,sans-serif;color:#ffffff;">',
    '<div style="max-width:600px;margin:0 auto;background:#0d1218;border:1px solid #1e293b;border-radius:18px;padding:28px;">',
    '<div style="font-size:22px;font-weight:700;margin-bottom:8px;">Weld<span style="color:#f97316;">Hub</span></div>',
    '<h1 style="font-size:24px;line-height:1.25;margin:24px 0 12px;color:#ffffff;">Nowe prywatne zapytanie</h1>',
    '<p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#cbd5e1;">Firma <strong>' + safeCompanyName + '</strong> otrzymała nowe zapytanie: <strong>' + safeTitle + '</strong>.</p>',
    '<div style="border:1px solid #1e293b;border-radius:14px;padding:16px;background:#05070a;margin:0 0 18px;">',
    '<div style="font-size:14px;line-height:1.8;color:#cbd5e1;">Lokalizacja: <strong style="color:#ffffff;">' + safeCity + '</strong><br />Kategoria: <strong style="color:#ffffff;">' + safeCategory + '</strong></div>',
    '<p style="font-size:14px;line-height:1.7;margin:14px 0 0;color:#94a3b8;">' + safeDescription + '</p>',
    '</div>',
    '<div style="border:1px solid #1e293b;border-radius:14px;padding:16px;background:#05070a;margin:0 0 22px;">',
    '<div style="font-size:13px;text-transform:uppercase;letter-spacing:0.12em;color:#f97316;margin-bottom:10px;">Kontakt do klienta</div>',
    '<div style="font-size:15px;line-height:1.8;color:#cbd5e1;">Imię: <strong style="color:#ffffff;">' + safeCustomerName + '</strong><br />Telefon: <strong style="color:#ffffff;">' + safeCustomerPhone + '</strong><br />Email: <strong style="color:#ffffff;">' + safeCustomerEmail + '</strong></div>',
    '</div>',
    '<a href="' + safeDashboardLink + '" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;border-radius:12px;padding:14px 18px;">Otwórz zapytanie</a>',
    '<p style="font-size:12px;line-height:1.6;margin:24px 0 0;color:#64748b;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br /><span style="color:#94a3b8;">' + safeDashboardLink + '</span></p>',
    '</div>',
    '</div>',
  ].join("");
}
