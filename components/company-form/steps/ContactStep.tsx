type Props = {
  phone: string;
  setPhone: (value: string) => void;

  email: string;
  setEmail: (value: string) => void;

  website: string;
  setWebsite: (value: string) => void;

  city: string;
  setCity: (value: string) => void;

  region: string;
  setRegion: (value: string) => void;

  address: string;
  setAddress: (value: string) => void;

  serviceArea: string;
  setServiceArea: (value: string) => void;
};

export default function ContactStep({
  phone,
  setPhone,
  email,
  setEmail,
  website,
  setWebsite,
  city,
  setCity,
  region,
  setRegion,
  address,
  setAddress,
  serviceArea,
  setServiceArea,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <h2 className="mb-2 text-2xl font-semibold text-white">
        Kontakt i lokalizacja
      </h2>

      <p className="mb-6 text-gray-400">
        Jak klienci mogą znaleźć i skontaktować się z firmą?
      </p>

      <div className="grid gap-6 md:grid-cols-2">

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefon"
          className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
        />

        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Strona WWW"
          className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
        />

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Miasto"
          className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
        />

        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          placeholder="Województwo"
          className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
        />

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adres"
          className="rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
        />

      </div>

      <div className="mt-6">

        <select
          value={serviceArea}
          onChange={(e) =>
            setServiceArea(e.target.value)
          }
          className="w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
        >
          <option value="">
            Obszar działania
          </option>

          <option>
            Lokalnie (do 30 km)
          </option>

          <option>
            Województwo
          </option>

          <option>
            Kilka województw
          </option>

          <option>
            Cała Polska
          </option>

          <option>
            Polska + zagranica
          </option>

        </select>

      </div>

    </div>
  );
}