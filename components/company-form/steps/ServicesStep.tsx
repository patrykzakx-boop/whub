import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { SERVICES } from "../constants/services";

type Props = {
  services: string[];
  setServices: (services: string[]) => void;
};

export default function ServicesStep({
  services,
  setServices,
}: Props) {
  const [openCategories, setOpenCategories] =
    useState<string[]>(["Spawalnictwo"]);

  const categories = [
    "Spawalnictwo",
    "Obróbka metali",
    "Wykończenie powierzchni",
  ];

  const toggleCategory = (
    category: string
  ) => {
    if (
      openCategories.includes(category)
    ) {
      setOpenCategories(
        openCategories.filter(
          (item) => item !== category
        )
      );
    } else {
      setOpenCategories([
        ...openCategories,
        category,
      ]);
    }
  };

  const toggleService = (id: string) => {
    if (services.includes(id)) {
      setServices(
        services.filter(
          (service) => service !== id
        )
      );
    } else {
      setServices([...services, id]);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <h2 className="mb-2 text-2xl font-semibold text-white">
        Zakres działalności
      </h2>

      <p className="mb-8 text-gray-400">
        Wybierz obszary działalności firmy.
      </p>

      <div className="space-y-4">

        {categories.map((category) => {
          const categoryServices =
            SERVICES.filter(
              (service) =>
                service.category === category
            );

          const selectedCount =
            categoryServices.filter(
              (service) =>
                services.includes(
                  service.id
                )
            ).length;

          return (
            <div
              key={category}
              className="overflow-hidden rounded-2xl border border-slate-800"
            >

              <button
                type="button"
                onClick={() =>
                  toggleCategory(category)
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-900/40 transition"
              >
                <div>

                <div className="flex items-center gap-3">

  <div className="font-semibold text-white">
    {category}
  </div>

  {selectedCount > 0 && (
    <div className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-400">
      {selectedCount}
    </div>
  )}

</div>

                </div>

                <div className="text-gray-400">
                  {openCategories.includes(
                    category
                  ) ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>

              </button>

              {openCategories.includes(
                category
              ) && (
                <div className="grid gap-4 border-t border-slate-800 p-5 md:grid-cols-2 xl:grid-cols-3">

                  {categoryServices.map(
                    (service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() =>
                          toggleService(
                            service.id
                          )
                        }
                        className={`rounded-xl border p-4 text-left transition ${
                          services.includes(
                            service.id
                          )
                            ? "border-orange-500 bg-orange-500/10 text-white"
                            : "border-slate-700 text-gray-300 hover:border-orange-500"
                        }`}
                      >
                        {service.title}
                      </button>
                    )
                  )}

                </div>
              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}