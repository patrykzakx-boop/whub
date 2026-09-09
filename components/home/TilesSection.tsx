import { User, Building2, TriangleAlert } from "lucide-react";
import Link from "next/link";

export default function TilesSection() {
  return (
<section className="bg-[#05070a] pb-8">
           <div className="mx-auto max-w-screen-2xl px-4">

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">

          {/* KLIENT */}
          <div className="flex min-h-[190px] flex-col justify-between rounded-3xl border border-orange-500/30 bg-[#0d1218] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-orange-500">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10">
                <User className="h-6 w-6 text-orange-500" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white">
                  Standardowe zlecenie
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Bramy, schody, balustrady i naprawy.
                </p>
              </div>
            </div>
<Link
  href="/add-request"
  className="mt-6 block w-full rounded-xl bg-orange-500 py-3 text-center text-sm font-medium text-white transition hover:bg-orange-600"
>
  Dodaj zlecenie
</Link>
          </div>

          {/* WYKONAWCA */}
          <div className="flex min-h-[190px] flex-col justify-between rounded-3xl border border-slate-700 bg-[#0d1218] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-slate-500">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-600 bg-slate-800">
                <Building2 className="h-6 w-6 text-slate-300" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-white">
                  Wykonawca
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Zdobywaj nowych klientów.
                </p>
              </div>
            </div>

            <Link
              href="/add-company"
              className="mt-6 block w-full rounded-xl border border-slate-600 py-3 text-center text-sm font-medium text-white transition hover:border-orange-500"
            >
              Dołącz
            </Link>
          </div>

          {/* AWARIA */}
          <div className="col-span-2 lg:col-span-1 flex min-h-[190px] flex-col justify-between rounded-3xl border border-red-500/30 bg-[#0d1218] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-red-500">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                <TriangleAlert className="h-6 w-6 text-red-400" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-red-400">
                  Nagła awaria
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Potrzebujesz pomocy jeszcze dzisiaj?
                </p>
              </div>
            </div>

            <Link
  href="/add-request?type=asap"
  className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white transition hover:bg-red-700 text-center"
>
  Zgłoś awarię
</Link>
          </div>

        </div>

      </div>
    </section>
  );
}
