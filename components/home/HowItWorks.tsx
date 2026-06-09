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
    <section className="bg-[#05070a] pt-8 pb-0">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Jak to działa?
          </h2>

          <p className="mt-2 text-sm text-gray-400 md:text-base">
            Dodaj zlecenie i otrzymaj oferty od sprawdzonych wykonawców.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-800 bg-[#111827]/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={step.icon}
                    alt={step.title}
                    width={64}
                    height={64}
                    className="shrink-0 object-contain"
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
      </div>
    </section>
  );
}