import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isBlockedUser } from "@/lib/adminAuth";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Zaloguj się ponownie, aby usunąć ogłoszenie." },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Zaloguj się ponownie, aby usunąć ogłoszenie." },
        { status: 401 }
      );
    }


    if (await isBlockedUser(userData.user.id)) {
      return NextResponse.json({ error: "To konto jest zablokowane." }, { status: 403 });
    }

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select("id, customer_id")
      .eq("id", id)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: "Nie znaleziono ogłoszenia." },
        { status: 404 }
      );
    }

    if (requestData.customer_id !== userData.user.id) {
      return NextResponse.json(
        { error: "Nie możesz usunąć tego ogłoszenia." },
        { status: 403 }
      );
    }

    const { error: offersDeleteError } = await supabase
      .from("request_offers")
      .delete()
      .eq("request_id", requestData.id);

    if (offersDeleteError) {
      return NextResponse.json(
        { error: offersDeleteError.message },
        { status: 500 }
      );
    }

    const { error: requestDeleteError } = await supabase
      .from("requests")
      .delete()
      .eq("id", requestData.id)
      .eq("customer_id", userData.user.id);

    if (requestDeleteError) {
      return NextResponse.json(
        { error: requestDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nieoczekiwany błąd." },
      { status: 500 }
    );
  }
}
