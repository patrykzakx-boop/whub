"use client";

import { useState } from "react";
import TurnstileWidget from "@/components/security/TurnstileWidget";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const handleRegister = async () => {
    setMessage("");
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Wpisz e-mail i hasło.");
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Potwierdź, że nie jesteś robotem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaToken }),
      });
      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(result?.error || "Nie udało się utworzyć konta.");
        return;
      }

      setMessage(
        result?.message || "Konto utworzone. Sprawdź swoją skrzynkę e-mail."
      );
    } catch {
      setErrorMessage("Nie udało się połączyć z serwerem. Spróbuj ponownie.");
    } finally {
      setCaptchaResetKey((current) => current + 1);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4">

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

        <h1 className="text-3xl font-bold text-white">
          Rejestracja
        </h1>

        <div className="mt-6 space-y-4">

          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="E-mail"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white"
          />

          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Hasło"
            className="w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white"
          />

          {message && (
            <div className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {message}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <TurnstileWidget
            action="register"
            onTokenChange={setCaptchaToken}
            resetKey={captchaResetKey}
          />

          <button
            onClick={handleRegister}
            disabled={loading || !captchaToken}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Tworzenie konta…" : "Utwórz konto"}
          </button>

        </div>

      </div>

    </main>
  );
}
