import Image from "next/image";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#05070a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3">
        
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt="WeldHub Logo"
            width={52}
            height={52}
            priority
            className="rounded-md"
          />

          <div className="text-2xl font-bold tracking-tight text-white">
            Weld<span className="text-orange-500">Hub</span>
          </div>
        </div>

        {/* MENU */}
        <nav className="hidden items-center gap-8 text-sm font-semibold text-gray-300 lg:flex">
          <a href="#" className="transition hover:text-white">
            Usługi
          </a>

          <a href="#" className="transition hover:text-white">
            Firmy
          </a>

          <a href="#" className="transition hover:text-white">
            Jak działa
          </a>

          <a href="#" className="transition hover:text-white">
            Dla wykonawców
          </a>
        </nav>

        {/* PRAWA STRONA */}
        <div className="flex items-center gap-4">
          <button className="text-sm font-semibold text-gray-300 transition hover:text-white">
            Zaloguj się
          </button>

          <button className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">
            Dodaj zlecenie
          </button>
        </div>
      </div>
    </header>
  );
}