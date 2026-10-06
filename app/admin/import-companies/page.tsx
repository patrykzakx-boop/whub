"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, FileSpreadsheet, Pencil, RefreshCw, Save, Trash2, Upload, X } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";

type PreviewRow = {
  sourceRow: number;
  data: {
    name: string;
    nip: string | null;
    city: string;
    region: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    primaryProfile: string | null;
    services: string[];
    servicesRaw: string[];
    sourceUrl: string;
    sourceType: string | null;
  };
  errors: string[];
  warnings: string[];
  duplicateReason: string | null;
};

type PreviewData = {
  rows: PreviewRow[];
  ignoredHeaders: string[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
    warnings: number;
  };
};

type Lead = {
  id: number;
  name: string;
  nip: string | null;
  city: string;
  region: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  primary_profile: string | null;
  services: string[];
  services_raw: string[];
  source_url: string;
  source_type: string | null;
  notes: string | null;
  status: string;
  privacy_notice_sent_at: string | null;
  consent_at: string | null;
  linked_company_id: number | null;
  created_at: string;
};

type EditDraft = {
  name: string;
  nip: string;
  city: string;
  region: string;
  primaryProfile: string;
  servicesRaw: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  sourceUrl: string;
  sourceType: string;
  notes: string;
};

type Batch = {
  id: string;
  file_name: string;
  total_rows: number;
  imported_rows: number;
  duplicate_rows: number;
  invalid_rows: number;
  created_at: string;
};

const STATUS_OPTIONS = [
  ["new", "Nowa"],
  ["to_verify", "Do weryfikacji"],
  ["contacted", "Skontaktowana i poinformowana"],
  ["consent_received", "Zgoda otrzymana"],
  ["declined", "Odmowa"],
  ["archived", "Archiwalna"],
] as const;

