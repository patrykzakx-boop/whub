import "server-only";

import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export type AuthenticatedAdmin = {
  id: string;
  email: string | null;
};

export async function authenticateUser(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!accessToken) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) return null;
  return data.user;
}

export async function authenticateAdmin(
  request: Request
): Promise<AuthenticatedAdmin | null> {
  const user = await authenticateUser(request);
  if (!user) return null;

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return data ? { id: user.id, email: user.email || null } : null;
}

export async function isBlockedUser(userId: string) {
  const { data } = await createSupabaseAdmin()
    .from("blocked_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}
