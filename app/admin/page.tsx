"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type CompanyItem = {
  id: number; name: string | null; city: string | null; owner_id: string | null;
  status: string; moderation_status: string; moderation_note: string | null; created_at: string;
  description: string | null; phone: string | null; email: string | null; website: string | null; services: string[] | null;
};
type RequestItem = {
  id: number; title: string | null; city: string | null; customer_id: string | null;
  customer_email: string | null; status: string; moderation_status: string;
  moderation_note: string | null; created_at: string;
  description: string | null; category: string | null;
};
type ReportItem = {
  id: number; reporter_id: string; target_type: "company" | "request"; target_id: number;
  reason: string; details: string | null; status: string; created_at: string;
};
type BlockedItem = { user_id: string; reason: string; blocked_at: string; blocked_by: string | null };
type AuditItem = {
  id: number; action: string; target_type: string; target_id: string;
  note: string | null; created_at: string;
};
type AdminUserItem = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  isBlocked: boolean;
  isAdmin: boolean;
  companies: { id: number; name: string | null }[];
  requestCount: number;
};
type UsersData = {
  users: AdminUserItem[];
  total: number;
  truncated: boolean;
};
type ModerationData = {
  admin: { id: string; email: string | null };
  companies: CompanyItem[];
  requests: RequestItem[];
  reports: ReportItem[];
  blockedUsers: BlockedItem[];
  auditLog: AuditItem[];
  userEmails: Record<string, string | null>;
};

