import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

import { SERVICES } from "@/components/company-form/constants/services";
import { MATERIALS } from "@/components/company-form/constants/materials";
import { METHODS } from "@/components/company-form/constants/methods";

type SearchParams = {
  q?: string | string[];
  location?: string | string[];
  region?: string | string[];
  service?: string | string[];
  material?: string | string[];
  method?: string | string[];
  mobile?: string | string[];
};

type Props = {
  searchParams: Promise<SearchParams>;
};

type Company = {
  id: string;
  name: string;
  logo_url?: string | null;
  city?: string | null;
  region?: string | null;
  address?: string | null;
  description?: string | null;
  mobile_service?: boolean | null;
  services?: string[] | null;
  materials?: string[] | null;
  welding_methods?: string[] | null;
};

export default async function CompaniesPage({ searchParams }: Props) {
  const filters = await searchParams;
  const selectedRegion = getFirstParam(filters.region);
  const selectedServices = getParamValues(filters.service);
  const selectedMaterials = getParamValues(filters.material);
  const selectedMethods = getParamValues(filters.method);
  const selectedMobile = getFirstParam(filters.mobile);

  const { data: allCompanies } = await supabase
    .from("companies")
    .select("region")
    .eq("status", "published");

  const regions = Array.from(
    new Set(allCompanies?.map((company) => company.region).filter(Boolean))
  );

  const {
    data: companiesData,
    error: companiesError,
  } = await supabase
    .from("companies")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const companies = ((companiesData || []) as Company[]).filter((company) => {
    const queryText = normalizeSearchText(getFirstParam(filters.q));
    const locationText = normalizeSearchText(getFirstParam(filters.location));
    const companyServices = company.services || [];
    const companyMaterials = company.materials || [];
    const companyMethods = company.welding_methods || [];

    const matchesQuery =
      !queryText ||
      searchCompanyText(company, queryText);

    const matchesRegion =
      !selectedRegion ||
      company.region === selectedRegion;

    const matchesServices =
      selectedServices.length === 0 ||
      selectedServices.every((service) => companyServices.includes(service));

    const matchesMaterials =
      selectedMaterials.length === 0 ||
      selectedMaterials.every((material) => companyMaterials.includes(material));

    const matchesMethods =
      selectedMethods.length === 0 ||
      selectedMethods.every((method) => companyMethods.includes(method));

    const matchesMobile =
      selectedMobile !== "true" ||
      company.mobile_service === true;

    const matchesLocation =
      !locationText ||
      [company.city, company.region, company.address]
        .filter(Boolean)
        .some((value) => normalizeSearchText(value).includes(locationText));

    return (
      matchesQuery &&
      matchesRegion &&
      matchesServices &&
      matchesMaterials &&
      matchesMethods &&
      matchesMobile &&
      matchesLocation
    );
  });

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="mb-7">
          <div className="mb-3 text-sm text-gray-500">
            Strona główna › Firmy
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white lg:text-5xl">
                Lista firm spawalniczych i zakładów obróbki metali
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 sm:text-base">
                Znajdź sprawdzone firmy spawalnicze w swojej okolicy. Porównuj
                usługi, technologie i doświadczenie.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0b1016] px-6 py-4 text-center">
              <div className="text-3xl font-bold text-white">
                {companies?.length || 0}
              </div>

              <div className="mt-1 text-sm text-gray-400">firm w katalogu</div>
            </div>
          </div>
        </section>

        <form
          action="/companies"
          className="mb-7 rounded-2xl border border-slate-800 bg-[#0b1016] p-4"
        >
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <input
              name="q"
              defaultValue={getFirstParam(filters.q)}
              placeholder="Szukaj firmy, usługi, miasta..."
              className="rounded-xl border border-slate-800 bg-[#05070a] px-5 py-3.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-slate-600"
            />

            <input
              name="location"
              defaultValue={getFirstParam(filters.location)}
              placeholder="Lokalizacja"
              className="rounded-xl border border-slate-800 bg-[#05070a] px-5 py-3.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-slate-600 lg:max-w-[220px]"
            />

            <Link
              href="/companies"
              className="rounded-xl border border-slate-800 bg-[#070b10] px-5 py-3.5 text-center text-sm font-medium text-gray-300 transition hover:border-slate-600 hover:text-white"
            >
              Wyczyść filtry
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <select
              name="region"
              defaultValue={selectedRegion}
              className="rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-300 outline-none focus:border-slate-600"
            >
              <option value="">Województwo</option>

              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              name="service"
              defaultValue={selectedServices[0] || ""}
              className="rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-300 outline-none focus:border-slate-600"
            >
              <option value="">Usługi</option>

              {SERVICES.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </select>

            <select
              name="material"
              defaultValue={selectedMaterials[0] || ""}
              className="rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-300 outline-none focus:border-slate-600"
            >
              <option value="">Materiały</option>

              {MATERIALS.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.title}
                </option>
              ))}
            </select>

            <select
              name="method"
              defaultValue={selectedMethods[0] || ""}
              className="rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-300 outline-none focus:border-slate-600"
            >
              <option value="">Metody spawania</option>

              {METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.title}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#05070a] px-4 py-3 text-sm text-gray-300">
              <input
                type="checkbox"
                name="mobile"
                value="true"
                defaultChecked={selectedMobile === "true"}
                className="accent-orange-500"
              />
              Tylko z dojazdem
            </label>

            <button className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600">
              Filtruj
            </button>
          </div>
        </form>

        {companies.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-[#0b1016] p-12 text-center text-gray-400">
            {companiesError
              ? "Nie udało się pobrać firm. Spróbuj odświeżyć stronę."
              : "Brak firm spełniających wybrane filtry."}
          </div>
        )}

        {companies.length > 0 && (
          <section className="space-y-3">
            {companies.map((company) => {
              const services = company.services || [];

              return (
                <article
                  key={company.id}
                  className="rounded-2xl border border-slate-800 bg-[#0b1016] p-4 transition hover:border-slate-600 hover:bg-[#0d1218]"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-black sm:h-20 sm:w-20">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={company.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">Logo</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <h2 className="text-lg font-semibold text-white sm:text-xl">
                            {company.name}
                          </h2>

                          {company.mobile_service && (
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-gray-300">
                              Usługi z dojazdem
                            </span>
                          )}
                        </div>

                        {(company.city || company.region) && (
                          <div className="mt-2 text-sm text-gray-500">
                            {[company.city, company.region]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}

                        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-gray-400">
                          {company.description ||
                            "Firma nie dodała jeszcze opisu."}
                        </p>

                        {services.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {services.slice(0, 3).map((service: string) => (
                              <span
                                key={service}
                                className="rounded-full border border-slate-800 bg-[#070b10] px-3 py-1 text-xs text-gray-300"
                              >
                                {getServiceTitle(service)}
                              </span>
                            ))}

                            {services.length > 3 && (
                              <span className="rounded-full border border-slate-800 bg-[#070b10] px-3 py-1 text-xs text-gray-500">
                                +{services.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 lg:pl-6">
                      <Link
                        href={`/company/${company.id}`}
                        className="inline-flex w-full justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-orange-500 hover:text-orange-300 sm:w-auto"
                      >
                        Zobacz profil
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function getServiceTitle(id: string) {
  return SERVICES.find((service) => service.id === id)?.title || id;
}

function getMaterialTitle(id: string) {
  return MATERIALS.find((material) => material.id === id)?.title || id;
}

function getMethodTitle(id: string) {
  return METHODS.find((method) => method.id === id)?.title || id;
}

function getFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function getParamValues(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function normalizeSearchText(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function searchCompanyText(company: Company, query: string) {
  const plainFields = [
    company.name,
    company.city,
    company.region,
    company.address,
    company.description,
  ];

  const serviceFields = (company.services || []).flatMap((service: string) => [
    service,
    getServiceTitle(service),
  ]);

  const materialFields = (company.materials || []).flatMap((material: string) => [
    material,
    getMaterialTitle(material),
  ]);

  const methodFields = (company.welding_methods || []).flatMap((method: string) => [
    method,
    getMethodTitle(method),
  ]);

  return [
    ...plainFields,
    ...serviceFields,
    ...materialFields,
    ...methodFields,
  ]
    .filter(Boolean)
    .some((value) => normalizeSearchText(value).includes(query));
}
