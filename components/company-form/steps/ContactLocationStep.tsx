import GoogleAddressInput from "../GoogleAddressInput";
import {
  Phone,
  Mail,
  Truck,
  Building2,
} from "lucide-react";

type Props = {
  phone: string;
  setPhone: (value: string) => void;

  email: string;
  setEmail: (value: string) => void;

  address: string;
  setAddress: (value: string) => void;

  city: string;
  setCity: (value: string) => void;

  region: string;
  setRegion: (value: string) => void;

  placeId: string;
  setPlaceId: (value: string) => void;

  lat: number | null;
  setLat: (value: number | null) => void;

  lng: number | null;
  setLng: (value: number | null) => void;

  serviceArea: string;
  setServiceArea: (value: string) => void;

  mobileService: boolean;
  setMobileService: (value: boolean) => void;
};

export default function ContactLocationStep({
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  city,
  setCity,
  region,
  setRegion,
  setPlaceId,
  lat,
  setLat,
  lng,
  setLng,
  serviceArea,
  setServiceArea,
  mobileService,
  setMobileService,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <div className="mb-8">

        <h2 className="mb-2 text-2xl font-semibold text-white">
          Kontakt i obszar działania
        </h2>

        <p className="text-gray-400">
          Określ gdzie działasz i jak klienci mogą się z Tobą skontaktować.
        </p>

      </div>

      <div className="mb-8">

        <h3 className="mb-4 text-lg font-semibold text-white">
          Dane kontaktowe
        </h3>

        <div className="grid gap-4 md:grid-cols-2">

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <Phone size={16} />
              Telefon
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="+48 600 123 456"
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white"
            />

          </div>

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm text-gray-400">
              <Mail size={16} />
              E-mail
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="biuro@firma.pl"
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white"
            />

          </div>

        </div>

      </div>

      <div className="mb-8">

        <h3 className="mb-4 text-lg font-semibold text-white">
          Adres głównej siedziby
        </h3>

        <GoogleAddressInput
          value={address}
          onSelect={(data) => {
            setAddress(data.address);
            setCity(data.city);
            setRegion(data.region);
            setLat(data.lat);
            setLng(data.lng);
            setPlaceId(data.place_id);
          }}
        />

        {(city || region) && (
          <div className="mt-3 text-sm text-gray-400">
            Lokalizacja: {[city, region].filter(Boolean).join(", ")}
          </div>
        )}

        {lat && lng && (
          <div className="mt-2 text-sm text-gray-400">
            GPS: {lat.toFixed(6)}, {lng.toFixed(6)}
          </div>
        )}

      </div>

      <div className="mb-8">

        <h3 className="mb-4 text-lg font-semibold text-white">
          Obszar działania
        </h3>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          {[
            {
              id: "lokalnie",
              title: "Lokalnie",
              subtitle: "do 25 km",
            },
            {
              id: "Obszar województwa",
              title: "Regionalnie",
              subtitle: "do 100 km",
            },
            {
              id: "Cała Polska",
              title: "Cała Polska",
              subtitle: "teren kraju",
            },
            {
              id: "Europa",
              title: "Europa",
              subtitle: "zagranica",
            },
          ].map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() =>
                setServiceArea(area.id)
              }
              className={`rounded-2xl border p-5 text-left transition ${
                serviceArea === area.id
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-slate-700 hover:border-orange-500"
              }`}
            >

              <div className="font-semibold text-white">
                {area.title}
              </div>

              <div className="mt-1 text-sm text-gray-400">
                {area.subtitle}
              </div>

            </button>
          ))}

        </div>

      </div>

      <div>

        <h3 className="mb-4 text-lg font-semibold text-white">
          Usługi mobilne
        </h3>

        <div className="grid gap-4 md:grid-cols-2">

          <button
            type="button"
            onClick={() =>
              setMobileService(true)
            }
            className={`rounded-2xl border p-5 text-left transition ${
              mobileService
                ? "border-orange-500 bg-orange-500/10"
                : "border-slate-700"
            }`}
          >

            <Truck
              size={22}
              className="mb-3 text-orange-400"
            />

            <div className="font-semibold text-white">
              Dojeżdżamy do klienta
            </div>

            <div className="mt-1 text-sm text-gray-400">
              Realizujemy usługi z dojazdem.
            </div>

          </button>

          <button
            type="button"
            onClick={() =>
              setMobileService(false)
            }
            className={`rounded-2xl border p-5 text-left transition ${
              !mobileService
                ? "border-orange-500 bg-orange-500/10"
                : "border-slate-700"
            }`}
          >

            <Building2
              size={22}
              className="mb-3 text-orange-400"
            />

            <div className="font-semibold text-white">
              Prace wyłącznie w zakładzie
            </div>

            <div className="mt-1 text-sm text-gray-400">
              Klient dostarcza elementy.
            </div>

          </button>

        </div>

      </div>

    </div>
  );
}