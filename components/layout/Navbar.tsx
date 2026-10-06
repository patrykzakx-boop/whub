"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setEmail(user?.email || null);
        const { data: sessionData } = await supabase.auth.getSession();
        setIsAdmin(await checkAdmin(sessionData.session?.access_token));
      } catch (error) {
        console.error("Nie udało się pobrać użytkownika:", error);
        setEmail(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setEmail(session?.user?.email || null);
        void checkAdmin(session?.access_token).then(setIsAdmin);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !mobileMenuRef.current?.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setIsAdmin(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#05070a]/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="hidden rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/[0.04] hover:text-white lg:inline-flex"
        >
          Powrót
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/images/logo.webp"
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

        <nav className="ml-4 hidden min-w-0 flex-1 gap-1 overflow-x-auto px-1 text-sm text-gray-400 md:flex">
          <NavLink href="/" label="Strona główna" active={isActive("/")} />
          <NavLink href="/companies" label="Firmy" active={isActive("/companies")} />
          <NavLink href="/requests" label="Zlecenia" active={isActive("/requests") || isActive("/request")} />
          <NavLink href="/add-request" label="Dodaj zlecenie" active={isActive("/add-request")} accent />
        </nav>

        <div ref={accountMenuRef} className="relative ml-auto hidden shrink-0 items-center gap-2 md:flex">
          {!loading && email ? (
            <>
              <button
                type="button"
                onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                className="max-w-[180px] truncate rounded-lg px-3 py-2 text-sm text-gray-300 transition hover:bg-[#0d1218] hover:text-white"
                title={email}
              >
                {email}
              </button>

              <Link
                href="/dashboard"
                className="inline-flex rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:border-orange-500"
              >
                Panel
              </Link>

              {accountMenuOpen && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-800 bg-[#0d1218] shadow-2xl shadow-black/40">
                  <div className="border-b border-slate-800 px-4 py-3 text-xs text-gray-400">
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

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setAccountMenuOpen(false)}
                      className="block border-t border-slate-800 px-4 py-3 text-sm font-medium text-orange-400 transition hover:bg-[#070b10] hover:text-orange-300"
                    >
                      Panel administratora
                    </Link>
                  )}

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
                className="hidden rounded-lg bg-orange-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-800 sm:inline-flex"
              >
                Rejestracja
              </Link>
            </>
          )}
        </div>

        <div ref={mobileMenuRef} className="relative ml-auto md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:border-orange-500 hover:bg-white/[0.04]"
          >
            <span>{mobileMenuOpen ? "Zamknij" : "Menu"}</span>
            <span aria-hidden="true" className="text-lg leading-none">
              {mobileMenuOpen ? "×" : "☰"}
            </span>
          </button>

          {mobileMenuOpen && (
            <div
              id="mobile-navigation"
              className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-800 bg-[#0d1218] shadow-2xl shadow-black/50"
            >
              {!loading && email && (
                <div className="border-b border-slate-800 px-4 py-3 text-xs text-gray-400">
                  <div className="mb-1">Zalogowano jako</div>
                  <div className="truncate text-gray-200">{email}</div>
                </div>
              )}

              <nav
                aria-label="Nawigacja mobilna"
                className="p-2"
                onClick={(event) => {
                  if (
                    event.target instanceof Element &&
                    event.target.closest("a")
                  ) {
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <MobileNavLink href="/" label="Strona główna" active={isActive("/")} />
                <MobileNavLink href="/companies" label="Firmy" active={isActive("/companies")} />
                <MobileNavLink
                  href="/requests"
                  label="Zlecenia"
                  active={isActive("/requests") || isActive("/request")}
                />
                <MobileNavLink
                  href="/add-request"
                  label="Dodaj zlecenie"
                  active={isActive("/add-request")}
                  accent
                />

                {!loading && email ? (
                  <>
                    <div className="my-2 border-t border-slate-800" />
                    <MobileNavLink href="/dashboard" label="Panel klienta" active={pathname === "/dashboard"} />
                    <MobileNavLink href="/dashboard/account" label="Konto i hasło" active={isActive("/dashboard/account")} />
                    {isAdmin && (
                      <MobileNavLink href="/admin" label="Panel administratora" active={isActive("/admin")} accent />
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="block w-full rounded-lg px-3 py-3 text-left text-sm text-gray-300 transition hover:bg-[#070b10] hover:text-white"
                    >
                      Wyloguj
                    </button>
                  </>
                ) : !loading ? (
                  <>
                    <div className="my-2 border-t border-slate-800" />
                    <MobileNavLink href="/login" label="Logowanie" active={isActive("/login")} />
                    <MobileNavLink href="/register" label="Rejestracja" active={isActive("/register")} accent />
                  </>
                ) : null}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

async function checkAdmin(accessToken?: string) {
  if (!accessToken) return false;
  try {
    const response = await fetch("/api/admin/me", {
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
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
      aria-current={active ? "page" : undefined}
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

function MobileNavLink({
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
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "block rounded-lg bg-white/[0.06] px-3 py-3 text-sm font-medium text-white"
          : accent
            ? "block rounded-lg px-3 py-3 text-sm font-medium text-orange-400 transition hover:bg-[#070b10] hover:text-orange-300"
            : "block rounded-lg px-3 py-3 text-sm text-gray-300 transition hover:bg-[#070b10] hover:text-white"
      }
    >
      {label}
    </Link>
  );
}
