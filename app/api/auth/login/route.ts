import { NextResponse } from "next/server";
import { validateLoginCredentials } from "@/lib/authValidation";
import { requireCaptchaToken } from "@/lib/captcha";
import {
  consumeRateLimit,
  RateLimitUnavailableError,
  resetRateLimit,
} from "@/lib/rateLimit";
import { createSupabaseAuthServer } from "@/lib/supabaseAuthServer";
import { isBlockedUser } from "@/lib/adminAuth";

const LOGIN_ATTEMPTS = 3;
const LOGIN_WINDOW_SECONDS = 30 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credentials = validateLoginCredentials(body);
    const captchaToken = requireCaptchaToken(body.captchaToken);
    const emailRateLimit = await consumeRateLimit(request, {
      scope: "auth-login-email",
      identifier: credentials.email,
      maxRequests: LOGIN_ATTEMPTS,
      windowSeconds: LOGIN_WINDOW_SECONDS,
    });

    if (!emailRateLimit.allowed) {
      return blockedLoginResponse(emailRateLimit.retryAfterSeconds);
    }

    const ipRateLimit = await consumeRateLimit(request, {
      scope: "auth-login-ip",
      maxRequests: 15,
      windowSeconds: LOGIN_WINDOW_SECONDS,
    });

    if (!ipRateLimit.allowed) {
      return blockedLoginResponse(ipRateLimit.retryAfterSeconds);
    }

    const supabase = createSupabaseAuthServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      ...credentials,
      options: { captchaToken },
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: "Nieprawidłowy e-mail lub hasło." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (await isBlockedUser(data.session.user.id)) {
      return NextResponse.json(
        { error: "To konto zostało zablokowane. Skontaktuj się z administratorem WeldHub." },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    try {
      await resetRateLimit(request, {
        scope: "auth-login-email",
        identifier: credentials.email,
      });
    } catch {
      // A successful authentication must not fail only because cleanup failed.
    }

    return NextResponse.json(
      {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
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
          error instanceof Error ? error.message : "Nie udało się zalogować.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function blockedLoginResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: buildRetryMessage(retryAfterSeconds),
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

function buildRetryMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Wykorzystano 3 próby logowania. Spróbuj ponownie za ${minutes} min.`;
}
