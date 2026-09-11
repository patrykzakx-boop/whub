import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { escapeHtml, sendEmail } from "@/lib/email";

type Params = {
  params: Promise<{
    token: string;
    offerId: string;
  }>;
};

type OfferAction = "interested" | "chosen" | "rejected";

type PatchBody = {
  status?: OfferAction | "accepted";
};

type RequestData = {
  id: string | number;
  title: string | null;
  city: string | null;
  status: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
};

type OfferData = {
  id: string | number;
  request_id: string | number;
  status: string | null;
  owner_id: string | null;
  companies:
    | {
        name: string | null;
        email: string | null;
      }
    | {
        name: string | null;
        email: string | null;
      }[]
    | null;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { token, offerId } = await params;
    const body = (await request.json()) as PatchBody;
    const nextStatus = normalizeIncomingOfferStatus(body.status);

    if (!nextStatus) {
      return NextResponse.json(
        { error: "Nieprawidłowy status oferty." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("id, title, city, status, customer_name, customer_phone, customer_email")
      .eq("access_token", token)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: "Link do zlecenia jest nieprawidłowy albo wygasł." },
        { status: 404 }
      );
    }

    if (requestData.status === "completed" || requestData.status === "cancelled") {
      return NextResponse.json(
        { error: "To zlecenie jest już zamknięte." },
        { status: 409 }
      );
    }

    const { data: offerData, error: offerError } = await supabase
      .from("request_offers")
      .select("id, request_id, status, owner_id, companies(id, name, email)")
      .eq("id", offerId)
      .eq("request_id", requestData.id)
      .single();

    if (offerError || !offerData) {
      return NextResponse.json(
        { error: "Nie znaleziono oferty dla tego zlecenia." },
        { status: 404 }
      );
    }

    if (nextStatus === "chosen") {
      return chooseOffer({ supabase, token, requestData, offerData });
    }

    const { error: updateError } = await supabase
      .from("request_offers")
      .update({ status: nextStatus })
      .eq("id", offerData.id)
      .eq("request_id", requestData.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (nextStatus === "interested") {
      let requestStatus: "contacting" | null = null;

      if (!requestData.status || requestData.status === "new") {
        const { error: requestUpdateError } = await supabase
          .from("requests")
          .update({ status: "contacting" })
          .eq("id", requestData.id)
          .eq("access_token", token);

        if (requestUpdateError) {
          return NextResponse.json(
            { error: requestUpdateError.message },
            { status: 500 }
          );
        }

        requestStatus = "contacting";
      }

      const mailWarning = await notifyContractorAboutInterest({
        supabase,
        requestData,
        offerData,
      });

      return NextResponse.json({
        ok: true,
        status: "interested",
        requestStatus,
        mailWarning,
      });
    }

    return NextResponse.json({ ok: true, status: "rejected" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}

async function chooseOffer({
  supabase,
  token,
  requestData,
  offerData,
}: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  token: string;
  requestData: RequestData;
  offerData: OfferData;
}) {
  const { error: updateError } = await supabase
    .from("request_offers")
    .update({ status: "chosen" })
    .eq("id", offerData.id)
    .eq("request_id", requestData.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: rejectError } = await supabase
    .from("request_offers")
    .update({ status: "rejected" })
    .eq("request_id", requestData.id)
    .neq("id", offerData.id)
    .neq("status", "rejected");

  if (rejectError) {
    return NextResponse.json({ error: rejectError.message }, { status: 500 });
  }

  const { error: requestUpdateError } = await supabase
    .from("requests")
    .update({ status: "active" })
    .eq("id", requestData.id)
    .eq("access_token", token);

  if (requestUpdateError) {
    return NextResponse.json({ error: requestUpdateError.message }, { status: 500 });
  }

  const mailWarning = await notifyContractorAboutChosenOffer({
    supabase,
    requestData,
    offerData,
  });

  return NextResponse.json({
    ok: true,
    status: "chosen",
    requestStatus: "active",
    mailWarning,
  });
}

async function notifyContractorAboutInterest({
  supabase,
  requestData,
  offerData,
}: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  requestData: RequestData;
  offerData: OfferData;
}) {
  return sendContractorNotification({
    supabase,
    requestData,
    offerData,
    subject: "Klient prosi o kontakt w WeldHub",
    title: "Klient jest zainteresowany Twoją ofertą",
    leadText:
      "Klient poprosił o kontakt w sprawie Twojej oferty. Skontaktuj się z nim i ustal szczegóły realizacji.",
  });
}

async function notifyContractorAboutChosenOffer({
  supabase,
  requestData,
  offerData,
}: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  requestData: RequestData;
  offerData: OfferData;
}) {
  return sendContractorNotification({
    supabase,
    requestData,
    offerData,
    subject: "Klient wybrał Twoją firmę w WeldHub",
    title: "Klient wybrał Twoją firmę",
    leadText:
      "Klient oznaczył Twoją firmę jako wybranego wykonawcę. Ten wybór będzie liczył się do statystyk profilu.",
  });
}

