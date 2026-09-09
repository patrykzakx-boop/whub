"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { SERVICES } from "@/components/company-form/constants/services";

const serviceCategories = [
  "Spawalnictwo",
  "Obróbka metali",
  "Wykończenie powierzchni",
];

type SelectedFilters = {
  service: string[];
};

export default function CompanySearchPanel() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SelectedFilters>({
    service: [],
  });

  const selectedLabels = useMemo(() => {
    return selected.service.map(getServiceTitle);
  }, [selected]);

  const summary =
    selectedLabels.length === 0
      ? "Wybierz zakres prac"
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`;

  const toggleFilter = (type: keyof SelectedFilters, value: string) => {
    setSelected((current) => {
      const values = current[type];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return {
        ...current,
        [type]: nextValues,
      };
    });
  };

  const clearFilters = () => {
    setSelected({
      service: [],
    });
  };

  const popup = open
    ? createPortal(
        <div className="fixed inset-0 z-[9999]">
          <button
            type="button"
            aria-label="Zamknij wybór zakresu prac"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <div className="absolute inset-x-3 top-20 mx-auto max-h-[calc(100vh-7rem)] max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1016] shadow-2xl shadow-black/70 md:inset-x-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-4 py-4 md:px-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Wybierz zakres prac
                </div>

                <p className="mt-1 max-w-2xl text-sm text-gray-400">
                  Zaznacz jedną lub kilka usług. Lista jest taka sama jak w kreatorze profilu firmy.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-[#05070a] hover:text-white"
              >
                Zamknij
              </button>
            </div>

            <div className="max-h-[calc(100vh-18rem)] overflow-y-auto px-4 py-2 md:px-5">
              {serviceCategories.map((category) => (
                <FilterGroup
                  key={category}
                  title={category}
                  type="service"
                  values={SERVICES.filter((service) => service.category === category).map(
                    (service) => service.id
                  )}
                  selected={selected.service}
                  getLabel={getServiceTitle}
                  onToggle={toggleFilter}
                />
              ))}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-slate-500 hover:text-white"
              >
                Wyczyść
              </button>

              <button
                type="submit"
                form="company-search-form"
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Pokaż firmy
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <form
      id="company-search-form"
      action="/companies"
      className="relative mt-8 max-w-[860px] rounded-2xl border border-slate-700/70 bg-[#0b1016]/85 p-2.5 shadow-2xl shadow-black/30 backdrop-blur"
    >
      {selected.service.map((value) => (
        <input key={`service-${value}`} type="hidden" name="service" value={value} />
      ))}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_160px]">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex h-11 min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#05070a]/90 px-4 text-left text-sm text-white transition hover:border-slate-500"
          aria-expanded={open}
        >
          <span className={selectedLabels.length ? "truncate text-white" : "truncate text-gray-500"}>
            {summary}
          </span>

          <span className="shrink-0 text-gray-500">⌄</span>
        </button>

        <input
          name="location"
          type="text"
          placeholder="Miasto lub województwo"
          className="h-11 rounded-xl border border-slate-700 bg-[#05070a]/90 px-4 text-sm text-white placeholder:text-gray-500 focus:border-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Szukaj firm
        </button>
      </div>

      {popup}
    </form>
  );
}

function FilterGroup({
  title,
  type,
  values,
  selected,
  getLabel,
  onToggle,
}: {
  title: string;
  type: keyof SelectedFilters;
  values: string[];
  selected: string[];
  getLabel: (id: string) => string;
  onToggle: (type: keyof SelectedFilters, value: string) => void;
}) {
  return (
    <section className="border-b border-slate-800 py-4 last:border-b-0">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </div>

      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {values.map((value) => {
          const checked = selected.includes(value);

          return (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-gray-300 transition hover:bg-[#070b10] hover:text-white"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(type, value)}
                className="h-4 w-4 rounded border-slate-700 bg-[#05070a] accent-orange-500"
              />

              <span>{getLabel(value)}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function getServiceTitle(id: string) {
  return SERVICES.find((service) => service.id === id)?.title || id;
}
