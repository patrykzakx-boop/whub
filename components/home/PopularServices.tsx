import Link from "next/link";

const services = [
  "Balustrady",
  "Bramy",
  "Schody",
  "Ogrodzenia",
  "Aluminium",
  "Rurociągi",
];

export default function PopularServices() {
  return (
    <section className="pt-6 pb-24">
<div className="mx-auto max-w-screen-2xl px-4 pt-2 pb-2">       
     <div className="mb-10 flex items-center justify-between">
          <h2 className="mb-4 max-w-[580px] text-[32px] font-bold leading-[1.1] tracking-tight text-white">
            Najczęściej wyszukiwane usługi
          </h2>

          <Link
            href="/uslugi"
            className="text-lg font-medium text-orange-500 transition hover:text-orange-400"
          >
            Pokaż wszystkie →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-6">
          {services.map((service) => (
            <Link
              key={service}
              href={`/uslugi/${service.toLowerCase()}`}
              className="
                flex h-36 items-center justify-center
                rounded-3xl
                border border-slate-800
                bg-[#07111d]
                px-6
                text-center
                transition-all duration-200
                hover:-translate-y-1
                hover:border-blue-500
                hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]
              "
            >
              <span className="text-xl font-semibold text-white">
                {service}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}