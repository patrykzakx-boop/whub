"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { REPORT_REASONS, type ReportTargetType } from "@/lib/moderation";
import { supabase } from "@/lib/supabaseClient";

export default function ReportButton({ targetType, targetId }: { targetType: ReportTargetType; targetId: string | number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setWorking(true);
    setMessage("");
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) {
      setWorking(false);
      setMessage("Zaloguj się, aby wysłać zgłoszenie.");
      return;
    }

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { Authorization: "Bearer " + data.session.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się wysłać zgłoszenia.");
      setMessage("Dziękujemy. Zgłoszenie trafiło do moderatora.");
      setDetails("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udało się wysłać zgłoszenia.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mt-6">
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-red-300">
        <Flag size={15} /> Zgłoś nadużycie
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true" aria-label="Zgłoś nadużycie">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0d1218] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Zgłoś nadużycie</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Zamknij" className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white"><X size={18} /></button>
            </div>
            <p className="mt-2 text-sm text-gray-400">Zgłoszenie zobaczy wyłącznie administrator WeldHub.</p>
            <label className="mt-5 block text-sm text-gray-300">Powód
              <select value={reason} onChange={(event) => setReason(event.target.value as typeof reason)} className="mt-2 w-full rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white">
                {REPORT_REASONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm text-gray-300">Dodatkowy opis (opcjonalnie)
              <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} rows={4} className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-[#05070a] px-4 py-3 text-white" />
            </label>
            {message && <p className="mt-4 text-sm text-orange-300">{message}</p>}
            <button type="button" disabled={working} onClick={() => void submit()} className="mt-5 w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
              {working ? "Wysyłanie…" : "Wyślij zgłoszenie"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
