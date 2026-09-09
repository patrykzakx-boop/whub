type Props = {
  name: string;
  setName: (value: string) => void;

  description: string;
  setDescription: (value: string) => void;

  foundedYear: string;
  setFoundedYear: (value: string) => void;
};

export default function CompanyInfoStep({
  name,
  setName,
  description,
  setDescription,
  foundedYear,
  setFoundedYear,
}: Props) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

      <h2 className="mb-6 text-2xl font-semibold text-white">
        Dane firmy
      </h2>

      <div className="space-y-6">

        <div>
          <label className="mb-2 block text-white">
            Nazwa firmy
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. StalTech Sp. z o.o."
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            Opis firmy
          </label>

          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            Rok założenia
          </label>

          <input
            value={foundedYear}
            onChange={(e) => setFoundedYear(e.target.value)}
            placeholder="2015"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] p-3 text-white"
          />
        </div>

      </div>

    </div>
  );
}