import Link from "next/link";
import { MATERIALS } from "@/components/company-form/constants/materials";
import { METHODS } from "@/components/company-form/constants/methods";
import { SERVICES } from "@/components/company-form/constants/services";

const serviceGroups = [
  {
    title: "Spawalnictwo",
    items: SERVICES.filter((service) => service.category === "Spawalnictwo").map(
      (service) => ({
        label: service.title,
        href: `/companies?service=${service.id}`,
      })
    ),
  },
  {
    title: "Obróbka metali",
    items: SERVICES.filter((service) => service.category === "Obróbka metali").map(
      (service) => ({
        label: service.title,
        href: `/companies?service=${service.id}`,
      })
    ),
  },
  {
    title: "Wykończenie powierzchni",
    items: SERVICES.filter(
      (service) => service.category === "Wykończenie powierzchni"
    ).map((service) => ({
      label: service.title,
      href: `/companies?service=${service.id}`,
    })),
  },
  {
    title: "Materiały",
    items: MATERIALS.map((material) => ({
      label: material.title,
      href: `/companies?material=${material.id}`,
    })),
  },
  {
    title: "Metody spawania",
    items: METHODS.map((method) => ({
      label: method.title,
      href: `/companies?method=${method.id}`,
    })),
  },
];

export default function OtherServices() {
  return (
    <section className="bg-[#05070a] py-8 lg:py-12">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
            Zobacz wszystkie usługi
          </div>

          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Pełny zakres prac na WeldHub
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
            Przejdź od razu do firm według usług, materiałów albo metod
            spawania.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {serviceGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-slate-800 bg-[#0d1218] p-4"
            >
              <h3 className="mb-3 text-sm font-semibold text-white">
                {group.title}
              </h3>

              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-slate-800 bg-[#05070a] px-3 py-1.5 text-xs text-gray-300 transition hover:border-orange-500 hover:text-orange-400"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