export default function ImportCompaniesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [ownerEmails, setOwnerEmails] = useState<Record<number, string>>({});
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const authorizedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Zaloguj się jako administrator.");
    return fetch(url, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${token}` },
    });
  }, []);

  const loadLeads = useCallback(async () => {
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/company-import");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się pobrać importów.");
      setLeads(result.leads || []);
      setBatches(result.batches || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać danych.");
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadLeads(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadLeads]);

  const submitFile = async (mode: "preview" | "import") => {
    if (!file) {
      setError("Wybierz plik XLSX albo CSV.");
      return;
    }

    setWorking(mode);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.set("mode", mode);
      formData.set("file", file);
      formData.set("includeDuplicates", String(includeDuplicates));
      const response = await authorizedFetch("/api/admin/company-import", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Operacja nie powiodła się.");

      if (mode === "preview") {
        setPreview(result);
        setMessage("Plik został sprawdzony. Przejrzyj wynik przed importem.");
      } else {
        setMessage(`Zaimportowano ${result.imported} firm do prywatnej poczekalni.`);
        setPreview(null);
        setIncludeDuplicates(false);
        setFile(null);
        const input = document.getElementById("company-import-file") as HTMLInputElement | null;
        if (input) input.value = "";
        await loadLeads();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Operacja nie powiodła się.");
    } finally {
      setWorking("");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    setWorking(`status:${id}`);
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/company-import/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się zmienić statusu.");
      await loadLeads();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Nie udało się zmienić statusu.");
    } finally {
      setWorking("");
    }
  };

  const convertLead = async (leadId: number) => {
    setWorking(`convert:${leadId}`);
    setError("");
    setMessage("");
    try {
      const response = await authorizedFetch("/api/admin/company-import/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, ownerEmail: ownerEmails[leadId] || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się utworzyć profilu.");
      setMessage("Profil firmy został utworzony i czeka w zwykłej kolejce moderacji.");
      await loadLeads();
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : "Nie udało się utworzyć profilu.");
    } finally {
      setWorking("");
    }
  };

  const startEditing = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditDraft({
      name: lead.name,
      nip: lead.nip || "",
      city: lead.city,
      region: lead.region || "",
      primaryProfile: lead.primary_profile || "",
      servicesRaw: lead.services_raw.join("; "),
      address: lead.address || "",
      phone: lead.phone || "",
      email: lead.email || "",
      website: lead.website || "",
      sourceUrl: lead.source_url,
      sourceType: lead.source_type || "",
      notes: lead.notes || "",
    });
    setError("");
    setMessage("");
  };

  const saveLead = async () => {
    if (!editingLeadId || !editDraft) return;
    setWorking(`edit:${editingLeadId}`);
    setError("");
    setMessage("");
    try {
      const response = await authorizedFetch("/api/admin/company-import/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingLeadId, ...editDraft }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się zapisać firmy.");
      setEditingLeadId(null);
      setEditDraft(null);
      setMessage("Dane firmy zostały zapisane.");
      await loadLeads();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Nie udało się zapisać firmy.");
    } finally {
      setWorking("");
    }
  };

  const deleteLead = async (lead: Lead) => {
    const confirmed = window.confirm(
      `Usunąć firmę „${lead.name}” z poczekalni? Rekord będzie można ponownie zaimportować z arkusza.`
    );
    if (!confirmed) return;

    setWorking(`delete:${lead.id}`);
    setError("");
    setMessage("");
    try {
      const response = await authorizedFetch("/api/admin/company-import/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się usunąć firmy.");
      if (editingLeadId === lead.id) {
        setEditingLeadId(null);
        setEditDraft(null);
      }
      setMessage("Firma została usunięta z poczekalni.");
      await loadLeads();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Nie udało się usunąć firmy.");
    } finally {
      setWorking("");
    }
  };

  const downloadTemplate = async () => {
    setWorking("template");
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/company-import/template");
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "weldhub-import-firm.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Nie udało się pobrać szablonu.");
    } finally {
      setWorking("");
    }
  };

  const activeLeads = useMemo(
    () => leads.filter((lead) => lead.status !== "archived"),
    [leads]
  );
  const importCount = preview
    ? preview.summary.valid + (includeDuplicates ? preview.summary.duplicate : 0)
    : 0;

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
              <ArrowLeft size={16} /> Centrum moderacji
            </Link>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
              <FileSpreadsheet size={18} /> Katalog firm
            </div>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Import firm z Excela</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
              Plik trafia do prywatnej poczekalni. Firma pojawi się w katalogu dopiero po uzyskaniu zgody,
              założeniu konta właściciela i standardowej moderacji.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void downloadTemplate()} disabled={Boolean(working)} className="admin-secondary inline-flex items-center gap-2">
              <Download size={16} /> Pobierz szablon CSV
            </button>
            <button onClick={() => void loadLeads()} disabled={Boolean(working)} className="admin-secondary inline-flex items-center gap-2">
              <RefreshCw size={16} /> Odśwież
            </button>
          </div>
        </div>

        {error && <div role="alert" className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        {message && <div role="status" className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div>}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0d1218] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">1. Wybierz i sprawdź plik</h2>
          <p className="mt-2 text-sm text-gray-400">
            Obsługiwane formaty: XLSX i CSV. Plik z Numbers wyeksportuj jako Excel (.xlsx). Maksymalnie 2 MB oraz 500 firm w jednym pliku.
          </p>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              id="company-import-file"
              type="file"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setPreview(null);
                setIncludeDuplicates(false);
                setMessage("");
              }}
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#080b0f] px-4 py-3 text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-700 file:px-4 file:py-2 file:font-semibold file:text-white"
            />
            <button onClick={() => void submitFile("preview")} disabled={!file || Boolean(working)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-semibold hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50">
              <Upload size={16} /> {working === "preview" ? "Sprawdzanie…" : "Sprawdź plik"}
            </button>
          </div>
        </section>

        {preview && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1218]">
            <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">2. Podgląd importu</h2>
                <p className="mt-1 text-sm text-gray-400">Nowe: {preview.summary.valid} · Duplikaty: {preview.summary.duplicate} · Błędy: {preview.summary.invalid}</p>
                {preview.summary.duplicate > 0 && (
                  <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-amber-200">
                    <input
                      type="checkbox"
                      checked={includeDuplicates}
                      onChange={(event) => setIncludeDuplicates(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-orange-600"
                    />
                    <span>Dołącz także {preview.summary.duplicate} rekordów oznaczonych jako potencjalne duplikaty.</span>
                  </label>
                )}
              </div>
              <button onClick={() => void submitFile("import")} disabled={importCount === 0 || Boolean(working)} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
                {working === "import" ? "Importowanie…" : `Importuj ${importCount} firm`}
              </button>
            </div>
            {preview.ignoredHeaders.length > 0 && (
              <p className="border-b border-slate-800 px-5 py-3 text-xs text-amber-300">Pominięte kolumny: {preview.ignoredHeaders.join(", ")}</p>
            )}
            <div className="max-h-[34rem] overflow-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="sticky top-0 bg-[#080b0f] text-xs uppercase tracking-wide text-gray-400">
                  <tr><th className="px-4 py-3">Wiersz</th><th className="px-4 py-3">Firma</th><th className="px-4 py-3">Lokalizacja</th><th className="px-4 py-3">Kontakt</th><th className="px-4 py-3">Wynik</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {preview.rows.map((row) => (
                    <tr key={row.sourceRow} className="align-top">
                      <td className="px-4 py-4 text-gray-500">{row.sourceRow}</td>
                      <td className="px-4 py-4"><div className="font-medium">{row.data.name || "Brak nazwy"}</div><div className="mt-1 text-xs text-gray-500">{row.data.primaryProfile || (row.data.nip ? `NIP ${row.data.nip}` : "bez NIP")}</div></td>
                      <td className="px-4 py-4 text-gray-300">{[row.data.city, row.data.region].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-4 py-4 text-xs text-gray-400">{row.data.email || row.data.phone || row.data.website || "—"}</td>
                      <td className="px-4 py-4">
                        {row.errors.length > 0 ? <ResultText tone="error" text={row.errors.join(" ")} /> : row.duplicateReason ? <ResultText tone="warning" text={row.duplicateReason} /> : <ResultText tone="success" text="Gotowa do importu" />}
                        {row.warnings.length > 0 && <div className="mt-2 text-xs text-amber-300">{row.warnings.join(" ")}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1218]">
          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="text-lg font-semibold">Poczekalnia firm</h2>
            <p className="mt-1 text-xs text-gray-400">{loading ? "Pobieranie…" : `${activeLeads.length} aktywnych rekordów`}</p>
          </div>
          {!loading && activeLeads.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Nie zaimportowano jeszcze żadnych firm.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {activeLeads.map((lead) => (
                <article key={lead.id} className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-gray-400">#{lead.id}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{lead.city}{lead.region ? `, ${lead.region}` : ""} · {lead.email || lead.phone || "brak kontaktu"}</p>
                      {(lead.primary_profile || lead.source_type) && (
                        <p className="mt-1 text-xs text-gray-500">{[lead.primary_profile, lead.source_type].filter(Boolean).join(" · ")}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {lead.services_raw.slice(0, 5).map((service) => <span key={service} className="rounded-md bg-black/30 px-2 py-1">{service}</span>)}
                      </div>
                      <a href={lead.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-block break-all text-xs text-orange-400 hover:text-orange-300">Źródło danych</a>
                    </div>

                    {lead.status === "converted" ? (
                      <Link href={`/company/${lead.linked_company_id}`} className="admin-success">Otwórz utworzony profil</Link>
                    ) : (
                      <div className="w-full space-y-3 xl:w-[360px]">
                        <select value={lead.status} onChange={(event) => void updateStatus(lead.id, event.target.value)} disabled={Boolean(working)} className="w-full rounded-xl border border-slate-700 bg-[#080b0f] px-3 py-2.5 text-sm text-white">
                          {STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        {lead.status === "consent_received" && (
                          <div className="flex gap-2">
                            <input type="email" value={ownerEmails[lead.id] || ""} onChange={(event) => setOwnerEmails((current) => ({ ...current, [lead.id]: event.target.value }))} placeholder="E-mail konta firmy w WeldHub" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#080b0f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500" />
                            <button onClick={() => void convertLead(lead.id)} disabled={Boolean(working)} className="admin-success whitespace-nowrap">Utwórz profil</button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => startEditing(lead)} disabled={Boolean(working)} className="admin-secondary inline-flex flex-1 items-center justify-center gap-2">
                            <Pencil size={15} /> Edytuj
                          </button>
                          <button onClick={() => void deleteLead(lead)} disabled={Boolean(working)} className="admin-danger inline-flex flex-1 items-center justify-center gap-2">
                            <Trash2 size={15} /> Usuń
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {editingLeadId === lead.id && editDraft && (
                    <LeadEditForm
                      draft={editDraft}
                      disabled={Boolean(working)}
                      onChange={(field, value) => setEditDraft((current) => current ? { ...current, [field]: value } : current)}
                      onSave={() => void saveLead()}
                      onCancel={() => {
                        setEditingLeadId(null);
                        setEditDraft(null);
                      }}
                    />
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {batches.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1218]">
            <h2 className="border-b border-slate-800 px-5 py-4 text-lg font-semibold">Historia importów</h2>
            <div className="divide-y divide-slate-800">
              {batches.map((batch) => (
                <div key={batch.id} className="flex flex-col gap-2 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="font-medium">{batch.file_name}</div><div className="mt-1 text-xs text-gray-500">{new Date(batch.created_at).toLocaleString("pl-PL")}</div></div>
                  <div className="text-gray-400">Dodano {batch.imported_rows} · Duplikaty {batch.duplicate_rows} · Błędy {batch.invalid_rows}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ResultText({ tone, text }: { tone: "success" | "warning" | "error"; text: string }) {
  const className = tone === "success" ? "text-emerald-300" : tone === "warning" ? "text-amber-300" : "text-red-300";
  return <div className={`text-xs font-medium ${className}`}>{text}</div>;
}

const EDIT_INPUT_CLASS = "w-full rounded-xl border border-slate-700 bg-[#080b0f] px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-orange-500 focus:outline-none";

function LeadEditForm({
  draft,
  disabled,
  onChange,
  onSave,
  onCancel,
}: {
  draft: EditDraft;
  disabled: boolean;
  onChange: (field: keyof EditDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <form
      className="mt-5 rounded-2xl border border-orange-500/30 bg-black/20 p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="font-semibold">Edycja danych firmy</h4>
        <button type="button" onClick={onCancel} disabled={disabled} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white" aria-label="Zamknij edycję">
          <X size={18} />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <EditField label="Firma" required value={draft.name} onChange={(value) => onChange("name", value)} />
        <EditField label="NIP" value={draft.nip} onChange={(value) => onChange("nip", value)} />
        <EditField label="Miasto" required value={draft.city} onChange={(value) => onChange("city", value)} />
        <EditField label="Województwo" value={draft.region} onChange={(value) => onChange("region", value)} />
        <EditField label="Profil główny" value={draft.primaryProfile} onChange={(value) => onChange("primaryProfile", value)} />
        <EditField label="Telefon" value={draft.phone} onChange={(value) => onChange("phone", value)} />
        <EditField label="E-mail" type="email" value={draft.email} onChange={(value) => onChange("email", value)} />
        <EditField label="Strona WWW" type="url" value={draft.website} onChange={(value) => onChange("website", value)} />
        <EditField label="Rodzaj źródła" value={draft.sourceType} onChange={(value) => onChange("sourceType", value)} />
        <label className="text-sm text-gray-300 md:col-span-2 xl:col-span-3">
          Zakres usług
          <textarea value={draft.servicesRaw} onChange={(event) => onChange("servicesRaw", event.target.value)} rows={2} className={`${EDIT_INPUT_CLASS} mt-1.5 resize-y`} />
        </label>
        <label className="text-sm text-gray-300 md:col-span-2 xl:col-span-3">
          Adres
          <input value={draft.address} onChange={(event) => onChange("address", event.target.value)} className={`${EDIT_INPUT_CLASS} mt-1.5`} />
        </label>
        <label className="text-sm text-gray-300 md:col-span-2 xl:col-span-3">
          Źródło danych
          <input type="url" value={draft.sourceUrl} onChange={(event) => onChange("sourceUrl", event.target.value)} className={`${EDIT_INPUT_CLASS} mt-1.5`} />
        </label>
        <label className="text-sm text-gray-300 md:col-span-2 xl:col-span-3">
          Uwagi
          <textarea value={draft.notes} onChange={(event) => onChange("notes", event.target.value)} rows={3} className={`${EDIT_INPUT_CLASS} mt-1.5 resize-y`} />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={disabled} className="admin-secondary inline-flex items-center gap-2">
          <X size={16} /> Anuluj
        </button>
        <button type="submit" disabled={disabled} className="admin-success inline-flex items-center gap-2">
          <Save size={16} /> {disabled ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </div>
    </form>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url";
  required?: boolean;
}) {
  return (
    <label className="text-sm text-gray-300">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={`${EDIT_INPUT_CLASS} mt-1.5`} />
    </label>
  );
}