async function sendContractorNotification({
  supabase,
  requestData,
  offerData,
  subject,
  title,
  leadText,
}: {
  supabase: ReturnType<typeof createSupabaseAdmin>;
  requestData: RequestData;
  offerData: OfferData;
  subject: string;
  title: string;
  leadText: string;
}) {
  const company = Array.isArray(offerData.companies)
    ? offerData.companies[0]
    : offerData.companies;
  let contractorEmail = company?.email || null;

  if (!contractorEmail && offerData.owner_id) {
    const { data: ownerData } = await supabase.auth.admin.getUserById(offerData.owner_id);
    contractorEmail = ownerData.user?.email || null;
  }

  if (!contractorEmail) {
    return "Nie znaleziono adresu email wykonawcy.";
  }

  try {
    await sendEmail({
      to: contractorEmail,
      subject,
      html: buildContractorNotificationEmailHtml({
        title,
        leadText,
        requestTitle: requestData.title || "Zlecenie",
        companyName: company?.name || "Twoja firma",
        city: requestData.city,
        customerName: requestData.customer_name,
        customerPhone: requestData.customer_phone,
        customerEmail: requestData.customer_email,
      }),
    });

    return null;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Nie udało się wysłać maila do wykonawcy.";
  }
}

function buildContractorNotificationEmailHtml({
  title,
  leadText,
  requestTitle,
  companyName,
  city,
  customerName,
  customerPhone,
  customerEmail,
}: {
  title: string;
  leadText: string;
  requestTitle: string;
  companyName: string;
  city: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
}) {
  const safeTitle = escapeHtml(title);
  const safeLeadText = escapeHtml(leadText);
  const safeRequestTitle = escapeHtml(requestTitle);
  const safeCompanyName = escapeHtml(companyName);
  const safeCity = escapeHtml(city || "Nie podano lokalizacji");
  const safeCustomerName = escapeHtml(customerName || "Klient");
  const safeCustomerPhone = escapeHtml(customerPhone || "Nie podano telefonu");
  const safeCustomerEmail = escapeHtml(customerEmail || "Nie podano emaila");

  return [
    '<div style="margin:0;padding:32px;background:#05070a;font-family:Arial,sans-serif;color:#ffffff;">',
    '<div style="max-width:560px;margin:0 auto;background:#0d1218;border:1px solid #1e293b;border-radius:18px;padding:28px;">',
    '<div style="font-size:22px;font-weight:700;margin-bottom:8px;">Weld<span style="color:#f97316;">Hub</span></div>',
    '<h1 style="font-size:24px;line-height:1.25;margin:24px 0 12px;color:#ffffff;">' + safeTitle + '</h1>',
    '<p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#cbd5e1;">' + safeLeadText + '</p>',
    '<p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:#cbd5e1;">Firma: <strong>' + safeCompanyName + '</strong><br />Zlecenie: <strong>' + safeRequestTitle + '</strong><br />Lokalizacja: ' + safeCity + '</p>',
    '<div style="border:1px solid #1e293b;border-radius:14px;padding:16px;background:#05070a;">',
    '<div style="font-size:13px;text-transform:uppercase;letter-spacing:0.12em;color:#f97316;margin-bottom:10px;">Kontakt do klienta</div>',
    '<div style="font-size:15px;line-height:1.8;color:#cbd5e1;">Imię: <strong style="color:#ffffff;">' + safeCustomerName + '</strong><br />Telefon: <strong style="color:#ffffff;">' + safeCustomerPhone + '</strong><br />Email: <strong style="color:#ffffff;">' + safeCustomerEmail + '</strong></div>',
    '</div>',
    '</div>',
    '</div>',
  ].join("");
}

function normalizeIncomingOfferStatus(status: PatchBody["status"]): OfferAction | null {
  if (status === "accepted" || status === "chosen") return "chosen";
  if (status === "interested" || status === "rejected") return status;
  return null;
}
