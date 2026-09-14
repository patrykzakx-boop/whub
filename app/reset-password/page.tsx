"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updatePassword = async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Hasło musi mieć co najmniej 6 znaków.");
      setLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setErrorMessage("Hasła nie są takie same.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Hasło zostało zmienione. Możesz się zalogować.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8">
        <h1 className="text-3xl font-bold text-white">
          Ustaw nowe hasło
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-400">
          Wpisz nowe hasło dla swojego konta WeldHub.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="password"
            aria-label="Nowe hasło"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nowe hasło"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-orange-500"
          />

          <input
            type="password"
            aria-label="Powtórz nowe hasło"
            autoComplete="new-password"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            placeholder="Powtórz nowe hasło"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-orange-500"
          />

          {message && (
            <div role="status" aria-live="polite" className="rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-sm text-gray-300">
              {message}
            </div>
          )}

          {errorMessage && (
            <div role="alert" aria-live="assertive" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            onClick={updatePassword}
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Zapisywanie..." : "Zmień hasło"}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm text-gray-400 transition hover:text-white"
          >
            Przejdź do logowania
          </Link>
        </div>
      </div>
    </main>
  );
}
