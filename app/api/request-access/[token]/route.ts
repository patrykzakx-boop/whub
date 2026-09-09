import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

type Params = {
  params: Promise<{
    token: string;
  }>;
};

type PatchBody = {
  status?: "completed" | "cancelled";
};

export async function GET(_request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const supabase = createSupabaseAdmin();

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("id, title, city, category, description, status, created_at, customer_name, customer_phone, customer_email, access_token")
      .eq("access_token", token)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: "Link do zlecenia jest nieprawidłowy albo wygasł." },
        { status: 404 }
      );
    }

    const { data: offersData, error: offersError } = await supabase
      .from("request_offers")
      .select("*, companies(id, name, city, region, phone, email, logo_url)")
      .eq("request_id", requestData.id)
      .order("created_at", { ascending: false });

    if (offersError) {
      return NextResponse.json(
        { error: offersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      request: requestData,
      offers: offersData || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = (await request.json()) as PatchBody;
    const nextStatus = body.status;

    if (nextStatus !== "completed" && nextStatus !== "cancelled") {
      return NextResponse.json(
        { error: "Nieprawidłowy status zlecenia." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("id, status")
      .eq("access_token", token)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: "Link do zlecenia jest nieprawidłowy albo wygasł." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("requests")
      .update({ status: nextStatus })
      .eq("id", requestData.id)
      .eq("access_token", token);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (nextStatus === "cancelled") {
      await supabase
        .from("request_offers")
        .update({ status: "rejected" })
        .eq("request_id", requestData.id)
        .not("status", "in", "(accepted,chosen)");
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}
