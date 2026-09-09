"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { SERVICES } from "@/components/company-form/constants/services";
import { MATERIALS } from "@/components/company-form/constants/materials";
import { METHODS } from "@/components/company-form/constants/methods";

type CompanyForm = {
  name: string;
  logoUrl: string;
  description: string;
  foundedYear: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  region: string;
  serviceArea: string;
  mobileService: boolean;
  status: string;
  googlePlaceId: string;
  googleRating: string;
  googleReviewsCount: string;
  googleMapsUrl: string;
  services: string[];
  materials: string[];
  methods: string[];
};

type GoogleBusinessData = {
  name: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  website: string;
  placeId: string;
  rating: number | null;
  reviewsCount: number | null;
  mapsUrl: string;
};

type GoogleAddressComponent = {
  types?: string[];
  longText?: string;
};

type GoogleBusinessPlace = {
  id?: string;
  displayName?: string | { text?: string };
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsURI?: string;
  googleMapsUri?: string;
  websiteURI?: string;
  websiteUri?: string;
  fetchFields: (options: { fields: string[] }) => Promise<void>;
};

type GooglePlaceSelectEvent = Event & {
  placePrediction?: {
    toPlace?: () => GoogleBusinessPlace | null;
  };
};

type GooglePlacesLibrary = {
  PlaceAutocompleteElement: new () => HTMLElement;
};

type GoogleMapsNamespace = {
  maps?: {
    importLibrary?: (name: "places") => Promise<GooglePlacesLibrary>;
  };
};


const emptyForm: CompanyForm = {
  name: "",
  logoUrl: "",
  description: "",
  foundedYear: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  region: "",
  serviceArea: "regional",
  mobileService: true,
  status: "published",
  googlePlaceId: "",
  googleRating: "",
  googleReviewsCount: "",
  googleMapsUrl: "",
  services: [],
  materials: [],
  methods: [],
};

