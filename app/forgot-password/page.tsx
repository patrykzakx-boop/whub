"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const sendResetLink = async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Podaj adres e-mail.");
      setLoading(false);
      return;
    }

    const redirectTo = window.location.origin + "/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
        <h1 className="text-3xl font-bold text-white">
          Reset hasła
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          Podaj e-mail konta. Wyślemy link, który pozwoli ustawić nowe hasło.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-mail"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-orange-500"
          />

          {message && (
            <div className="rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-sm text-gray-300">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            onClick={sendResetLink}
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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
      </div>
    </main>
  );
}
