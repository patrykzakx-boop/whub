import { authenticateAdmin } from "@/lib/adminAuth";

const HEADERS = [
  "nazwa",
  "nip",
  "miasto",
  "wojewodztwo",
  "adres",
  "telefon_firmowy",
  "email_firmowy",
  "strona_www",
  "uslugi",
  "materialy",
  "metody_spawania",
  "obszar_dzialania",
  "uslugi_mobilne",
  "zrodlo_url",
  "uwagi",
];

export async function GET(request: Request) {
  const admin = await authenticateAdmin(request);
  if (!admin) return new Response("Brak uprawnień administratora.", { status: 403 });

  return new Response(`\uFEFF${HEADERS.join(";")}\r\n`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="weldhub-import-firm.csv"',
    },
  });
}

