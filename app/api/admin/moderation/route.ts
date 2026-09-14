import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/adminAuth";
import { parseModerationAction } from "@/lib/moderation";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Brak uprawnień administratora." }, { status: 403, headers: NO_STORE });
  }

  const supabase = createSupabaseAdmin();
  const [companiesResult, requestsResult, reportsResult, blocksResult, auditResult] = await Promise.all([
    supabase.from("companies")
      .select("id, name, city, owner_id, status, moderation_status, moderation_note, description, phone, email, website, services, created_at")
      .eq("moderation_status", "pending").order("created_at", { ascending: true }).limit(100),
    supabase.from("requests")
      .select("id, title, city, customer_id, customer_email, status, moderation_status, moderation_note, description, category, created_at")
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("moderation_reports")
      .select("id, reporter_id, target_type, target_id, reason, details, status, created_at")
      .eq("status", "open").order("created_at", { ascending: true }).limit(100),
    supabase.from("blocked_users")
      .select("user_id, reason, blocked_at, blocked_by").order("blocked_at", { ascending: false }).limit(100),
    supabase.from("moderation_audit_log")
      .select("id, admin_id, action, target_type, target_id, note, created_at")
      .order("created_at", { ascending: false }).limit(50),
  ]);

  const firstError = [companiesResult, requestsResult, reportsResult, blocksResult, auditResult]
    .find((result) => result.error)?.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500, headers: NO_STORE });
  }

  const userIds = new Set<string>();
  for (const company of companiesResult.data || []) if (company.owner_id) userIds.add(company.owner_id);
  for (const item of requestsResult.data || []) if (item.customer_id) userIds.add(item.customer_id);
  for (const report of reportsResult.data || []) if (report.reporter_id) userIds.add(report.reporter_id);
  for (const block of blocksResult.data || []) userIds.add(block.user_id);

  const userEntries = await Promise.all(
    [...userIds].map(async (id) => {
      const { data } = await supabase.auth.admin.getUserById(id);
      return [id, data.user?.email || null] as const;
    })
  );

  return NextResponse.json({
    admin,
    companies: companiesResult.data || [],
    requests: requestsResult.data || [],
    reports: reportsResult.data || [],
    blockedUsers: blocksResult.data || [],
    auditLog: auditResult.data || [],
    userEmails: Object.fromEntries(userEntries),
  }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Brak uprawnień administratora." }, { status: 403, headers: NO_STORE });
  }

  try {
    const input = parseModerationAction(await request.json());
    const supabase = createSupabaseAdmin();
    const now = new Date().toISOString();
    let operationError: { message: string } | null = null;

    switch (input.action) {
      case "approve_company": {
        const result = await supabase.from("companies").update({
          moderation_status: "approved", moderation_note: input.note,
          moderated_at: now, moderated_by: admin.id,
        }).eq("id", input.targetId);
        operationError = result.error;
        break;
      }
      case "reject_company": {
        const result = await supabase.from("companies").update({
          moderation_status: "rejected", moderation_note: input.note || "Profil wymaga poprawy.",
          moderated_at: now, moderated_by: admin.id,
        }).eq("id", input.targetId);
        operationError = result.error;
        break;
      }
      case "hide_request": {
        const result = await supabase.from("requests").update({
          moderation_status: "hidden", moderation_note: input.note || "Treść narusza zasady WeldHub.",
          moderated_at: now, moderated_by: admin.id,
        }).eq("id", input.targetId);
        operationError = result.error;
        break;
      }
      case "restore_request": {
        const result = await supabase.from("requests").update({
          moderation_status: "visible", moderation_note: input.note,
          moderated_at: now, moderated_by: admin.id,
        }).eq("id", input.targetId);
        operationError = result.error;
        break;
      }
      case "block_user": {
        if (input.targetId === admin.id) throw new Error("Nie możesz zablokować własnego konta.");
        const result = await supabase.from("blocked_users").upsert({
          user_id: input.targetId,
          reason: input.note || "Naruszenie zasad WeldHub",
          blocked_at: now,
          blocked_by: admin.id,
        });
        operationError = result.error;
        if (!operationError) {
          const hideResult = await supabase.from("companies").update({
            moderation_status: "rejected",
            moderation_note: "Profil ukryty z powodu blokady konta.",
            moderated_at: now,
            moderated_by: admin.id,
          }).eq("owner_id", input.targetId);
          operationError = hideResult.error;
        }
        break;
      }
      case "unblock_user": {
        const result = await supabase.from("blocked_users").delete().eq("user_id", input.targetId);
        operationError = result.error;
        break;
      }
      case "resolve_report":
      case "dismiss_report": {
        const result = await supabase.from("moderation_reports").update({
          status: input.action === "resolve_report" ? "resolved" : "dismissed",
          resolution_note: input.note,
          resolved_at: now,
          resolved_by: admin.id,
        }).eq("id", input.targetId);
        operationError = result.error;
        break;
      }
    }

    if (operationError) throw new Error(operationError.message);

    const { error: auditError } = await supabase.from("moderation_audit_log").insert({
      admin_id: admin.id,
      action: input.action,
      target_type: input.targetType || inferTargetType(input.action),
      target_id: input.targetId,
      note: input.note,
    });
    if (auditError) throw new Error("Operacja została wykonana, ale nie zapisano historii: " + auditError.message);

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się wykonać operacji." },
      { status: 400, headers: NO_STORE }
    );
  }
}

function inferTargetType(action: string) {
  if (action.includes("company")) return "company";
  if (action.includes("request")) return "request";
  if (action.includes("report")) return "report";
  return "user";
}
