import { NextResponse } from "next/server";
import { authenticateUser, isBlockedUser } from "@/lib/adminAuth";
import { parseReportInput } from "@/lib/moderation";
import { consumeRateLimit, RateLimitUnavailableError } from "@/lib/rateLimit";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Zaloguj się, aby zgłosić nadużycie." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (await isBlockedUser(user.id)) {
      return NextResponse.json(
        { error: "To konto jest zablokowane." },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const limit = await consumeRateLimit(request, {
      scope: "moderation-report-user",
      identifier: user.id,
      maxRequests: 10,
      windowSeconds: 24 * 60 * 60,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Osiągnięto dzienny limit zgłoszeń." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const input = parseReportInput(await request.json());
    const supabase = createSupabaseAdmin();
    const table = input.targetType === "company" ? "companies" : "requests";
    const { data: target } = await supabase
      .from(table)
      .select("id")
      .eq("id", input.targetId)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Ta treść już nie istnieje." }, { status: 404 });
    }

    const { data: duplicate } = await supabase
      .from("moderation_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("target_type", input.targetType)
      .eq("target_id", input.targetId)
      .eq("status", "open")
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "To zgłoszenie oczekuje już na rozpatrzenie." },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("moderation_reports").insert({
      reporter_id: user.id,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      details: input.details,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nie udało się wysłać zgłoszenia." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
