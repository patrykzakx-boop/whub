import { REQUEST_CATEGORIES } from "@/lib/requestCategories";

export default function AddRequestPage() {
  return (
    <main className="min-h-screen bg-[#05070a]">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-sm text-orange-500">
            ← Powrót do strony głównej
          </p>

          <h1 className="text-4xl font-bold text-white">
            Dodaj zapytanie
          </h1>

          <p className="mt-3 max-w-2xl text-gray-400">
            Opisz czego potrzebujesz, a zainteresowani wykonawcy
            odezwą się do Ciebie z ofertą.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* FORM */}
          <div className="space-y-6">

            {/* Kategoria */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                1. Kategoria
              </h2>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {REQUEST_CATEGORIES.map((item) => (
                  <button
                    key={item.value}
                    className="rounded-xl border border-slate-700 p-4 text-sm text-white hover:border-orange-500"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opis */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                2. Opis projektu
              </h2>

              <textarea
                rows={8}
                placeholder="Opisz projekt, wymiary, materiał, termin realizacji..."
                className="w-full rounded-2xl border border-slate-700 bg-[#05070a] p-4 text-white outline-none focus:border-orange-500"
              />
            </div>

            {/* Lokalizacja */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                3. Lokalizacja
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  placeholder="Miasto"
                  className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
                />

                <input
                  placeholder="Kod pocztowy"
                  className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
                />
              </div>
            </div>

            {/* Zdjęcia */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                4. Zdjęcia projektu
              </h2>

              <div className="rounded-2xl border-2 border-dashed border-slate-700 p-12 text-center text-gray-400">
                Przeciągnij zdjęcia tutaj lub wybierz pliki
              </div>
            </div>

            {/* Kontakt */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                5. Dane kontaktowe
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  placeholder="Imię i nazwisko"
                  className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
                />

                <input
                  placeholder="Telefon"
                  className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
                />
              </div>

              <input
                placeholder="Email"
                className="mt-4 w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
              />
            </div>

            {/* Priorytet */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                6. Priorytet
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-orange-500 p-4 text-white">
                  Standardowe
                </div>

                <div className="rounded-2xl border border-red-500 p-4 text-white">
                  Pilne / awaria
                </div>
              </div>
            </div>

            <button className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-semibold text-white hover:bg-orange-600">
              Opublikuj zapytanie
            </button>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">

            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">
                Jak to działa?
              </h3>

              <div className="space-y-4 text-gray-300">
                <p>1. Dodaj zapytanie</p>
                <p>2. Otrzymaj oferty</p>
                <p>3. Wybierz wykonawcę</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">
                Bezpiecznie i za darmo
              </h3>

              <div className="space-y-3 text-gray-300">
                <p>✓ Dodanie zapytania jest darmowe</p>
                <p>✓ Twoje dane są bezpieczne</p>
                <p>✓ Sam wybierasz wykonawcę</p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