export default function EditCompanyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadCompany = async () => {
      const id = params?.id;

      if (!id) {
        setErrorMessage("Brak identyfikatora firmy.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      const { data: company, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .single();

      if (error || !company) {
        console.error(error);
        setErrorMessage("Nie znaleziono firmy albo nie masz dostępu do edycji.");
        setLoading(false);
        return;
      }

      setCompanyId(id);
      setForm({
        name: company.name || "",
        logoUrl: company.logo_url || "",
        description: company.description || "",
        foundedYear: company.founded_year || "",
        phone: company.phone || "",
        email: company.email || "",
        website: company.website || "",
        address: company.address || "",
        city: company.city || "",
        region: company.region || "",
        serviceArea: company.service_area || "regional",
        mobileService: Boolean(company.mobile_service),
        status: company.status || "published",
        googlePlaceId: company.google_place_id || company.place_id || "",
        googleRating: company.google_rating?.toString() || "",
        googleReviewsCount: company.google_reviews_count?.toString() || "",
        googleMapsUrl: company.google_maps_url || "",
        services: company.services || [],
        materials: company.materials || [],
        methods: company.welding_methods || [],
      });
      setLogoPreview(company.logo_url || "");
      setLoading(false);
    };

    loadCompany();
  }, [params?.id]);

  const updateField = <K extends keyof CompanyForm>(
    key: K,
    value: CompanyForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const toggleArrayValue = (
    key: "services" | "materials" | "methods",
    value: string
  ) => {
    setForm((current) => {
      const values = current[key];
      const nextValues = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];

      return {
        ...current,
        [key]: nextValues,
      };
    });
  };

  const handleGoogleBusinessSelect = (data: GoogleBusinessData) => {
    setForm((current) => ({
      ...current,
      name: data.name || current.name,
      address: data.address || current.address,
      city: data.city || current.city,
      region: data.region || current.region,
      phone: data.phone || current.phone,
      website: data.website || current.website,
      googlePlaceId: data.placeId || current.googlePlaceId,
      googleRating:
        typeof data.rating === "number"
          ? data.rating.toFixed(1)
          : current.googleRating,
      googleReviewsCount:
        typeof data.reviewsCount === "number"
          ? String(data.reviewsCount)
          : current.googleReviewsCount,
      googleMapsUrl: data.mapsUrl || current.googleMapsUrl,
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    setLogoFile(file);

    if (!file) {
      setLogoPreview(form.logoUrl);
      return;
    }

    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async () => {
    if (!logoFile || !companyId) return form.logoUrl;

    const fileExt = logoFile.name.split(".").pop() || "jpg";
    const filePath = `${companyId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, logoFile, {
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("logos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveCompany = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    let logoUrl = form.logoUrl;

    try {
      logoUrl = await uploadLogo();
    } catch (error) {
      setSaving(false);
      setErrorMessage(
        error instanceof Error ? error.message : "Nie udało się wgrać logo."
      );
      return;
    }

    const { error } = await supabase
      .from("companies")
      .update({
        name: form.name,
        logo_url: logoUrl,
        description: form.description,
        founded_year: form.foundedYear,
        phone: form.phone,
        email: form.email,
        website: form.website,
        address: form.address,
        city: form.city,
        region: form.region,
        services: form.services,
        materials: form.materials,
        welding_methods: form.methods,
        service_area: form.serviceArea,
        mobile_service: form.mobileService,
        status: form.status,
        place_id: form.googlePlaceId || null,
        google_place_id: form.googlePlaceId || null,
        google_rating: form.googleRating ? Number(form.googleRating) : null,
        google_reviews_count: form.googleReviewsCount
          ? Number(form.googleReviewsCount)
          : null,
        google_maps_url: form.googleMapsUrl || null,
      })
      .eq("id", companyId)
      .eq("owner_id", user.id);

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    updateField("logoUrl", logoUrl);
    setLogoFile(null);
    setLogoPreview(logoUrl);
    router.push("/dashboard#companies");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] text-white">
        Ładowanie edycji firmy...
      </main>
    );
  }

  if (errorMessage && !companyId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4 text-white">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8 text-center">
          <h1 className="text-2xl font-semibold">Nie można edytować firmy</h1>
          <p className="mt-3 text-gray-400">{errorMessage}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Wróć do panelu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-5 text-white lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 border-b border-slate-800/80 pb-4">
          <Link
            href="/dashboard#companies"
            className="mb-4 inline-flex text-sm text-gray-500 transition hover:text-white"
          >
            ← Powrót do firm
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
              Edycja firmy
            </div>

            <h1 className="mt-1.5 text-2xl font-semibold text-white">
              {form.name || "Firma"}
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm text-gray-500">
              Zmień dane profilu, zakres prac, materiały, metody spawania i
              informacje kontaktowe.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/company/${companyId}`}
              className="rounded-xl px-4 py-2.5 text-sm text-gray-400 transition hover:bg-[#0d1218] hover:text-white"
            >
              Profil
            </Link>

            <Link
              href={`/dashboard/company/${companyId}/gallery`}
              className="rounded-xl px-4 py-2.5 text-sm text-gray-400 transition hover:bg-[#0d1218] hover:text-white"
            >
              Galeria
            </Link>
          </div>
          </div>
        </div>

        <form onSubmit={saveCompany} className="space-y-4">
          {errorMessage && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
            <SectionTitle title="Dane firmy" />

            <div className="mt-4 grid gap-5 md:grid-cols-[150px_1fr]">
              <div>
                <span className="mb-2 block text-sm text-gray-500">Logo firmy</span>

                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-[#05070a]">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt={form.name || "Logo firmy"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-gray-500">Logo</span>
                  )}
                </div>

                <label className="mt-3 inline-flex cursor-pointer rounded-lg border border-slate-800 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-slate-600 hover:text-white">
                  Zmień logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Nazwa firmy"
                value={form.name}
                onChange={(value) => updateField("name", value)}
                required
              />

              <TextField
                label="Rok założenia"
                value={form.foundedYear}
                onChange={(value) => updateField("foundedYear", value)}
                placeholder="2015"
              />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Opis firmy"
                    value={form.description}
                    onChange={(value) => updateField("description", value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
            <SectionTitle title="Kontakt i lokalizacja" />

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextField
                label="Telefon"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
                placeholder="+48 600 123 456"
              />

              <TextField
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                placeholder="biuro@firma.pl"
              />

              <div className="md:col-span-2">
                <TextField
                  label="Strona WWW"
                  value={form.website}
                  onChange={(value) => updateField("website", value)}
                  placeholder="https://firma.pl"
                />
              </div>

              <div className="md:col-span-2">
                <TextField
                  label="Adres"
                  value={form.address}
                  onChange={(value) => updateField("address", value)}
                />
              </div>

              <TextField
                label="Miasto"
                value={form.city}
                onChange={(value) => updateField("city", value)}
              />

              <TextField
                label="Województwo"
                value={form.region}
                onChange={(value) => updateField("region", value)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
            <SectionTitle title="Zakres prac" />

            <OptionGrid
              items={SERVICES}
              selected={form.services}
              onToggle={(id) => toggleArrayValue("services", id)}
            />
          </section>

          <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
            <SectionTitle title="Materiały" />

            <OptionGrid
              items={MATERIALS}
              selected={form.materials}
              onToggle={(id) => toggleArrayValue("materials", id)}
            />
          </section>

          <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
            <SectionTitle title="Metody spawania" />

            <OptionGrid
              items={METHODS}
              selected={form.methods}
              onToggle={(id) => toggleArrayValue("methods", id)}
            />
          </section>

          <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
            <SectionTitle title="Publikacja i obszar działania" />

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SelectField
                label="Obszar działania"
                value={form.serviceArea}
                onChange={(value) => updateField("serviceArea", value)}
                options={[
                  { value: "lokalnie", label: "Lokalnie" },
                  { value: "Obszar województwa", label: "Regionalnie" },
                  { value: "Cała Polska", label: "Cała Polska" },
                  { value: "Europa", label: "Europa" },
                ]}
              />

              <SelectField
                label="Status"
                value={form.status}
                onChange={(value) => updateField("status", value)}
                options={[
                  { value: "published", label: "Opublikowany" },
                  { value: "draft", label: "Roboczy" },
                ]}
              />

              <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#070b10] p-3 text-sm text-gray-300 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.mobileService}
                  onChange={(event) =>
                    updateField("mobileService", event.target.checked)
                  }
                  className="h-4 w-4 accent-orange-500"
                />
                Firma oferuje usługi z dojazdem do klienta
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800/90 bg-[#0d1218] p-4 lg:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionTitle title="Wizytówka Google" />
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Wyszukaj firmę w Google i wybierz właściwą wizytówkę. Adres,
                  telefon, ocena, liczba opinii i link do Map uzupełnią się
                  automatycznie.
                </p>
              </div>

              {form.googleRating && form.googleReviewsCount && (
                <div className="rounded-xl border border-slate-800 bg-[#070b10] px-4 py-3 text-sm">
                  <span className="font-semibold text-white">
                    {form.googleRating}
                  </span>
                  <span className="ml-1 text-gray-500">
                    / 5 z {form.googleReviewsCount} opinii
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <GoogleBusinessInput
                value={form.googlePlaceId}
                onSelect={handleGoogleBusinessSelect}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {form.googlePlaceId && (
                <div className="md:col-span-2 rounded-xl border border-slate-800 bg-[#070b10] p-3 text-sm text-gray-400">
                  <span className="text-gray-500">Połączono z Google: </span>
                  <span className="break-all text-gray-300">
                    {form.googlePlaceId}
                  </span>
                </div>
              )}

              <TextField
                label="Ocena Google"
                type="number"
                value={form.googleRating}
                onChange={(value) => updateField("googleRating", value)}
                placeholder="4.8"
              />

              <TextField
                label="Liczba opinii"
                type="number"
                value={form.googleReviewsCount}
                onChange={(value) => updateField("googleReviewsCount", value)}
                placeholder="126"
              />

              <div className="md:col-span-2">
                <TextField
                  label="Link do Google Maps"
                  value={form.googleMapsUrl}
                  onChange={(value) => updateField("googleMapsUrl", value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t border-slate-800 bg-[#05070a]/95 px-4 py-4 backdrop-blur sm:flex-row sm:justify-end">
            <Link
              href="/dashboard#companies"
              className="rounded-lg border border-slate-800 px-5 py-2.5 text-center text-sm font-medium text-gray-300 transition hover:border-slate-600 hover:text-white"
            >
              Anuluj
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-base font-semibold text-white">{title}</h2>;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-800 bg-[#05070a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-slate-500"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-500">{label}</span>
      <textarea
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-800 bg-[#05070a] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-slate-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-800 bg-[#05070a] px-3 py-2.5 text-sm text-white outline-none focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function GoogleBusinessInput({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (data: GoogleBusinessData) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let autocompleteElement: HTMLElement | null = null;

    const initPlaces = async () => {
      if (cancelled) return;

      const google = (window as unknown as { google?: GoogleMapsNamespace }).google;

      if (!google?.maps?.importLibrary || !containerRef.current) {
        attempts += 1;

        if (attempts < 30) {
          setTimeout(initPlaces, 300);
        }

        return;
      }

      const { PlaceAutocompleteElement } =
        await google.maps.importLibrary("places");

      if (cancelled || !containerRef.current) return;

      const autocomplete = new PlaceAutocompleteElement();

      const handleSelect = async (event: Event) => {
        const selectEvent = event as GooglePlaceSelectEvent;
        const place = selectEvent.placePrediction?.toPlace?.();

        if (!place) return;

        await place.fetchFields({
          fields: [
            "id",
            "displayName",
            "formattedAddress",
            "addressComponents",
            "nationalPhoneNumber",
            "internationalPhoneNumber",
            "rating",
            "userRatingCount",
            "googleMapsURI",
            "websiteURI",
          ],
        });

        const components = place.addressComponents || [];
        const displayName =
          typeof place.displayName === "string"
            ? place.displayName
            : place.displayName?.text || "";

        onSelectRef.current({
          name: displayName,
          address: place.formattedAddress || "",
          city:
            getAddressPart(components, "locality") ||
            getAddressPart(components, "postal_town") ||
            getAddressPart(components, "administrative_area_level_3") ||
            getAddressPart(components, "administrative_area_level_2"),
          region: normalizePolishRegion(
            getAddressPart(components, "administrative_area_level_1")
          ),
          phone:
            place.nationalPhoneNumber ||
            place.internationalPhoneNumber ||
            "",
          website:
            place.websiteURI ||
            place.websiteUri ||
            "",
          placeId: place.id || "",
          rating:
            typeof place.rating === "number"
              ? place.rating
              : null,
          reviewsCount:
            typeof place.userRatingCount === "number"
              ? place.userRatingCount
              : null,
          mapsUrl:
            place.googleMapsURI ||
            place.googleMapsUri ||
            "",
        });
      };

      autocomplete.addEventListener("gmp-select", handleSelect);

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(autocomplete);

      autocompleteElement = autocomplete;
    };

    const scriptId = "google-maps-new";

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");

      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async&libraries=places&v=beta`;
      script.async = true;
      script.defer = true;

      document.head.appendChild(script);
    }

    initPlaces();

    return () => {
      cancelled = true;
      autocompleteElement?.remove();
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-slate-800 bg-[#05070a] p-2">
        <div ref={containerRef} />
      </div>

      <p className="text-xs leading-5 text-gray-500">
        Wpisz nazwę firmy i miasto, np. CZORA Sp. k. Opole, a potem wybierz
        właściwą wizytówkę z listy Google.
      </p>

      {value && (
        <p className="text-xs text-gray-600">
          Aktualny identyfikator Google: {value}
        </p>
      )}
    </div>
  );
}

function OptionGrid({
  items,
  selected,
  onToggle,
}: {
  items: Array<{ id: string; title: string; category?: string; code?: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const active = selected.includes(item.id);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
              active
                ? "border-orange-500/70 bg-orange-500/10 text-white"
                : "border-slate-800 bg-[#070b10] text-gray-400 hover:border-slate-600 hover:text-white"
            }`}
          >
            <div className="font-medium">{item.title}</div>
            {(item.category || item.code) && (
              <div className="mt-1 text-xs text-gray-500">
                {item.category || `Kod: ${item.code}`}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function getAddressPart(components: GoogleAddressComponent[], type: string) {
  return (
    components.find((component) =>
      component.types?.includes(type)
    )?.longText || ""
  );
}

function normalizePolishRegion(region: string) {
  const cleaned = region
    .trim()
    .toLowerCase()
    .replace(/^województwo\s+/i, "");

  const regions: Record<string, string> = {
    dolnośląskie: "dolnośląskie",
    "kujawsko-pomorskie": "kujawsko-pomorskie",
    lubelskie: "lubelskie",
    lubuskie: "lubuskie",
    łódzkie: "łódzkie",
    małopolskie: "małopolskie",
    mazowieckie: "mazowieckie",
    opolskie: "opolskie",
    podkarpackie: "podkarpackie",
    podlaskie: "podlaskie",
    pomorskie: "pomorskie",
    śląskie: "śląskie",
    świętokrzyskie: "świętokrzyskie",
    "warmińsko-mazurskie": "warmińsko-mazurskie",
    wielkopolskie: "wielkopolskie",
    zachodniopomorskie: "zachodniopomorskie",
  };

  return regions[cleaned] || cleaned;
}
