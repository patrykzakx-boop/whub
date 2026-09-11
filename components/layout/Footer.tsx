import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#05070a]">
      <div className="mx-auto max-w-screen-2xl px-4 py-10">

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">

          <div className="max-w-md">
            <h3 className="text-2xl font-bold text-white">
              WeldHub
            </h3>

            <p className="mt-4 text-sm leading-6 text-gray-400">
              Portal łączący klientów z wykonawcami usług
              spawalniczych i ślusarskich w całej Polsce.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
                Kontakt
              </h4>

              <ul className="space-y-3 text-sm text-gray-400">
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="transition hover:text-white"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li>Polska</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
                Informacje
              </h4>

              <Link
                href="/regulamin"
                className="text-sm text-gray-400 transition hover:text-white"
              >
                Regulamin
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-sm text-gray-500">
          © 2026 WeldHub. Wszelkie prawa zastrzeżone.
        </div>

      </div>
    </footer>
  );
}
