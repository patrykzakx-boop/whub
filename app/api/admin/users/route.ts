import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const NO_STORE = { "Cache-Control": "no-store" };
const MAX_USERS = 1000;

export async function GET(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { error: "Brak uprawnień administratora." },
      { status: 403, headers: NO_STORE }
    );
  }

  const supabase = createSupabaseAdmin();
  const [usersResult, blocksResult, companiesResult, requestsResult, adminsResult] =
    await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: MAX_USERS }),
      supabase.from("blocked_users").select("user_id"),
      supabase.from("companies").select("id, name, owner_id"),
      supabase.from("requests").select("id, customer_id"),
      supabase.from("admin_users").select("user_id"),
    ]);

  if (usersResult.error) {
    return NextResponse.json(
      { error: usersResult.error.message },
      { status: 500, headers: NO_STORE }
    );
  }

  const databaseError = [blocksResult, companiesResult, requestsResult, adminsResult]
    .find((result) => result.error)?.error;
  if (databaseError) {
    return NextResponse.json(
      { error: databaseError.message },
      { status: 500, headers: NO_STORE }
    );
  }

  const blockedIds = new Set((blocksResult.data || []).map((item) => item.user_id));
  const adminIds = new Set((adminsResult.data || []).map((item) => item.user_id));
  const companiesByOwner = new Map<string, { id: number; name: string | null }[]>();
  const requestCountByOwner = new Map<string, number>();

  for (const company of companiesResult.data || []) {
    if (!company.owner_id) continue;
    const companies = companiesByOwner.get(company.owner_id) || [];
    companies.push({ id: company.id, name: company.name });
    companiesByOwner.set(company.owner_id, companies);
  }

  for (const item of requestsResult.data || []) {
    if (!item.customer_id) continue;
    requestCountByOwner.set(
      item.customer_id,
      (requestCountByOwner.get(item.customer_id) || 0) + 1
    );
  }

  const users = usersResult.data.users.map((user) => ({
    id: user.id,
    email: user.email || null,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at || null,
    emailConfirmedAt: user.email_confirmed_at || user.confirmed_at || null,
    isBlocked: blockedIds.has(user.id),
    isAdmin: adminIds.has(user.id),
    companies: companiesByOwner.get(user.id) || [],
    requestCount: requestCountByOwner.get(user.id) || 0,
  }));

  return NextResponse.json(
    {
      users,
      total: usersResult.data.total,
      truncated: usersResult.data.total > MAX_USERS,
    },
    { headers: NO_STORE }
  );
}
