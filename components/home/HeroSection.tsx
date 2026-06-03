import Image from "next/image";
import { User, Building2, TriangleAlert } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-visible bg-[#05070a]">
      <div className="mx-auto max-w-screen-2xl px-4 pt-2 pb-28">

        <div className="flex items-stretch gap-6">

          {/* LEWA STRONA */}
          <div className="w-[60%] shrink-0 pt-4">

            <h1 className="mb-4 max-w-[620px] text-[42px] font-bold leading-[1.05] tracking-tight text-white">
              Znajdź wykonawcę
              <br />
              lub dodaj
              <br />
              <span className="text-orange-500">
                zlecenie spawalnicze
              </span>
            </h1>

            <p className="mb-6 max-w-[560px] text-base leading-7 text-gray-400">
              Opisz projekt, dodaj zdjęcia lub szkic i otrzymaj
              odpowiedzi od wykonawców z Twojej okolicy.
              Bez dziesiątek telefonów i przypadkowych ogłoszeń.
            </p>

            {/* WYSZUKIWARKA */}
            <div className="mb-8">
              <div className="rounded-2xl border border-slate-800 bg-[#0d1218] p-2.5">
                <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px]">

                  <input
                    type="text"
                    placeholder="Np. balustrada stalowa, brama przesuwna, spawanie aluminium..."
                    className="h-10 rounded-xl border border-slate-700 bg-[#05070a] px-4 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none"
                  />

                  <input
                    type="text"
                    placeholder="Lokalizacja"
                    className="h-10 rounded-xl border border-slate-700 bg-[#05070a] px-4 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none"
                  />

                  <button className="h-10 rounded-xl bg-orange-500 px-4 text-sm font-medium text-white transition hover:bg-orange-600">
                    Dodaj zlecenie
                  </button>

                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Bramy",
                  "Balustrady",
                  "Schody",
                  "Ogrodzenia",
                  "Aluminium",
                  "Konstrukcje stalowe",
                ].map((item) => (
                  <button
                    key={item}
                    className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-gray-300 transition hover:border-orange-500 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* PRAWA STRONA */}
          <div className="relative w-[40%]">
            <div className="relative h-full min-h-[380px] overflow-hidden rounded-xl">

              <Image
                src="/images/hero-welding-v2.jpg"
                alt="Spawacz podczas pracy"
                fill
                priority
                className="object-cover object-right"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-[#05070a]/60 to-transparent" />

            </div>
          </div>

        </div>

      </div>

      {/* KAFELKI */}
      <div className="absolute left-0 right-0 bottom-0 z-20 translate-y-1/2">
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="grid grid-cols-3 gap-6">

            {/* KLIENT */}
            <div className="flex min-h-[190px] flex-col justify-between rounded-3xl border border-orange-500/30 bg-[#0d1218] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-orange-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
                  <User className="h-7 w-7 text-orange-500" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Klient indywidualny
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Bramy, schody, balustrady, ogrodzenia i naprawy.
                  </p>
                </div>
              </div>

              <button className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-sm font-medium text-white transition hover:bg-orange-600">
                Dodaj zlecenie
              </button>
            </div>

            {/* WYKONAWCA */}
            <div className="flex min-h-[190px] flex-col justify-between rounded-3xl border border-slate-700 bg-[#0d1218] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-600 bg-slate-800">
                  <Building2 className="h-7 w-7 text-slate-300" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Wykonawca
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Dołącz do platformy i zdobywaj nowych klientów.
                  </p>
                </div>
              </div>

              <button className="mt-6 w-full rounded-xl border border-slate-600 py-3 text-sm font-medium text-white transition hover:border-orange-500">
                Dołącz jako wykonawca
              </button>
            </div>

            {/* AWARIA */}
            <div className="flex min-h-[190px] flex-col justify-between rounded-3xl border border-red-500/30 bg-[#0d1218] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                  <TriangleAlert className="h-7 w-7 text-red-400" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-red-400">
                    Nagła awaria
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Potrzebujesz pomocy jeszcze dzisiaj?
                  </p>
                </div>
              </div>

              <button className="mt-6 w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition hover:bg-red-700">
                Zgłoś awarię
              </button>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}