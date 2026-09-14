"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pl">
      <body style={{ margin: 0, background: "#05070a", color: "white", fontFamily: "Arial, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 560, textAlign: "center" }}>
            <h1>Nie udało się uruchomić WeldHub</h1>
            <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>Odśwież stronę. Jeśli problem się powtarza, spróbuj ponownie za chwilę.</p>
            <button type="button" onClick={reset} style={{ marginTop: 18, border: 0, borderRadius: 12, padding: "14px 20px", background: "#f97316", color: "white", fontWeight: 700 }}>Odśwież aplikację</button>
          </div>
        </main>
      </body>
    </html>
  );
}
