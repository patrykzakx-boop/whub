import Image from "next/image";
import { User, Building2, TriangleAlert } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-visible bg-[#05070a]">
      <div className="mx-auto max-w-screen-2xl px-4 pt-2 pb-12 lg:pb-24">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          {/* LEWA STRONA */}
          <div className="w-full pt-4 lg:w-[60%]">
            <h1 className="mb-4 max-w-[680px] text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-[52px]">
              Znajdź wykonawcę
              <br />
              lub dodaj
              <br />
              <span className="text-orange-500">
                zlecenie spawalnicze
              </span>
            </h1>

            <p className="mb-6 max-w-[560px] text-base leading-7 text-gray-400">
              Opisz projekt, dodaj zdjęcia lub szkic i otrzymaj odpowiedzi od
              wykonawców z Twojej okolicy. Bez dziesiątek telefonów i
              przypadkowych ogłoszeń.
            </p>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1218] p-2.5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px] lg:grid-cols-[1fr_180px_220px]">
                <input
                  type="text"
                  placeholder="Np. balustrada stalowa, brama przesuwna..."
                  className="h-10 rounded-xl border border-slate-700 bg-[#05070a] px-4 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Lokalizacja"
                  className="h-10 rounded-xl border border-slate-700 bg-[#05070a] px-4 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none"
                />

                <button className="h-10 rounded-xl bg-orange-500 px-4 text-sm font-medium text-white transition hover:bg-orange-600">
                  Szukaj wykonawców
                </button>
              </div>
            </div>
          </div>

          {/* PRAWA STRONA */}
          <div className="relative hidden lg:block lg:w-[40%]">
            <div className="relative h-full min-h-[380px] overflow-hidden rounded-xl">
              <Image
                src="/images/hero-welding-v2.jpg"
                alt="Spawacz podczas pracy"
                fill
                priority
                sizes="40vw"
                className="object-cover object-right"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-[#05070a]/60 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* KAFELKI */}
      <div className="relative z-20 mt-8 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:translate-y-1/2">
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {/* KLIENT */}
            <div className="flex min-h-[170px] flex-col justify-between rounded-3xl border border-orange-500/30 bg-[#0d1218] p-4 lg:min-h-[190px] lg:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-orange-500">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
                  <User className="h-6 w-6 text-orange-500" />
                </div>

                <div>
                  <h3 className="text-base lg:text-xl font-semibold text-white">
                    Klient indywidualny
                  </h3>

                  <p className="mt-1 text-xs lg:text-sm text-gray-400">
                    Bramy, schody, balustrady i naprawy.
                  </p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-xl bg-orange-500 py-3 text-sm font-medium text-white transition hover:bg-orange-600">
                Dodaj zlecenie
              </button>
            </div>

            {/* WYKONAWCA */}
            <div className="flex min-h-[170px] flex-col justify-between rounded-3xl border border-slate-700 bg-[#0d1218] p-4 lg:min-h-[190px] lg:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-500">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full border border-slate-600 bg-slate-800">
                  <Building2 className="h-6 w-6 text-slate-300" />
                </div>

                <div>
                  <h3 className="text-base lg:text-xl font-semibold text-white">
                    Wykonawca
                  </h3>

                  <p className="mt-1 text-xs lg:text-sm text-gray-400">
                    Zdobywaj nowych klientów.
                  </p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-xl border border-slate-600 py-3 text-sm font-medium text-white transition hover:border-orange-500">
                Dołącz
              </button>
            </div>

            {/* AWARIA */}
            <div className="col-span-2 lg:col-span-1 flex min-h-[170px] flex-col justify-between rounded-3xl border border-red-500/30 bg-[#0d1218] p-4 lg:min-h-[190px] lg:p-6 transition-all duration-200 hover:-translate-y-1 hover:border-red-500">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="flex h-12 w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                  <TriangleAlert className="h-6 w-6 text-red-400" />
                </div>

                <div>
                  <h3 className="text-base lg:text-xl font-semibold text-red-400">
                    Nagła awaria
                  </h3>

                  <p className="mt-1 text-xs lg:text-sm text-gray-400">
                    Potrzebujesz pomocy jeszcze dzisiaj?
                  </p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition hover:bg-red-700">
                Zgłoś awarię
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}