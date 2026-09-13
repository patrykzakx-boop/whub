import { NextResponse } from "next/server";
import { validateRegistration } from "@/lib/authValidation";
import { requireCaptchaToken } from "@/lib/captcha";
import {
  consumeRateLimit,
  RateLimitUnavailableError,
} from "@/lib/rateLimit";
import { createSupabaseAuthServer } from "@/lib/supabaseAuthServer";

const REGISTRATION_WINDOW_SECONDS = 60 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credentials = validateRegistration(body);
    const captchaToken = requireCaptchaToken(body.captchaToken);

    const emailRateLimit = await consumeRateLimit(request, {
      scope: "auth-register-email",
      identifier: credentials.email,
      maxRequests: 3,
      windowSeconds: REGISTRATION_WINDOW_SECONDS,
    });

    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: "Wysłano zbyt wiele prób rejestracji. Spróbuj za godzinę." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(emailRateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const ipRateLimit = await consumeRateLimit(request, {
      scope: "auth-register-ip",
      maxRequests: 10,
      windowSeconds: REGISTRATION_WINDOW_SECONDS,
    });

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Wysłano zbyt wiele prób rejestracji. Spróbuj za godzinę." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(ipRateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const supabase = createSupabaseAuthServer();
    const { error } = await supabase.auth.signUp({
      ...credentials,
      options: { captchaToken },
    });

    if (error) {
      return NextResponse.json(
        { error: "Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { message: "Konto utworzone. Sprawdź swoją skrzynkę e-mail." },
      { status: 201, headers: { "Cache-Control": "no-store" } }
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
            : "Nie udało się utworzyć konta.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}
