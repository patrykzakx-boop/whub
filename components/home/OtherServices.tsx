import Image from "next/image";
import Link from "next/link";

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
      name: "Piaskowanie",
      image: "/images/OtherServices/Sanding.webp",
    },
    {
      name: "Malowanie proszkowe",
      image: "/images/OtherServices/Painting.webp",
    },
  ];

  return (
    <section className="bg-[#05070a] py-12 lg:py-20">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Potrzebujesz więcej niż spawania?
          </h2>

          <p className="mt-2 max-w-3xl text-sm text-gray-400 md:text-base">
            Na Weldhub znajdziesz również firmy oferujące usługi CNC,
            obróbkę metalu oraz zabezpieczenia powierzchni dla klientów
            indywidualnych i przemysłu.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
              <div className="relative h-[140px] overflow-hidden lg:h-[170px]">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="
                    object-cover
                    transition-transform duration-500
                    group-hover:scale-105
                  "
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/20 to-transparent" />
              </div>

              <div className="p-3 lg:p-4">
                <h3 className="text-sm font-semibold text-white lg:text-base">
                  {service.name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/uslugi"
            className="
              rounded-xl
              border border-orange-500
              px-6
              py-3
              text-sm
              font-medium
              text-white
              transition
              hover:bg-orange-500
            "
          >
            Zobacz wszystkie usługi
          </Link>
        </div>
      </div>
    </section>
  );
}