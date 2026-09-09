"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Konto utworzone. Sprawdź e-mail.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4">

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1218] p-8">

        <h1 className="text-3xl font-bold text-white">
          Rejestracja
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

          <button
            onClick={handleRegister}
            className="w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            Utwórz konto
          </button>

        </div>

      </div>

    </main>
  );
}