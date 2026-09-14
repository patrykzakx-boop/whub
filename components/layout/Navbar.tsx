"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setEmail(user?.email || null);
      } catch (error) {
        console.error("Nie udało się pobrać użytkownika:", error);
        setEmail(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user?.email || null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAccountMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#05070a]/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="hidden rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-white/[0.04] hover:text-white lg:inline-flex"
        >
          Powrót
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/images/logo.jpg"
            alt="WeldHub Logo"
            width={42}
            height={42}
            priority
            className="h-10 w-10 rounded-xl object-cover ring-1 ring-slate-800"
          />

          <div className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Weld<span className="text-orange-500">Hub</span>
          </div>
        </Link>

        <nav className="ml-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 text-sm text-gray-400 sm:ml-4">
          <NavLink href="/" label="Strona główna" active={isActive("/")} />
          <NavLink href="/companies" label="Firmy" active={isActive("/companies")} />
          <NavLink href="/requests" label="Zlecenia" active={isActive("/requests") || isActive("/request")} />
          <NavLink href="/add-request" label="Dodaj zlecenie" active={isActive("/add-request")} accent />
        </nav>

        <div className="relative ml-auto flex shrink-0 items-center gap-2">
          {!loading && email ? (
            <>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
                className="hidden max-w-[180px] truncate rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-[#0d1218] hover:text-white md:block"
                title={email}
              >
                {email}
              </button>

              <button
                type="button"
                onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
                className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 md:hidden"
              >
                Konto
              </button>

              <Link
                href="/dashboard"
                className="hidden rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:border-orange-500 md:inline-flex"
              >
                Panel
              </Link>

              {accountMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1218] shadow-2xl shadow-black/40">
                  <div className="border-b border-slate-800 px-4 py-3 text-xs text-gray-500">
                    <div className="mb-1 text-gray-400">Zalogowano jako</div>
                    <div className="truncate text-gray-200">{email}</div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setAccountMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-300 transition hover:bg-[#070b10] hover:text-white"
                  >
                    Panel klienta
                  </Link>

                  <Link
                    href="/dashboard/account"
                    onClick={() => setAccountMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-gray-300 transition hover:bg-[#070b10] hover:text-white"
                  >
                    Konto i hasło
                  </Link>

                  <button
                    type="button"
                    onClick={logout}
                    className="block w-full px-4 py-3 text-left text-sm text-gray-300 transition hover:bg-[#070b10] hover:text-white"
                  >
                    Wyloguj
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-[#0d1218] hover:text-white"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="hidden rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 sm:inline-flex"
              >
                Rejestracja
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  active,
  accent = false,
}: {
  href: string;
  label: string;
  active: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "shrink-0 rounded-lg bg-white/[0.06] px-3 py-2 font-medium text-white"
          : accent
            ? "shrink-0 rounded-lg px-3 py-2 font-medium text-orange-400 transition hover:bg-white/[0.04] hover:text-orange-300"
            : "shrink-0 rounded-lg px-3 py-2 transition hover:bg-white/[0.04] hover:text-white"
      }
    >
      {label}
    </Link>
  );
}
