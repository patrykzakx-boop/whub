import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  type CreateRequestInput,
  validateRequestSubmission,
} from "@/lib/requestSubmission";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateRequestInput;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) throw new Error("Brakuje konfiguracji Supabase.");

    const input = validateRequestSubmission(body, supabaseUrl);

    const supabase = createSupabaseAdmin();
    let customerId: string | null = null;
    const authHeader = request.headers.get("authorization") || "";

    if (authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.slice("Bearer ".length);
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error || !data.user) {
        return NextResponse.json(
          { error: "Sesja wygasła. Zaloguj się ponownie albo odśwież stronę." },
          { status: 401 }
        );
      }

      customerId = data.user.id;
    }

    if (input.companyId !== null) {
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("id", input.companyId)
        .eq("status", "published")
        .maybeSingle();

      if (!company) {
        return NextResponse.json(
          { error: "Wybrana firma nie istnieje albo nie jest już opublikowana." },
          { status: 404 }
        );
      }
    }

    const accessToken = crypto.randomUUID();
    const { data: createdRequest, error: insertError } = await supabase
      .from("requests")
      .insert({
        title: input.title,
        category: input.category,
        description: input.description,
        city: input.city,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        customer_email: input.customerEmail,
        customer_id: customerId,
        access_token: accessToken,
        request_type: input.requestType,
        company_id: input.companyId,
        status: "new",
        contractor_status: "new",
        image_url: input.imageUrls[0] ?? null,
        image_urls: input.imageUrls,
      })
      .select("id, access_token")
      .single();

    if (insertError || !createdRequest) {
      return NextResponse.json(
        { error: insertError?.message || "Nie udało się zapisać zapytania." },
        { status: 500 }
      );
    }

    return NextResponse.json(createdRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać zapytania.",
      },
      { status: 400 }
    );
  }
}
