"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Wpisz e-mail i hasło.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(getLoginErrorMessage(error.message));
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4">

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

        <h1 className="text-3xl font-bold text-white">
          Logowanie
        </h1>

        <div className="mt-6 space-y-4">

          <input
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="E-mail"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white"
          />

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Hasło"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white"
          />

          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>

          <Link
            href="/forgot-password"
            className="block text-center text-sm text-gray-400 transition hover:text-white"
          >
            Nie pamiętasz hasła?
          </Link>

        </div>

      </div>

    </main>
  );
}

function getLoginErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Nieprawidłowy e-mail lub hasło.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Adres e-mail nie został jeszcze potwierdzony.";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "Za dużo prób logowania. Spróbuj ponownie za chwilę.";
  }

  return "Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.";
}
