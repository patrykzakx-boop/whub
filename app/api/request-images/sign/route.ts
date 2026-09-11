import { NextResponse } from "next/server";
import {
  consumeRateLimit,
  RateLimitUnavailableError,
} from "@/lib/rateLimit";
import { validateRequestImageMetadata } from "@/lib/requestImages";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

type RequestBody = {
  contentType?: string;
  size?: number;
};

export async function POST(request: Request) {
  try {
    const rateLimit = await consumeRateLimit(request, {
      scope: "request-image-sign",
      maxRequests: 24,
      windowSeconds: 15 * 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Wysłano zbyt wiele zdjęć. Spróbuj ponownie później." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const dailyRateLimit = await consumeRateLimit(request, {
      scope: "request-image-sign-daily",
      maxRequests: 60,
      windowSeconds: 24 * 60 * 60,
    });

    if (!dailyRateLimit.allowed) {
      return NextResponse.json(
        { error: "Osiągnięto dzienny limit zdjęć. Spróbuj ponownie jutro." },
        {
          status: 429,
          headers: { "Retry-After": String(dailyRateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = (await request.json()) as RequestBody;
    const image = validateRequestImageMetadata(body);
    const path = `requests/${crypto.randomUUID()}.${image.extension}`;
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from("request_images")
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Nie udało się przygotować uploadu zdjęcia." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("request_images")
      .getPublicUrl(path);

    return NextResponse.json(
      {
        path: data.path,
        token: data.token,
        publicUrl: publicUrlData.publicUrl,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się przygotować uploadu zdjęcia.",
      },
      { status: 400 }
    );
  }
}
