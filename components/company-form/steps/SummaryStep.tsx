type Props = {
  name: string;
  description: string;
  foundedYear: string;

  services: string[];
  materials: string[];
  methods: string[];

  phone: string;
  email: string;
  address: string;

  serviceArea: string;
  mobileService: boolean;
  onPublish: () => void;
};

export default function SummaryStep({
  name,
  description,
  foundedYear,

  services,
  materials,
  methods,

  phone,
  email,
  address,

  serviceArea,
  mobileService,
  onPublish
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <h2 className="mb-2 text-2xl font-semibold text-white">
        Podsumowanie
      </h2>

      <p className="mb-8 text-gray-400">
        Sprawdź dane przed publikacją profilu firmy.
      </p>

      {/* Dane firmy */}

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Dane firmy
        </h3>

        <div className="space-y-2 text-gray-300">
          <div>
            <span className="font-medium text-white">
              Nazwa:
            </span>{" "}
            {name}
          </div>

          <div>
            <span className="font-medium text-white">
              Rok założenia:
            </span>{" "}
            {foundedYear}
          </div>

          <div>
            <span className="font-medium text-white">
              Opis:
            </span>
          </div>

          <p className="rounded-xl border border-slate-800 bg-[#05070a] p-4 text-gray-300">
            {description}
          </p>
        </div>
      </div>

      {/* Usługi */}

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Usługi
        </h3>

        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <span
              key={service}
              className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm text-orange-300"
            >
              {service}
            </span>
          ))}
        </div>
      </div>

      {/* Materiały */}

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Materiały
        </h3>

        <div className="flex flex-wrap gap-2">
          {materials.map((material) => (
            <span
              key={material}
              className="rounded-full border border-slate-700 px-3 py-1 text-sm text-gray-300"
            >
              {material}
            </span>
          ))}
        </div>
      </div>

      {/* Metody */}

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Metody spawania
        </h3>

        <div className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <span
              key={method}
              className="rounded-full border border-slate-700 px-3 py-1 text-sm text-gray-300"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* Kontakt */}

      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-white">
          Kontakt
        </h3>

        <div className="space-y-2 text-gray-300">
          <div>📞 {phone}</div>
          <div>✉️ {email}</div>
          <div>📍 {address}</div>
        </div>
      </div>

      {/* Obszar działania */}

      <div>
        <h3 className="mb-3 text-lg font-semibold text-white">
          Obszar działania
        </h3>

        <div className="space-y-2 text-gray-300">
          <div>{serviceArea}</div>

          <div>
            {mobileService
              ? "✅ Usługi mobilne"
              : "❌ Prace wyłącznie w zakładzie"}
          </div>
        </div>
      </div>
<div className="mt-10 border-t border-slate-800 pt-6">
  <button
    type="button"
    onClick={onPublish}
    className="w-full rounded-xl bg-orange-500 px-6 py-4 font-semibold text-white transition hover:bg-orange-600"
  >
    Opublikuj firmę
  </button>
</div>
    </div>
  );
}