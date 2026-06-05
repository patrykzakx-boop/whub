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
          <h2 className="text-4xl font-bold text-white">
            Jak to działa?
          </h2>

          <p className="mt-2 text-gray-400">
            Dodaj zlecenie i otrzymaj oferty od sprawdzonych wykonawców.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className="flex items-center">
                <div className="flex items-center gap-4">
                  <Image
                    src={step.icon}
                    alt={step.title}
                    width={72}
                    height={72}
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

                {index < steps.length - 1 && (
                  <div className="ml-6 text-3xl text-orange-500">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}