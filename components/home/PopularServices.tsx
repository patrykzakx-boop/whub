import Image from "next/image";
import Link from "next/link";

export default function PopularServices() {
  const services = [
    {
      id: "balustrady",
      name: "Balustrady",
      description: "Balustrady balkonowe, schodowe i tarasowe.",
      icon: "/icons/Balustrades.png",
    },
    {
      id: "bramy",
      name: "Bramy i ogrodzenia",
      description: "Bramy, furtki, przęsła i ogrodzenia stalowe.",
      icon: "/icons/Gates.png",
    },
    {
      id: "schody",
      name: "Schody stalowe",
      description: "Schody techniczne, przemysłowe i do domu.",
      icon: "/icons/Stairs.png",
    },
    {
      id: "konstrukcje",
      name: "Konstrukcje stalowe",
      description: "Stelaże, ramy, zadaszenia i elementy nośne.",
      icon: "/icons/SteelStructures.png",
    },
    {
      id: "naprawy",
      name: "Naprawy i regeneracje",
      description: "Pęknięcia, zawiasy, ramy i nietypowe awarie.",
      icon: "/icons/MobileWelder.png",
    },
    {
      id: "rurociagi",
      name: "Rurociągi",
      description: "Instalacje, rury i elementy technologiczne.",
      icon: "/icons/PipeLines.png",
    },
  ];

  return (
    <section className="bg-[#05070a] py-14">
      <div className="mx-auto max-w-7xl px-4">

        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Popularne usługi
          </div>

          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Wybierz najbliższy zakres prac
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Zacznij od popularnej kategorii albo dodaj zapytanie, jeśli temat
            jest nietypowy.
          </p>
        </div>

          <Link
            href="/companies"
            className="text-sm font-medium text-orange-400 transition hover:text-orange-300"
          >
            Zobacz wszystkie firmy
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          {services.map((service) => (
            <Link
              key={service.id}
              href={`/companies?service=${service.id}`}
              className="group rounded-2xl border border-slate-800 bg-[#0b1016] p-4 transition hover:-translate-y-0.5 hover:border-slate-600 hover:bg-[#0f151d]"
            >
              <div className="flex items-start gap-3 xl:block">
                <Image
                  src={service.icon}
                  alt={service.name}
                  width={46}
                  height={46}
                  className="h-11 w-11 shrink-0 object-contain opacity-90 transition-transform duration-200 group-hover:scale-105 xl:mb-4"
                />

                <div>
                  <h3 className="text-sm font-semibold text-white md:text-base">
                    {service.name}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-gray-400">
                    {service.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}

        </div>
      </div>
    </section>
  );
}
