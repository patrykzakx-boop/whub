import { NextResponse } from "next/server";

import { authenticateAdmin } from "@/lib/adminAuth";
import {
  CompanyImportRow,
  CompanyLeadInput,
  MAX_COMPANY_IMPORT_FILE_BYTES,
  findDuplicateReason,
} from "@/lib/companyImport";
import { parseCompanyImportFile } from "@/lib/companyImportFile";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) return forbidden();

  const supabase = createSupabaseAdmin();
  const [leadsResult, batchesResult] = await Promise.all([
    supabase
      .from("company_leads")
      .select(
        "id, source_row, name, nip, city, region, phone, email, website, primary_profile, services, services_raw, source_url, source_type, status, privacy_notice_sent_at, consent_at, linked_company_id, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("company_import_batches")
      .select(
        "id, file_name, total_rows, imported_rows, duplicate_rows, invalid_rows, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const error = leadsResult.error || batchesResult.error;
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: NO_STORE }
    );
  }

  return NextResponse.json(
    { leads: leadsResult.data || [], batches: batchesResult.data || [] },
    { headers: NO_STORE }
  );
}

export async function POST(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) return forbidden();

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_COMPANY_IMPORT_FILE_BYTES + 100_000) {
      throw new Error("Plik może mieć maksymalnie 2 MB.");
    }

    const formData = await request.formData();
    const mode = String(formData.get("mode") || "preview");
    const includeDuplicates = String(formData.get("includeDuplicates") || "false") === "true";
    const file = formData.get("file");

    if (!(file instanceof File)) throw new Error("Wybierz plik do importu.");
    if (!['preview', 'import'].includes(mode)) throw new Error("Nieprawidłowa operacja importu.");

    const parsed = await parseCompanyImportFile(file);
    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: parsed.errors.join(" "), details: parsed },
        { status: 400, headers: NO_STORE }
      );
    }

    const supabase = createSupabaseAdmin();
    const existing = await loadExistingCompanies(supabase);
    const rows = parsed.rows.map((row) => addExistingDuplicate(row, existing));
    const summary = summarizeRows(rows);

    if (mode === "preview") {
      return NextResponse.json(
        { rows, ignoredHeaders: parsed.ignoredHeaders, summary },
        { headers: NO_STORE }
      );
    }

    const importableRows = rows.filter(
      (row) =>
        row.errors.length === 0 && (includeDuplicates || !row.duplicateReason)
    );
    if (importableRows.length === 0) {
      throw new Error("Plik nie zawiera nowych, poprawnych firm do zaimportowania.");
    }

    const { data: batch, error: batchError } = await supabase
      .from("company_import_batches")
      .insert({
        file_name: file.name.slice(0, 255),
        total_rows: rows.length,
        imported_rows: importableRows.length,
        duplicate_rows: summary.duplicate,
        invalid_rows: summary.invalid,
        created_by: admin.id,
      })
      .select("id")
      .single();
    if (batchError) throw new Error(batchError.message);

    const { error: insertError } = await supabase.from("company_leads").insert(
      importableRows.map((row) => ({
        import_batch_id: batch.id,
        source_row: row.sourceRow,
        name: row.data.name,
        nip: row.data.nip,
        city: row.data.city,
        region: row.data.region,
        address: row.data.address,
        phone: row.data.phone,
        email: row.data.email,
        website: row.data.website,
        primary_profile: row.data.primaryProfile,
        services: row.data.services,
        services_raw: row.data.servicesRaw,
        materials: row.data.materials,
        welding_methods: row.data.weldingMethods,
        service_area: row.data.serviceArea,
        mobile_service: row.data.mobileService,
        source_url: row.data.sourceUrl,
        source_type: row.data.sourceType,
        notes: row.data.notes,
        created_by: admin.id,
      }))
    );
    if (insertError) throw new Error(insertError.message);

    await supabase.from("moderation_audit_log").insert({
      admin_id: admin.id,
      action: "import_company_leads",
      target_type: "company_import_batch",
      target_id: batch.id,
      note: `Plik ${file.name}: zaimportowano ${importableRows.length} firm${includeDuplicates ? " (wraz z zaakceptowanymi potencjalnymi duplikatami)" : ""}.`,
    });

    return NextResponse.json(
      { ok: true, batchId: batch.id, imported: importableRows.length, summary },
      { headers: NO_STORE }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import nie powiódł się." },
      { status: 400, headers: NO_STORE }
    );
  }
}

async function loadExistingCompanies(supabase: ReturnType<typeof createSupabaseAdmin>) {
  const [leadsResult, companiesResult] = await Promise.all([
    supabase
      .from("company_leads")
      .select("name, nip, city, phone, email, website")
      .neq("status", "archived")
      .limit(5000),
    supabase
      .from("companies")
      .select("name, city, phone, email, website")
      .limit(5000),
  ]);
  const error = leadsResult.error || companiesResult.error;
  if (error) throw new Error(error.message);
  return [
    ...(leadsResult.data || []),
    ...(companiesResult.data || []),
  ] as Array<Partial<CompanyLeadInput>>;
}

function addExistingDuplicate(
  row: CompanyImportRow,
  existing: Array<Partial<CompanyLeadInput>>
) {
  if (row.errors.length > 0 || row.duplicateReason) return row;
  return {
    ...row,
    duplicateReason: findDuplicateReason(row.data, existing),
  };
}

function summarizeRows(rows: CompanyImportRow[]) {
  const invalid = rows.filter((row) => row.errors.length > 0).length;
  const duplicate = rows.filter(
    (row) => row.errors.length === 0 && Boolean(row.duplicateReason)
  ).length;
  return {
    total: rows.length,
    valid: rows.length - invalid - duplicate,
    invalid,
    duplicate,
    warnings: rows.filter((row) => row.warnings.length > 0).length,
  };
}

function forbidden() {
  return NextResponse.json(
    { error: "Brak uprawnień administratora." },
    { status: 403, headers: NO_STORE }
  );
}
