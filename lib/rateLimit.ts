import "server-only";

import { createHmac } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

type RateLimitOptions = {
  scope: string;
  maxRequests: number;
  windowSeconds: number;
  identifier?: string | number | null;
};

type ResetRateLimitOptions = Pick<RateLimitOptions, "scope" | "identifier">;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Zabezpieczenie formularza jest chwilowo niedostępne.");
    this.name = "RateLimitUnavailableError";
  }
}

type RateLimitRow = {
  allowed: boolean;
  retry_after_seconds: number;
};

export async function consumeRateLimit(
  request: Request,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const secret =
    process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new RateLimitUnavailableError();
  }

  const bucketKey = createBucketKey(request, options, secret);
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_bucket_key: bucketKey,
    p_max_requests: options.maxRequests,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    throw new RateLimitUnavailableError();
  }

  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;

  if (!row || typeof row.allowed !== "boolean") {
    throw new RateLimitUnavailableError();
  }

  return {
    allowed: row.allowed,
    retryAfterSeconds: Math.max(0, Number(row.retry_after_seconds) || 0),
  };
}

export async function resetRateLimit(
  request: Request,
  options: ResetRateLimitOptions
) {
  const secret =
    process.env.RATE_LIMIT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new RateLimitUnavailableError();
  }

  const bucketKey = createBucketKey(request, options, secret);
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.rpc("reset_api_rate_limit", {
    p_bucket_key: bucketKey,
  });

  if (error) {
    throw new RateLimitUnavailableError();
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address =
    request.headers.get("x-real-ip") || forwardedFor?.split(",")[0] || "unknown";

  return address.trim().slice(0, 128) || "unknown";
}

function normalizeIdentifier(value: RateLimitOptions["identifier"]) {
  return String(value ?? "").trim().toLowerCase().slice(0, 256);
}

function createBucketKey(
  request: Request,
  options: ResetRateLimitOptions,
  secret: string
) {
  const identity = [
    options.scope,
    getClientIp(request),
    normalizeIdentifier(options.identifier),
  ].join(":");

  return createHmac("sha256", secret).update(identity).digest("hex");
}
