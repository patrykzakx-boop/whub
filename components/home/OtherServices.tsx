import Image from "next/image";

export default function OtherServices() {
  const services = [
    {
      name: "Laser CNC",
      image: "/images/OtherServices/LaserCNC.webp",
    },
    {
      name: "Frezowanie CNC",
      image: "/images/OtherServices/CarvingCNC.webp",
    },
    {
      name: "Toczenie CNC",
      image: "/images/OtherServices/LatheCNC.webp",
    },
    {
      name: "Gięcie rur i profili",
      image: "/images/OtherServices/Bending.webp",
    },
    {
      name: "Piaskowanie",
      image: "/images/OtherServices/Sanding.webp",
    },
    {
      name: "Malowanie proszkowe",
      image: "/images/OtherServices/Painting.webp",
    },
    {
      name: "Cynkowanie",
      image: "/images/OtherServices/Zincing.webp",
    },
    {
      name: "Grawerowanie",
      image: "/images/OtherServices/Craving.webp",
    },
  ];

  return (
    <section className="bg-[#05070a] py-24">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white">
            Potrzebujesz więcej niż spawania?
          </h2>

          <p className="mt-2 max-w-3xl text-gray-400">
            Na WeldingHub znajdziesz również firmy oferujące
            usługi CNC, obróbkę metalu oraz zabezpieczenia
            powierzchni dla klientów indywidualnych i przemysłu.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.name}
              className="
                group
                overflow-hidden
                rounded-3xl
                border border-slate-800
                bg-[#0d1218]
                transition-all duration-300
                hover:-translate-y-1
                hover:border-orange-500
                hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]
              "
            >
              <div className="relative h-[220px] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  className="
                    object-cover
                    transition-transform duration-500
                    group-hover:scale-105
                  "
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/30 to-transparent" />
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-white">
                  {service.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}