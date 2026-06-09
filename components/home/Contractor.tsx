import Link from "next/link";

export default function Contractor() {
  return (
    <section className="bg-[#05070a] px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/30">

        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/contractor-banner.jpg')",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#020817]/90 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex min-h-[260px] flex-col justify-center gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">

          <div className="max-w-2xl">
            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
              Jesteś wykonawcą usług spawalniczych?
            </h2>

            <p className="mb-5 text-gray-300">
              Pokaż swoją firmę tysiącom klientów poszukujących sprawdzonych
              wykonawców. Otrzymuj nowe zapytania i buduj swoją markę
              w największej społeczności spawalniczej w Polsce.
            </p>

            <div className="space-y-2 text-sm text-white">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                Nowe zapytania od klientów
              </div>

              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                Widoczność firmy w całej Polsce
              </div>

              <div className="flex items-center gap-2">
                <span className="text-orange-500">✓</span>
                Budowanie zaufania poprzez realizacje
              </div>
            </div>
          </div>

          <Link
            href="/dla-wykonawcow"
            className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Dodaj firmę →
          </Link>

        </div>
      </div>
    </section>
  );
}