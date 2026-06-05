import Image from "next/image";

export default function PopularServices() {
  const services = [
    {
      name: "Bramy i ogrodzenia",
      icon: "/icons/Gates.png",
    },
    {
      name: "Balustrady",
      icon: "/icons/Balustrades.png",
    },
    {
      name: "Schody stalowe",
      icon: "/icons/Stairs.png",
    },
    {
      name: "Konstrukcje stalowe",
      icon: "/icons/SteelStructures.png",
    },
    {
      name: "Spawanie aluminium",
      icon: "/icons/Aluminium.png",
    },
    {
      name: "Mobilny spawacz",
      icon: "/icons/MobileWelder.png",
    },
  ];

  return (
<section className="bg-[#05070a] pt-40 pb-8">
        <div className="mx-auto max-w-screen-2xl px-4">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-white">
            Znajdź wykonawcę według specjalizacji
          </h2>

          <p className="mt-2 text-gray-400">
            Najczęściej wyszukiwane usługi spawalnicze i ślusarskie.
          </p>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {services.map((service) => (
            <button
              key={service.name}
              className="
                group
                min-h-[140px]
                rounded-3xl
                border border-slate-800
                bg-[#0d1218]
                p-4
                transition-all duration-200
                hover:-translate-y-1
                hover:border-orange-500
                hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]

                flex
                flex-col
                items-center
                justify-center
                text-center
              "
            >
              <Image
                src={service.icon}
                alt={service.name}
                width={70}
                height={70}
                className="mb-3 object-contain"
              />

              <h3 className="text-base font-semibold text-white">
                {service.name}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}