export default function AdminPage() {
  const [data, setData] = useState<ModerationData | null>(null);
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [usersError, setUsersError] = useState("");

  const authorizedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Zaloguj się, aby otworzyć panel administratora.");

    return fetch(url, {
      ...init,
      headers: { ...init?.headers, Authorization: "Bearer " + token },
    });
  }, []);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/moderation");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się pobrać kolejki.");
      setData(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nie udało się otworzyć panelu.");
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch]);

  const loadUsers = useCallback(async () => {
    setUsersError("");
    try {
      const response = await authorizedFetch("/api/admin/users");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Nie udało się pobrać użytkowników.");
      setUsersData(result);
    } catch (loadError) {
      setUsersError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać użytkowników.");
    } finally {
      setUsersLoading(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
      void loadUsers();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData, loadUsers]);

  const act = async (
    action: string,
    targetType: string,
    targetId: string | number,
    askForNote = false
  ) => {
    const note = askForNote ? window.prompt("Powód lub notatka dla historii moderacji:") : null;
    if (askForNote && note === null) return;

    const key = action + ":" + targetId;
    setWorking(key);
    setError("");
    try {
      const response = await authorizedFetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetType, targetId, note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Operacja nie powiodła się.");
      await Promise.all([loadData(), loadUsers()]);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Operacja nie powiodła się.");
    } finally {
      setWorking("");
    }
  };

  if (loading) return <AdminMessage>Sprawdzanie uprawnień administratora…</AdminMessage>;
  if (!data) return <AdminMessage error={error}>{error || "Brak dostępu."}</AdminMessage>;

  const emailFor = (id: string | null) => id ? data.userEmails[id] || id : "konto gościa";
  const normalizedQuery = userQuery.trim().toLocaleLowerCase("pl-PL");
  const visibleUsers = (usersData?.users || []).filter((user) => {
    if (!normalizedQuery) return true;
    return [
      user.email || "",
      user.id,
      ...user.companies.map((company) => company.name || ""),
    ].some((value) => value.toLocaleLowerCase("pl-PL").includes(normalizedQuery));
  });

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
              <ShieldCheck size={18} /> Administracja
            </div>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Centrum moderacji</h1>
            <p className="mt-2 text-sm text-gray-400">Zalogowano jako {data.admin.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/import-companies" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-orange-500">
              <FileSpreadsheet size={16} /> Import firm
            </Link>
            <button onClick={() => void Promise.all([loadData(), loadUsers()])} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:border-orange-500">
              Odśwież dane
            </button>
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Użytkownicy" value={usersData?.total ?? 0} />
          <Stat label="Firmy do akceptacji" value={data.companies.length} />
          <Stat label="Otwarte zgłoszenia" value={data.reports.length} />
          <Stat label="Ukryte zlecenia" value={data.requests.filter((item) => item.moderation_status === "hidden").length} />
          <Stat label="Zablokowane konta" value={data.blockedUsers.length} />
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1218]">
          <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Zarejestrowani użytkownicy</h2>
              <p className="mt-1 text-xs text-gray-400">
                {usersLoading ? "Pobieranie kont…" : `${visibleUsers.length} z ${usersData?.total ?? 0} kont`}
              </p>
            </div>
            <label className="sr-only" htmlFor="admin-user-search">Szukaj użytkownika</label>
            <input
              id="admin-user-search"
              type="search"
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Szukaj po e-mailu, ID lub firmie"
              className="w-full rounded-xl border border-slate-700 bg-[#080b0f] px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-400 focus:border-orange-500 md:max-w-sm"
            />
          </div>

          {usersError ? (
            <p className="p-5 text-sm text-red-300">{usersError}</p>
          ) : usersLoading ? (
            <p className="p-5 text-sm text-gray-400">Ładowanie listy użytkowników…</p>
          ) : !visibleUsers.length ? (
            <p className="p-5 text-sm text-gray-400">Nie znaleziono użytkowników.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {visibleUsers.map((user) => {
                const companyNames = user.companies.map((company) => company.name || `Firma #${company.id}`);
                const details = [
                  `${user.companies.length} ${pluralize(user.companies.length, "firma", "firmy", "firm")}`,
                  `${user.requestCount} ${pluralize(user.requestCount, "zlecenie", "zlecenia", "zleceń")}`,
                  user.emailConfirmedAt ? "e-mail potwierdzony" : "e-mail niepotwierdzony",
                ].join(" · ");

                return (
                  <Row
                    key={user.id}
                    title={user.email || "Konto bez adresu e-mail"}
                    subtitle={`Rejestracja: ${formatDate(user.createdAt)} · Ostatnie logowanie: ${user.lastSignInAt ? formatDate(user.lastSignInAt) : "brak"}`}
                    description={`${details}${companyNames.length ? ` · ${companyNames.join(", ")}` : ""}`}
                  >
                    {user.isAdmin && <span className="rounded-lg border border-orange-500/40 px-3 py-1.5 text-xs font-semibold text-orange-300">Administrator</span>}
                    {user.isBlocked ? (
                      <button disabled={Boolean(working)} onClick={() => void act("unblock_user", "user", user.id, true)} className="admin-success">Odblokuj</button>
                    ) : !user.isAdmin ? (
                      <button disabled={Boolean(working)} onClick={() => void act("block_user", "user", user.id, true)} className="admin-secondary">Zablokuj konto</button>
                    ) : null}
                  </Row>
                );
              })}
            </div>
          )}

          {usersData?.truncated && (
            <p className="border-t border-slate-800 p-4 text-xs text-amber-300">
              Wyświetlono pierwsze 1000 kont. Dla większej liczby dodamy stronicowanie.
            </p>
          )}
        </section>

        <Section title="Firmy oczekujące na zatwierdzenie" empty={!data.companies.length}>
          {data.companies.map((company) => (
            <Row key={company.id} title={company.name || "Firma bez nazwy"} subtitle={`${company.city || "Brak miasta"} · ${company.email || emailFor(company.owner_id)} · ${company.phone || "brak telefonu"}`} description={company.description}>
              <button disabled={Boolean(working)} onClick={() => void act("approve_company", "company", company.id)} className="admin-success">Zatwierdź</button>
              <button disabled={Boolean(working)} onClick={() => void act("reject_company", "company", company.id, true)} className="admin-danger">Odrzuć</button>
              {company.owner_id && <button disabled={Boolean(working)} onClick={() => void act("block_user", "user", company.owner_id!, true)} className="admin-secondary">Zablokuj konto</button>}
            </Row>
          ))}
        </Section>

        <Section title="Zgłoszenia nadużyć" empty={!data.reports.length}>
          {data.reports.map((report) => (
            <Row key={report.id} title={`${report.reason} · ${report.target_type} #${report.target_id}`} subtitle={`${emailFor(report.reporter_id)} · ${formatDate(report.created_at)}`} description={report.details}>
              <Link href={report.target_type === "company" ? `/company/${report.target_id}` : `/request/${report.target_id}`} target="_blank" className="admin-secondary">Otwórz</Link>
              {report.target_type === "company" ? (
                <button disabled={Boolean(working)} onClick={() => void act("reject_company", "company", report.target_id, true)} className="admin-danger">Ukryj firmę</button>
              ) : (
                <button disabled={Boolean(working)} onClick={() => void act("hide_request", "request", report.target_id, true)} className="admin-danger">Ukryj zlecenie</button>
              )}
              <button disabled={Boolean(working)} onClick={() => void act("resolve_report", "report", report.id, true)} className="admin-success">Rozpatrzone</button>
              <button disabled={Boolean(working)} onClick={() => void act("dismiss_report", "report", report.id, true)} className="admin-secondary">Odrzuć zgłoszenie</button>
            </Row>
          ))}
        </Section>

        <Section title="Ostatnie zlecenia" empty={!data.requests.length}>
          {data.requests.map((item) => (
            <Row key={item.id} title={item.title || `Zlecenie #${item.id}`} subtitle={`${item.city || "Brak miasta"} · ${item.customer_email || emailFor(item.customer_id)} · ${item.moderation_status === "hidden" ? "UKRYTE" : "widoczne"}`} description={item.moderation_note || item.description}>
              {item.moderation_status === "hidden" ? (
                <button disabled={Boolean(working)} onClick={() => void act("restore_request", "request", item.id, true)} className="admin-success">Przywróć</button>
              ) : (
                <button disabled={Boolean(working)} onClick={() => void act("hide_request", "request", item.id, true)} className="admin-danger">Ukryj</button>
              )}
              {item.customer_id && <button disabled={Boolean(working)} onClick={() => void act("block_user", "user", item.customer_id!, true)} className="admin-secondary">Zablokuj konto</button>}
            </Row>
          ))}
        </Section>

        <Section title="Zablokowane konta" empty={!data.blockedUsers.length}>
          {data.blockedUsers.map((item) => (
            <Row key={item.user_id} title={emailFor(item.user_id)} subtitle={`Zablokowano ${formatDate(item.blocked_at)}`} description={item.reason}>
              <button disabled={Boolean(working)} onClick={() => void act("unblock_user", "user", item.user_id, true)} className="admin-success">Odblokuj</button>
            </Row>
          ))}
        </Section>

        <Section title="Historia działań" empty={!data.auditLog.length}>
          {data.auditLog.map((item) => (
            <Row key={item.id} title={actionLabel(item.action)} subtitle={`${item.target_type} #${item.target_id} · ${formatDate(item.created_at)}`} description={item.note} />
          ))}
        </Section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-[#0d1218] p-5"><div className="text-3xl font-bold">{value}</div><div className="mt-1 text-sm text-gray-400">{label}</div></div>;
}
function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1218]"><h2 className="border-b border-slate-800 px-5 py-4 text-lg font-semibold">{title}</h2>{empty ? <p className="p-5 text-sm text-gray-400">Brak pozycji.</p> : <div className="divide-y divide-slate-800">{children}</div>}</section>;
}
function Row({ title, subtitle, description, children }: { title: string; subtitle: string; description?: string | null; children?: React.ReactNode }) {
  return <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="font-medium text-white">{title}</div><div className="mt-1 break-all text-xs text-gray-400">{subtitle}</div>{description && <p className="mt-2 text-sm text-gray-400">{description}</p>}</div>{children && <div className="flex flex-wrap gap-2">{children}</div>}</div>;
}
function AdminMessage({ children, error = "" }: { children: React.ReactNode; error?: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-4"><div className={`max-w-lg rounded-2xl border p-7 text-center ${error ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-slate-800 bg-[#0d1218] text-gray-300"}`}>{children}</div></main>;
}
function formatDate(value: string) { return new Date(value).toLocaleString("pl-PL"); }
function pluralize(value: number, singular: string, few: string, many: string) {
  if (value === 1) return singular;
  const lastTwo = value % 100;
  const last = value % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}
function actionLabel(action: string) {
  return ({ approve_company: "Zatwierdzono firmę", reject_company: "Odrzucono firmę", hide_request: "Ukryto zlecenie", restore_request: "Przywrócono zlecenie", block_user: "Zablokowano konto", unblock_user: "Odblokowano konto", resolve_report: "Rozpatrzono zgłoszenie", dismiss_report: "Odrzucono zgłoszenie", import_company_leads: "Zaimportowano katalog firm", update_company_lead: "Zmieniono status firmy z katalogu", edit_company_lead: "Edytowano firmę z katalogu", delete_company_lead: "Usunięto firmę z katalogu", convert_company_lead: "Utworzono profil firmy z katalogu" } as Record<string, string>)[action] || action;
}
