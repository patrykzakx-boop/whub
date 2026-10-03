import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const { error } = await supabase
      .from("public_request_listings")
      .select("id")
      .limit(1);

    if (error) throw error;

    return NextResponse.json(
      {
        status: "ok",
        checks: { application: "ok", database: "ok" },
        responseTimeMs: Date.now() - startedAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        checks: { application: "ok", database: "unavailable" },
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
