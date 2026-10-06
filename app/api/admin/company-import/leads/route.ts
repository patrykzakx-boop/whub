import { NextResponse } from "next/server";

import { authenticateAdmin } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const NO_STORE = { "Cache-Control": "no-store" };
const STATUSES = new Set([
  "new",
  "to_verify",
  "contacted",
  "consent_received",
  "declined",
  "archived",
]);

export async function PATCH(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) return forbidden();

  try {
    const body = await request.json();
    const id = Number(body.id);
    const status = String(body.status || "");
    if (!Number.isInteger(id) || id <= 0 || !STATUSES.has(status)) {
      throw new Error("Nieprawidłowy status firmy.");
    }

    const now = new Date().toISOString();
    const update: Record<string, string> = { status, updated_at: now };
    if (status === "contacted") update.privacy_notice_sent_at = now;
    if (status === "consent_received") update.consent_at = now;

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("company_leads")
      .update(update)
      .eq("id", id)
      .neq("status", "converted")
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Nie znaleziono firmy albo profil został już utworzony.");

    await supabase.from("moderation_audit_log").insert({
      admin_id: admin.id,
      action: "update_company_lead",
      target_type: "company_lead",
      target_id: String(id),
      note: `Nowy status: ${status}`,
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się zmienić statusu." },
      { status: 400, headers: NO_STORE }
    );
  }
}

export async function POST(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) return forbidden();

  try {
    const body = await request.json();
    const leadId = Number(body.leadId);
    const ownerEmail = String(body.ownerEmail || "").trim().toLowerCase();
    if (!Number.isInteger(leadId) || leadId <= 0) throw new Error("Nieprawidłowa firma.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      throw new Error("Podaj e-mail konta właściciela w WeldHub.");
    }

    const supabase = createSupabaseAdmin();
    const { data: lead, error: leadError } = await supabase
      .from("company_leads")
      .select("*")
      .eq("id", leadId)
      .eq("status", "consent_received")
      .is("linked_company_id", null)
      .maybeSingle();
    if (leadError) throw new Error(leadError.message);
    if (!lead) throw new Error("Firma nie ma jeszcze odnotowanej zgody albo została już przekształcona.");

    const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw new Error(usersError.message);
    const owner = usersPage.users.find(
      (user) => user.email?.toLowerCase() === ownerEmail
    );
    if (!owner) throw new Error("Nie znaleziono konta WeldHub o podanym adresie e-mail.");

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        owner_id: owner.id,
        name: lead.name,
        city: lead.city,
        region: lead.region,
        address: lead.address,
        phone: lead.phone,
        email: lead.email || ownerEmail,
        website: lead.website,
        services: lead.services,
        materials: lead.materials,
        welding_methods: lead.welding_methods,
        service_area: lead.service_area,
        mobile_service: lead.mobile_service,
        status: "published",
        moderation_status: "pending",
        moderation_note: "Profil utworzony z importu po zgodzie firmy.",
      })
      .select("id")
      .single();
    if (companyError) {
      if (companyError.code === "23505") {
        throw new Error("To konto ma już firmę o tej nazwie.");
      }
      throw new Error(companyError.message);
    }

    const now = new Date().toISOString();
    const { error: linkError } = await supabase
      .from("company_leads")
      .update({
        status: "converted",
        linked_company_id: company.id,
        updated_at: now,
      })
      .eq("id", leadId);
    if (linkError) {
      await supabase.from("companies").delete().eq("id", company.id);
      throw new Error(linkError.message);
    }

    await supabase.from("moderation_audit_log").insert({
      admin_id: admin.id,
      action: "convert_company_lead",
      target_type: "company",
      target_id: String(company.id),
      note: `Utworzono profil z leada #${leadId} dla ${ownerEmail}.`,
    });

    return NextResponse.json(
      { ok: true, companyId: company.id },
      { headers: NO_STORE }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się utworzyć profilu." },
      { status: 400, headers: NO_STORE }
    );
  }
}

function forbidden() {
  return NextResponse.json(
    { error: "Brak uprawnień administratora." },
    { status: 403, headers: NO_STORE }
  );
}

