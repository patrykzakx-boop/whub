import { NextResponse } from "next/server";
import { validatePasswordChange } from "@/lib/authValidation";
import { requireCaptchaToken } from "@/lib/captcha";
import {
  consumeRateLimit,
  RateLimitUnavailableError,
  resetRateLimit,
} from "@/lib/rateLimit";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseAuthServer } from "@/lib/supabaseAuthServer";
import { isBlockedUser } from "@/lib/adminAuth";

const CHANGE_ATTEMPTS = 3;
const CHANGE_WINDOW_SECONDS = 30 * 60;

export async function POST(request: Request) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Zaloguj się ponownie, aby zmienić hasło." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const body = await request.json();
    const passwords = validatePasswordChange(body);
    const captchaToken = requireCaptchaToken(body.captchaToken);
    const authClient = createSupabaseAuthServer();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Sesja wygasła. Zaloguj się ponownie." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }


    if (await isBlockedUser(user.id)) {
      return NextResponse.json({ error: "To konto jest zablokowane." }, { status: 403 });
    }

    const userLimit = await consumeRateLimit(request, {
      scope: "auth-change-password-user",
      identifier: user.id,
      maxRequests: CHANGE_ATTEMPTS,
      windowSeconds: CHANGE_WINDOW_SECONDS,
    });

    if (!userLimit.allowed) {
      return blockedChangeResponse(userLimit.retryAfterSeconds);
    }

    const verificationClient = createSupabaseAuthServer();
    const { error: verificationError } =
      await verificationClient.auth.signInWithPassword({
        email: user.email,
        password: passwords.currentPassword,
        options: { captchaToken },
      });

    if (verificationError) {
      return NextResponse.json(
        { error: "Bieżące hasło jest nieprawidłowe." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const admin = createSupabaseAdmin();
    const { error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      { password: passwords.newPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { error: "Nie udało się zmienić hasła. Spróbuj ponownie później." },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    await admin.auth.admin.signOut(accessToken, "others");

    try {
      await resetRateLimit(request, {
        scope: "auth-change-password-user",
        identifier: user.id,
      });
    } catch {
      // Zmiana hasła nie może zostać cofnięta tylko z powodu błędu porządkowania limitu.
    }

    return NextResponse.json(
      {
        message:
          "Hasło zostało zmienione. Pozostałe aktywne sesje zostały wylogowane.",
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
            : "Nie udało się zmienić hasła.",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
}

function blockedChangeResponse(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return NextResponse.json(
    {
      error: `Wykorzystano 3 próby zmiany hasła. Spróbuj ponownie za ${minutes} min.`,
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
