import Image from "next/image";

export default function HowItWorks() {
  const steps = [
    {
      title: "Dodaj zlecenie",
      description: "Opisz projekt i dodaj zdjęcia.",
      icon: "/icons/icon1.png",
    },
    {
      title: "Otrzymaj oferty",
      description: "Firmy przesyłają swoje propozycje.",
      icon: "/icons/icon2.png",
    },
    {
      title: "Porównaj oferty",
      description: "Sprawdź opinie i wybierz wykonawcę.",
      icon: "/icons/icon3.png",
    },
    {
      title: "Zrealizuj projekt",
      description: "Rozpocznij współpracę z wybraną firmą.",
      icon: "/icons/icon4.png",
    },
  ];

  return (
    <section className="bg-[#05070a] py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Proces
          </div>

          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Jak to działa?
          </h2>

          <p className="mt-2 text-sm text-gray-400 md:text-base">
            Dodaj zlecenie i otrzymaj oferty od wykonawców.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-800 bg-[#0b1016] p-4"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={step.icon}
                    alt={step.title}
                    width={64}
                    height={64}
                    className="h-12 w-12 shrink-0 object-contain opacity-90"
                  />

                  <div>
                    <h3 className="mb-1 text-base font-semibold text-white">
                      {step.title}
                    </h3>

                    <p className="text-sm leading-5 text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
