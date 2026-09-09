import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { SERVICES } from "@/components/company-form/constants/services";
import { MATERIALS } from "@/components/company-form/constants/materials";
import { METHODS } from "@/components/company-form/constants/methods";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type CompanyImage = {
  id: string;
  company_id: string;
  image_url: string;
};

export default async function CompanyPage({ params }: Props) {
  const { id } = await params;

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  const { data: images } = await supabase
    .from("company_images")
    .select("*")
    .eq("company_id", id);

  const requestHref = `/add-request?companyId=${company?.id || id}&companyName=${encodeURIComponent(company?.name || "")}`;

  if (!company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a]">
        <div className="text-gray-400">Firma nie istnieje.</div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] px-4 py-8 text-white lg:py-12">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.06),transparent_26%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:72px_72px] opacity-45" />
      </div>

      <article className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-slate-800/90 bg-[#0b1016]/95 shadow-2xl shadow-black/35 backdrop-blur">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f151d] via-[#0b1016] to-[#06090d]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgba(249,115,22,0.1),transparent_24%)]" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-black/70 shadow-xl shadow-black/25 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-4xl font-black text-orange-500">
                      WH
                    </div>
                    <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                      Logo firmy
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 border-l border-slate-700 pl-6">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Profil firmy spawalniczej
                </div>

                <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white lg:text-5xl">
                  {company.name}
                </h1>

                {company.address && (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">
                    {company.address}
                  </p>
                )}

                <GoogleRating
                  rating={company.google_rating}
                  reviewsCount={company.google_reviews_count}
                  mapsUrl={company.google_maps_url}
                />

                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                  {company.service_area && (
                    <span>
                      Obszar:{" "}
                      <span className="font-medium text-gray-200">
                        {company.service_area}
                      </span>
                    </span>
                  )}

                  <span>
                    Tryb pracy:{" "}
                    <span className="font-medium text-gray-200">
                      {company.mobile_service
                        ? "Usługi z dojazdem"
                        : "Prace w zakładzie"}
                    </span>
                  </span>

                  {company.founded_year && (
                    <span>
                      Na rynku od{" "}
                      <span className="font-medium text-gray-200">
                        {company.founded_year}
                      </span>
                    </span>
                  )}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={requestHref}
                    className="inline-flex justify-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Wyślij zapytanie
                  </Link>

                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="inline-flex justify-center rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-400"
                    >
                      Zadzwoń
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="space-y-10">
              <section>
                <SectionLabel>Opis</SectionLabel>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  O firmie
                </h2>

                <p className="mt-4 max-w-4xl whitespace-pre-wrap text-base leading-7 text-gray-300">
                  {company.description || "Firma nie dodała jeszcze opisu."}
                </p>
              </section>

              <section>
                <SectionLabel>Zakres prac</SectionLabel>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Oferta
                </h2>

                <div className="mt-5 grid gap-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#070b10]/45 md:grid-cols-3">
                  <SimpleList
                    title="Usługi"
                    items={mapTitles(company.services, "service")}
                    empty="Brak dodanych usług."
                  />

                  <SimpleList
                    title="Materiały"
                    items={mapTitles(company.materials, "material")}
                    empty="Brak dodanych materiałów."
                  />

                  <SimpleList
                    title="Metody"
                    items={mapTitles(company.welding_methods, "method")}
                    empty="Brak dodanych metod."
                  />
                </div>
              </section>

              <section>
                <SectionLabel>Galeria</SectionLabel>

                <h2 className="mt-2 text-xl font-semibold text-white">
                  Realizacje
                </h2>

                <div className="mt-5">
                  {images && images.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {images.slice(0, 6).map((image: CompanyImage) => (
                        <div
                          key={image.id}
                          className="group overflow-hidden rounded-2xl border border-slate-800/80 bg-black"
                        >
                          <img
                            src={image.image_url}
                            alt={company.name}
                            className="h-56 w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700/80 bg-[#070b10]/50 p-8 text-gray-500">
                      Firma nie dodała jeszcze realizacji.
                    </div>
                  )}
                </div>
              </section>
          </div>
        </div>
      </article>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
      {children}
    </div>
  );
}

function GoogleRating({
  rating,
  reviewsCount,
  mapsUrl,
}: {
  rating?: number | string | null;
  reviewsCount?: number | null;
  mapsUrl?: string | null;
}) {
  if (!rating || !reviewsCount) return null;

  const content = (
    <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-[#070b10]/80 px-4 py-2.5 text-sm">
      <span className="font-semibold text-orange-400">
        {Number(rating).toFixed(1)}
      </span>
      <span className="text-gray-300">
        Ocena Google
      </span>
      <span className="text-gray-500">
        ({reviewsCount} opinii)
      </span>
    </div>
  );

  if (!mapsUrl) return content;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex transition hover:opacity-85"
    >
      {content}
    </a>
  );
}

function SimpleList({
  title,
  items,
  empty,
}: {
  title: string;
  items?: string[] | null;
  empty: string;
}) {
  return (
    <div className="border-b border-slate-800/70 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <h3 className="text-sm font-semibold text-gray-200">
        {title}
      </h3>

      {items?.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="text-sm leading-6 text-gray-400">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">{empty}</p>
      )}
    </div>
  );
}

function mapTitles(
  items: string[] | null | undefined,
  type: "service" | "material" | "method"
) {
  if (!items?.length) return [];

  return items.map((item) => getTitle(item, type));
}

function getTitle(id: string, type: "service" | "material" | "method") {
  if (type === "service") {
    return SERVICES.find((service) => service.id === id)?.title || id;
  }

  if (type === "material") {
    return MATERIALS.find((material) => material.id === id)?.title || id;
  }

  return METHODS.find((method) => method.id === id)?.title || id;
}
