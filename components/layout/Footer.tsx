export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#05070a]">
      <div className="mx-auto max-w-screen-2xl px-4 py-16">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Logo */}
          <div>
            <h3 className="text-2xl font-bold text-white">
              WeldHub
            </h3>

            <p className="mt-4 text-sm leading-6 text-gray-400">
              Portal łączący klientów z wykonawcami usług
              spawalniczych i ślusarskich w całej Polsce.
            </p>
          </div>

          {/* Klienci */}
          <div>
            <h4 className="mb-4 font-semibold text-white">
              Dla klientów
            </h4>

            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-orange-500">
                  Dodaj zlecenie
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-orange-500">
                  Znajdź wykonawcę
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-orange-500">
                  Jak działa
                </a>
              </li>
            </ul>
          </div>

          {/* Firmy */}
          <div>
            <h4 className="mb-4 font-semibold text-white">
              Dla wykonawców
            </h4>

            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-orange-500">
                  Dodaj firmę
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-orange-500">
                  Pakiety
                </a>
              </li>

              <li>
                <a href="#" className="hover:text-orange-500">
                  Regulamin
                </a>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h4 className="mb-4 font-semibold text-white">
              Kontakt
            </h4>

            <ul className="space-y-3 text-sm text-gray-400">
              <li>kontakt@weldhub.pl</li>
              <li>Polska</li>
            </ul>
          </div>

        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-gray-500">
          © 2026 WeldHub. Wszelkie prawa zastrzeżone.
        </div>

      </div>
    </footer>
  );
}