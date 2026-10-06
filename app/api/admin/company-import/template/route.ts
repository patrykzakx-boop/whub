import { authenticateAdmin } from "@/lib/adminAuth";

const HEADERS = [
  "Firma",
  "NIP",
  "Miasto",
  "Województwo",
  "Profil główny",
  "Zakres usług",
  "Adres",
  "Telefon",
  "E-mail",
  "Strona_www",
  "Źródło danych",
  "Rodzaj źródła",
  "Materiały",
  "Metody spawania",
  "Obszar działania",
  "Usługi mobilne",
  "Uwagi",
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
