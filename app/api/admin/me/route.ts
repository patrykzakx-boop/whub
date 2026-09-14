import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const admin = await authenticateAdmin(request);
  return NextResponse.json(
    { isAdmin: Boolean(admin), email: admin?.email || null },
    { status: admin ? 200 : 403, headers: { "Cache-Control": "no-store" } }
  );
}
