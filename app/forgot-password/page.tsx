"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import TurnstileWidget from "@/components/security/TurnstileWidget";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const sendResetLink = async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Podaj adres e-mail.");
      setLoading(false);
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Potwierdź, że nie jesteś robotem.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(result?.error || "Nie udało się wysłać linku.");
        return;
      }

      setMessage(
        result?.message ||
          "Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła."
      );
    } catch {
      setErrorMessage("Nie udało się połączyć z serwerem. Spróbuj ponownie.");
    } finally {
      setCaptchaResetKey((current) => current + 1);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMessage("");
    setErrorMessage("");
    setCaptchaToken("");
    setCaptchaResetKey((current) => current + 1);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
        <h1 className="text-3xl font-bold text-white">
          Reset hasła
        </h1>

        {message ? (
          <div role="status" aria-live="polite" className="mt-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              <MailCheck aria-hidden="true" size={32} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">Sprawdź swoją skrzynkę</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Prośba została przyjęta. Jeśli konto <span className="font-medium text-gray-200">{email.trim()}</span> istnieje,
              wysłaliśmy na nie link do ustawienia nowego hasła.
            </p>
            <p className="mt-2 text-xs text-gray-400">Link może dotrzeć w ciągu kilku minut. Sprawdź również folder spam.</p>

            <div className="mt-6 space-y-3">
              <Link
                href="/login"
                className="block w-full rounded-xl bg-orange-700 px-5 py-3 font-semibold text-white transition hover:bg-orange-800"
              >
                Wróć do logowania
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl border border-slate-700 px-5 py-3 text-sm text-gray-300 transition hover:border-slate-500 hover:text-white"
              >
                Wyślij link ponownie
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Podaj e-mail konta. Wyślemy link, który pozwoli ustawić nowe hasło.
            </p>

            <div className="mt-6 space-y-4">
              <input
                type="email"
                aria-label="Adres e-mail"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mail"
                className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white outline-none placeholder:text-gray-400 focus:border-orange-500"
              />

              {errorMessage && (
                <div role="alert" aria-live="assertive" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}

              <TurnstileWidget
                action="password_reset"
                onTokenChange={setCaptchaToken}
                resetKey={captchaResetKey}
              />

              <button
                onClick={sendResetLink}
                disabled={loading || !captchaToken}
                className="w-full rounded-xl bg-orange-700 px-5 py-3 font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
              </button>

              <Link
                href="/login"
                className="block text-center text-sm text-gray-400 transition hover:text-white"
              >
                Wróć do logowania
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
