"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import CompanySidebar from "./CompanySidebar";

import CompanyInfoStep from "./steps/CompanyInfoStep";
import ServicesStep from "./steps/ServicesStep";
import MaterialsStep from "./steps/MaterialsStep";
import WeldingMethodsStep from "./steps/WeldingMethodsStep";
import ContactLocationStep from "./steps/ContactLocationStep";
import SummaryStep from "./steps/SummaryStep";

import { supabase } from "@/lib/supabaseClient";
import { getCompanyServiceTitle, normalizeCompanyServices } from "@/lib/companies";

export default function CompanyWizard() {
  const [currentStep, setCurrentStep] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [foundedYear, setFoundedYear] = useState("");

  const [services, setServices] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [placeId, setPlaceId] = useState("");

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [serviceArea, setServiceArea] = useState("regional");
  const [mobileService, setMobileService] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishedCompanyId, setPublishedCompanyId] = useState<string | number | null>(null);
  const publishingRef = useRef(false);

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const publishCompany = async () => {
    if (publishingRef.current) return;

    const normalizedServices = normalizeCompanyServices(services);

    if (!name.trim()) {
      setPublishError("Podaj nazwę firmy.");
      setCurrentStep(1);
      return;
    }

    if (normalizedServices.length === 0) {
      setPublishError("Wybierz co najmniej jedną konkretną usługę firmy.");
      setCurrentStep(2);
      return;
    }

    publishingRef.current = true;
    setPublishing(true);
    setPublishError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPublishError("Zaloguj się ponownie, aby dodać firmę.");
        return;
      }

      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          description,
          founded_year: foundedYear,
          phone,
          email,
          address,
          city,
          region,
          lat,
          lng,
          place_id: placeId,
          services: normalizedServices,
          materials,
          welding_methods: methods,
          service_area: serviceArea,
          mobile_service: mobileService,
          status: "published",
        })
        .select("id")
        .single();

      if (error) {
        setPublishError(
          error.code === "23505"
            ? "Firma o tej nazwie jest już przypisana do Twojego konta."
            : error.message
        );
        return;
      }

      setServices(normalizedServices);
      setPublishedCompanyId(company.id);
    } catch (err) {
      console.error(err);
      setPublishError("Wystąpił nieoczekiwany błąd podczas zapisywania firmy.");
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  };

  if (publishedCompanyId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <div
          className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8"
          role="status"
        >
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Firma została zapisana
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">
            Profil czeka na zatwierdzenie
          </h1>
          <p className="mt-4 text-gray-300">
            Firma „{name.trim()}” została dodana tylko raz. Po zatwierdzeniu
            przez administratora pojawi się w katalogu i będzie mogła odpowiadać
            na zlecenia.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800"
            >
              Przejdź do panelu
            </Link>
            <Link
              href={`/dashboard/company/${publishedCompanyId}/edit`}
              className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-gray-200 hover:border-orange-500"
            >
              Edytuj profil firmy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mb-6">
        <div className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-orange-400">
          Dodaj firmę
        </div>

        <h1 className="text-3xl font-bold text-white lg:text-4xl">
          Utwórz profil firmy spawalniczej
        </h1>

        <p className="mt-3 max-w-2xl text-gray-400">
          Uzupełnij dane firmy, zakres usług oraz lokalizację. Po zatwierdzeniu
          przez administratora profil pojawi się w katalogu WeldHub.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(420px,1fr)_320px] 2xl:grid-cols-[320px_minmax(520px,1fr)_360px]">
        <div className="min-w-0">
          <div className="md:sticky md:top-6">
            <CompanySidebar currentStep={currentStep} />
          </div>
        </div>

        <div className="min-w-0">
          {currentStep === 1 && (
            <CompanyInfoStep
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              foundedYear={foundedYear}
              setFoundedYear={setFoundedYear}
            />
          )}

          {currentStep === 2 && (
            <ServicesStep services={services} setServices={setServices} />
          )}

          {currentStep === 3 && (
            <MaterialsStep materials={materials} setMaterials={setMaterials} />
          )}

          {currentStep === 4 && (
            <WeldingMethodsStep methods={methods} setMethods={setMethods} />
          )}

          {currentStep === 5 && (
            <ContactLocationStep
              phone={phone}
              setPhone={setPhone}
              email={email}
              setEmail={setEmail}
              address={address}
              setAddress={setAddress}
              city={city}
              setCity={setCity}
              region={region}
              setRegion={setRegion}
              placeId={placeId}
              setPlaceId={setPlaceId}
              lat={lat}
              setLat={setLat}
              lng={lng}
              setLng={setLng}
              serviceArea={serviceArea}
              setServiceArea={setServiceArea}
              mobileService={mobileService}
              setMobileService={setMobileService}
            />
          )}

          {currentStep === 6 && (
            <SummaryStep
              name={name}
              description={description}
              foundedYear={foundedYear}
              services={services}
              materials={materials}
              methods={methods}
              phone={phone}
              email={email}
              address={address}
              serviceArea={serviceArea}
              mobileService={mobileService}
              onPublish={publishCompany}
              publishing={publishing}
              errorMessage={publishError}
            />
          )}

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="rounded-xl border border-slate-700 px-6 py-3 text-white disabled:opacity-40"
            >
              Wstecz
            </button>

            {currentStep < 6 && (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-xl bg-orange-700 px-6 py-3 text-white hover:bg-orange-800"
              >
                Dalej
              </button>
            )}
          </div>
        </div>

        <div className="hidden min-w-0 xl:block">
          <div className="sticky top-6">
            <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-6">
              <h2 className="mb-5 text-xl font-semibold text-white">
                Podgląd profilu
              </h2>

              <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-[#05070a] text-gray-400">
                Logo
              </div>

              <h3 className="text-xl font-semibold text-white">
                {name || "Nazwa firmy"}
              </h3>

              <p className="mt-3 text-sm text-gray-400">
                {description || "Opis firmy pojawi się tutaj"}
              </p>

              {(city || region) && (
                <div className="mt-5 text-sm text-gray-400">
                  {[city, region].filter(Boolean).join(", ")}
                </div>
              )}

              <div className="mt-6 border-t border-slate-800 pt-6">
                <div className="mb-2 text-sm text-gray-400">
                  Rok założenia
                </div>

                <div className="text-white">{foundedYear || "-"}</div>
              </div>

              {services.length > 0 && (
                <div className="mt-6 border-t border-slate-800 pt-6">
                  <div className="mb-3 text-sm text-gray-400">Usługi</div>

                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <span
                        key={service}
                        className="rounded-full bg-slate-800 px-3 py-1 text-xs text-white"
                      >
                        {getCompanyServiceTitle(service)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
