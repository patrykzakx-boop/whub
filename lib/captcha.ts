import "server-only";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const MAX_TOKEN_LENGTH = 2_048;

type TurnstileResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export class CaptchaVerificationError extends Error {
  constructor(message = "Potwierdź, że nie jesteś robotem.") {
    super(message);
    this.name = "CaptchaVerificationError";
  }
}

export class CaptchaUnavailableError extends Error {
  constructor() {
    super("Weryfikacja CAPTCHA jest chwilowo niedostępna. Spróbuj ponownie.");
    this.name = "CaptchaUnavailableError";
  }
}

export function requireCaptchaToken(value: unknown) {
  if (typeof value !== "string") throw new CaptchaVerificationError();

  const token = value.trim();
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    throw new CaptchaVerificationError();
  }

  return token;
}

export async function verifyTurnstile(
  request: Request,
  token: string,
  expectedAction: string
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new CaptchaUnavailableError();

  const formData = new URLSearchParams({ secret, response: token });
  const clientIp = getClientIp(request);
  if (clientIp) formData.set("remoteip", clientIp);

  let response: Response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new CaptchaUnavailableError();
  }

  if (!response.ok) throw new CaptchaUnavailableError();

  const result = (await response.json().catch(() => null)) as
    | TurnstileResponse
    | null;

  if (!result?.success || result.action !== expectedAction) {
    throw new CaptchaVerificationError();
  }

  const allowedHostnames = getAllowedHostnames();
  const responseHostname = result.hostname?.toLowerCase();
  if (
    allowedHostnames.length > 0 &&
    (!responseHostname || !allowedHostnames.includes(responseHostname))
  ) {
    throw new CaptchaVerificationError();
  }
}

function getAllowedHostnames() {
  return (process.env.TURNSTILE_ALLOWED_HOSTNAMES || "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "";

  return request.headers.get("x-real-ip")?.trim() || "";
}
