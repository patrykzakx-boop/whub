import Link from "next/link";

export default function Contractor() {
  return (
    <section className="px-4 py-2">
      <div className="relative overflow-hidden rounded-2xl border border-orange-500">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/contractor-banner.jpg')",
          }}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Left gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#020817]/95 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex min-h-[170px] items-center justify-between px-6 py-4 md:px-8">
          <div className="max-w-xl">
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Jesteś wykonawcą?
            </h2>

            <p className="mb-4 text-sm text-gray-300 md:text-base">
              Dołącz do Weldhub i zdobywaj nowe zlecenia od klientów
              indywidualnych oraz firm z całej Polski.
            </p>

            <div className="space-y-1 text-sm text-white">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                Dostęp do nowych projektów
              </div>

              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                Stała współpraca B2B
              </div>

              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                Rozwijaj swoją firmę z nami
              </div>
            </div>
          </div>

          <Link
            href="/dla-wykonawcow"
            className="ml-8 shrink-0 rounded-lg bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Dołącz jako firma →
          </Link>
        </div>
      </div>
    </section>
  );
}