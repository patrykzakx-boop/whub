"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import TurnstileWidget from "@/components/security/TurnstileWidget";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.replace("/login");
        return;
      }

      setEmail(user.email || "");
      setCheckingSession(false);
    };

    void loadUser();
  }, []);

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (newPassword !== repeatPassword) {
      setErrorMessage("Nowe hasła nie są takie same.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage("Sesja wygasła. Zaloguj się ponownie.");
        return;
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword, captchaToken }),
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(result?.error || "Nie udało się zmienić hasła.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      setMessage(result?.message || "Hasło zostało zmienione.");
    } catch {
      setErrorMessage("Nie udało się połączyć z serwerem. Spróbuj ponownie.");
    } finally {
      setCaptchaResetKey((current) => current + 1);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl text-gray-400">
          Sprawdzanie sesji…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 transition hover:text-white"
          >
            ← Powrót do panelu
          </Link>

          <div className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-orange-400">
            Ustawienia konta
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Konto i hasło</h1>
          <p className="mt-2 text-sm text-gray-400">
            Zalogowano jako {email}. Po zmianie hasła pozostałe aktywne sesje
            zostaną wylogowane.
          </p>
        </div>

        <form
          onSubmit={changePassword}
          className="space-y-5 rounded-2xl border border-slate-800 bg-[#0d1218] p-5 sm:p-7"
        >
          <div>
            <label
              htmlFor="current-password"
              className="mb-2 block text-sm text-gray-300"
            >
              Bieżące hasło
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm text-gray-300"
            >
              Nowe hasło
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white outline-none focus:border-orange-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Minimum 8 znaków. Użyj unikalnego hasła, którego nie stosujesz w
              innych serwisach.
            </p>
          </div>

          <div>
            <label
              htmlFor="repeat-password"
              className="mb-2 block text-sm text-gray-300"
            >
              Powtórz nowe hasło
            </label>
            <input
              id="repeat-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={repeatPassword}
              onChange={(event) => setRepeatPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white outline-none focus:border-orange-500"
            />
          </div>

          {message && (
            <div role="status" aria-live="polite" className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {message}
            </div>
          )}

          {errorMessage && (
            <div role="alert" aria-live="assertive" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <TurnstileWidget
            action="change_password"
            onTokenChange={setCaptchaToken}
            resetKey={captchaResetKey}
          />

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Zmienianie hasła…" : "Zmień hasło"}
          </button>
        </form>
      </div>
    </main>
  );
}
