import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="bg-[#05070a]">
      <div className="mx-auto max-w-screen-2xl px-4 pt-2 pb-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">

          <div className="w-full pt-4 lg:w-[65%]">
            <h1 className="mb-4 max-w-[680px] text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-[52px]">
              Znajdź sprawdzonego
              <br />
              wykonawcę{" "}
              <span className="text-orange-500">
                spawalniczego
              </span>
              <br />
              do swojego projektu
            </h1>

            <p className="mb-6 max-w-[560px] text-base leading-7 text-gray-400">
              Opisz projekt, dodaj zdjęcia lub szkic i otrzymaj odpowiedzi od
              wykonawców z Twojej okolicy. Bez dziesiątek telefonów i
              przypadkowych ogłoszeń.
            </p>

            <div className="max-w-[600px] rounded-2xl border border-slate-800 bg-[#0d1218] p-2.5">
              <div className="grid grid-cols-[1fr_160px_200px] gap-3 max-[750px]:grid-cols-1">

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

                <button className="h-10 w-full rounded-xl bg-orange-500 px-4 text-sm font-medium text-white transition hover:bg-orange-600">
                  Szukaj wykonawców
                </button>

              </div>
            </div>
          </div>

          <div className="relative hidden lg:block lg:w-[35%]">
            <div className="relative h-full min-h-[380px] overflow-hidden rounded-xl">
              <Image
                src="/images/hero-welding-v2.jpg"
                alt="Spawacz podczas pracy"
                fill
                priority
                sizes="35vw"
                className="object-cover object-right"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#05070a] via-[#05070a]/60 to-transparent" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}