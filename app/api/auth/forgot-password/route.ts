import { NextResponse } from "next/server";
import { validatePasswordReset } from "@/lib/authValidation";
import {
  consumeRateLimit,
  RateLimitUnavailableError,
} from "@/lib/rateLimit";
import { createSupabaseAuthServer } from "@/lib/supabaseAuthServer";

const RESET_ATTEMPTS = 3;
const RESET_WINDOW_SECONDS = 30 * 60;
const GENERIC_SUCCESS_MESSAGE =
  "Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = validatePasswordReset(body);
    const emailRateLimit = await consumeRateLimit(request, {
      scope: "auth-password-reset-email",
      identifier: email,
      maxRequests: RESET_ATTEMPTS,
      windowSeconds: RESET_WINDOW_SECONDS,
    });

    if (!emailRateLimit.allowed) {
      return blockedResetResponse(emailRateLimit.retryAfterSeconds);
    }

    const ipRateLimit = await consumeRateLimit(request, {
      scope: "auth-password-reset-ip",
      maxRequests: 10,
      windowSeconds: RESET_WINDOW_SECONDS,
    });

    if (!ipRateLimit.allowed) {
      return blockedResetResponse(ipRateLimit.retryAfterSeconds);
    }

    const supabase = createSupabaseAuthServer();
    const redirectTo = buildResetPasswordUrl(request);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error && !isSupabaseRateLimitError(error.message)) {
      return NextResponse.json(
        { error: "Nie udało się wysłać linku. Spróbuj ponownie później." },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { message: GENERIC_SUCCESS_MESSAGE },
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
            : "Nie udało się wysłać linku resetującego.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function buildResetPasswordUrl(request: Request) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = configuredUrl || new URL(request.url).origin;

  return new URL("/reset-password", baseUrl).toString();
}

function blockedResetResponse(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return NextResponse.json(
    {
      error: `Wykorzystano 3 próby resetowania hasła. Spróbuj ponownie za ${minutes} min.`,
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

function isSupabaseRateLimitError(message: string) {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("security purposes")
  );
}
