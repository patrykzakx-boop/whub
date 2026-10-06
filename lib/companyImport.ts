import { MATERIALS } from "@/components/company-form/constants/materials";
import { METHODS } from "@/components/company-form/constants/methods";
import { SERVICES } from "@/components/company-form/constants/services";

export const MAX_COMPANY_IMPORT_ROWS = 500;
export const MAX_COMPANY_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

export type CompanyImportValue = string | number | boolean | Date | null;

export type CompanyLeadInput = {
  sourceRow: number;
  name: string;
  nip: string | null;
  city: string;
  region: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  primaryProfile: string | null;
  services: string[];
  servicesRaw: string[];
  materials: string[];
  weldingMethods: string[];
  serviceArea: string | null;
  mobileService: boolean;
  sourceUrl: string;
  sourceType: string | null;
  notes: string | null;
};

export type CompanyImportRow = {
  sourceRow: number;
  data: CompanyLeadInput;
  errors: string[];
  warnings: string[];
  duplicateReason: string | null;
};

export type CompanyImportResult = {
  rows: CompanyImportRow[];
  ignoredHeaders: string[];
  errors: string[];
};

type FieldName = Exclude<keyof CompanyLeadInput, "sourceRow">;

const HEADER_ALIASES: Record<string, FieldName> = {
  nazwa: "name",
  nazwa_firmy: "name",
  firma: "name",
  name: "name",
  nip: "nip",
  miasto: "city",
  miejscowosc: "city",
  city: "city",
  wojewodztwo: "region",
  region: "region",
  adres: "address",
  address: "address",
  telefon: "phone",
  telefon_firmowy: "phone",
  phone: "phone",
  email: "email",
  e_mail: "email",
  email_firmowy: "email",
  e_mail_firmowy: "email",
  strona: "website",
  strona_www: "website",
  www: "website",
  website: "website",
  profil_glowny: "primaryProfile",
  uslugi: "services",
  zakres_uslug: "services",
  services: "services",
  materialy: "materials",
  materials: "materials",
  metody_spawania: "weldingMethods",
  metody: "weldingMethods",
  welding_methods: "weldingMethods",
  obszar_dzialania: "serviceArea",
  service_area: "serviceArea",
  uslugi_mobilne: "mobileService",
  mobilnie: "mobileService",
  mobile_service: "mobileService",
  zrodlo: "sourceUrl",
  zrodlo_danych: "sourceUrl",
  zrodlo_url: "sourceUrl",
  source_url: "sourceUrl",
  rodzaj_zrodla: "sourceType",
  uwagi: "notes",
  notatki: "notes",
  notes: "notes",
};

const serviceMap = createOptionMap(SERVICES);
const materialMap = createOptionMap(MATERIALS);
const methodMap = createOptionMap(METHODS);
const REPEATABLE_FIELDS = new Set<FieldName>([
  "services",
  "materials",
  "weldingMethods",
]);

export function parseCompanyImportRows(
  rawRows: CompanyImportValue[][]
): CompanyImportResult {
  const headerRowIndex = findHeaderRowIndex(rawRows);
  if (headerRowIndex === -1) {
    const hasContent = rawRows.some((row) =>
      row.some((value) => cellText(value).length > 0)
    );
    return {
      rows: [],
      ignoredHeaders: [],
      errors: [
        hasContent
          ? "Nie znaleziono wiersza z nagłówkami firm."
          : "Plik jest pusty.",
      ],
    };
  }

  const headers = rawRows[headerRowIndex].map((value) => cellText(value));
  const mapping = new Map<number, FieldName>();
  const usedFields = new Set<FieldName>();
  const ignoredHeaders: string[] = [];
  const errors: string[] = [];

  headers.forEach((header, index) => {
    const field = HEADER_ALIASES[normalizeLabel(header)];
    if (!field) {
      if (header) ignoredHeaders.push(header);
      return;
    }
    if (usedFields.has(field) && !REPEATABLE_FIELDS.has(field)) {
      errors.push(`Kolumna „${header}” powtarza pole ${field}.`);
      return;
    }
    mapping.set(index, field);
    usedFields.add(field);
  });

  if (!usedFields.has("name")) errors.push("Brakuje kolumny „nazwa”.");
  if (!usedFields.has("city")) errors.push("Brakuje kolumny „miasto”.");
  if (!usedFields.has("sourceUrl") && !usedFields.has("website")) {
    errors.push("Brakuje kolumny „zrodlo_url” albo „strona_www”.");
  }

  if (errors.length > 0) return { rows: [], ignoredHeaders, errors };

  const dataRows = rawRows
    .slice(headerRowIndex + 1)
    .map((row, index) => ({ row, sourceRow: headerRowIndex + index + 2 }))
    .filter(({ row }) => row.some((value) => cellText(value).length > 0));
  if (dataRows.length > MAX_COMPANY_IMPORT_ROWS) {
    return {
      rows: [],
      ignoredHeaders,
      errors: [`Plik może zawierać maksymalnie ${MAX_COMPANY_IMPORT_ROWS} firm.`],
    };
  }

  const rows = dataRows.map(({ row, sourceRow }) =>
    parseRow(row, sourceRow, mapping)
  );
  markDuplicatesWithinFile(rows);

  return { rows, ignoredHeaders, errors: [] };
}

function parseRow(
  rawRow: CompanyImportValue[],
  sourceRow: number,
  mapping: Map<number, FieldName>
): CompanyImportRow {
  const values = new Map<FieldName, CompanyImportValue[]>();
  for (const [columnIndex, field] of mapping) {
    const fieldValues = values.get(field) || [];
    fieldValues.push(rawRow[columnIndex] ?? null);
    values.set(field, fieldValues);
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const name = limitedText(firstValue(values, "name"), 160);
  const city = limitedText(firstValue(values, "city"), 120);
  const nipRaw = cellText(firstValue(values, "nip")).replace(/\D/g, "");
  const email = limitedText(firstValue(values, "email"), 254).toLowerCase() || null;
  const website = normalizeUrl(limitedText(firstValue(values, "website"), 500));
  const sourceUrl =
    normalizeUrl(limitedText(firstValue(values, "sourceUrl"), 500)) || website || "";
  const rawServices = splitLists(values.get("services"));
  const services = mapOptions(rawServices, serviceMap);
  const unknownServices = rawServices.filter(
    (service) => mapOptions([service], serviceMap).length === 0
  );
  const materials = mapOptions(splitLists(values.get("materials")), materialMap);
  const weldingMethods = mapOptions(
    splitLists(values.get("weldingMethods")),
    methodMap
  );

  if (name.length < 2) errors.push("Podaj nazwę firmy.");
  if (!city) errors.push("Podaj miasto.");
  if (!sourceUrl) errors.push("Podaj źródło danych albo stronę WWW.");
  if (nipRaw && !isValidPolishNip(nipRaw)) errors.push("NIP jest nieprawidłowy.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Adres e-mail jest nieprawidłowy.");
  }
  if (limitedText(firstValue(values, "website"), 500) && !website) {
    errors.push("Adres strony WWW jest nieprawidłowy.");
  }
  if (limitedText(firstValue(values, "sourceUrl"), 500) && !normalizeUrl(limitedText(firstValue(values, "sourceUrl"), 500))) {
    errors.push("Adres źródła jest nieprawidłowy.");
  }
  if (unknownServices.length > 0) {
    warnings.push(`Nierozpoznane usługi: ${unknownServices.join(", ")}.`);
  }
  if (services.length === 0) warnings.push("Brak rozpoznanych usług WeldHub.");

  return {
    sourceRow,
    data: {
      sourceRow,
      name,
      nip: nipRaw || null,
      city,
      region: limitedText(firstValue(values, "region"), 120) || null,
      address: limitedText(firstValue(values, "address"), 240) || null,
      phone: limitedText(firstValue(values, "phone"), 40) || null,
      email,
      website,
      primaryProfile: limitedText(firstValue(values, "primaryProfile"), 120) || null,
      services,
      servicesRaw: rawServices,
      materials,
      weldingMethods,
      serviceArea: limitedText(firstValue(values, "serviceArea"), 120) || null,
      mobileService: parseBoolean(firstValue(values, "mobileService")),
      sourceUrl,
      sourceType: limitedText(firstValue(values, "sourceType"), 120) || null,
      notes: limitedText(firstValue(values, "notes"), 1000) || null,
    },
    errors,
    warnings,
    duplicateReason: null,
  };
}

export function findDuplicateReason(
  candidate: CompanyLeadInput,
  existing: Array<Partial<CompanyLeadInput>>
) {
  const candidateKeys = duplicateKeys(candidate);
  for (const item of existing) {
    const existingKeys = duplicateKeys(item);
    for (const [kind, value] of candidateKeys) {
      if (value && existingKeys.get(kind) === value) {
        return duplicateLabel(kind);
      }
    }
  }
  return null;
}

function markDuplicatesWithinFile(rows: CompanyImportRow[]) {
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (row.errors.length > 0) continue;
    for (const [kind, value] of duplicateKeys(row.data)) {
      if (!value) continue;
      const key = `${kind}:${value}`;
      const previousRow = seen.get(key);
      if (previousRow) {
        row.duplicateReason = `${duplicateLabel(kind)} — duplikat wiersza ${previousRow}`;
        break;
      }
      seen.set(key, row.sourceRow);
    }
  }
}

function duplicateKeys(item: Partial<CompanyLeadInput>) {
  const keys = new Map<string, string>();
  const nip = (item.nip || "").replace(/\D/g, "");
  const email = (item.email || "").trim().toLowerCase();
  const phone = (item.phone || "").replace(/\D/g, "");
  const website = websiteHost(item.website || "");
  const nameCity = `${normalizeLabel(item.name || "")}|${normalizeLabel(item.city || "")}`;
  if (nip) keys.set("nip", nip);
  if (website) keys.set("website", website);
  if (email) keys.set("email", email);
  if (phone.length >= 7) keys.set("phone", phone.slice(-9));
  if (nameCity !== "|") keys.set("nameCity", nameCity);
  return keys;
}

function duplicateLabel(kind: string) {
  return (
    {
      nip: "Ten sam NIP",
      website: "Ta sama domena",
      email: "Ten sam e-mail",
      phone: "Ten sam telefon",
      nameCity: "Ta sama nazwa i miasto",
    } as Record<string, string>
  )[kind] || "Duplikat";
}

function createOptionMap(options: Array<{ id: string; title: string }>) {
  const map = new Map<string, string>();
  for (const option of options) {
    map.set(normalizeLabel(option.id), option.id);
    map.set(normalizeLabel(option.title), option.id);
    if ("code" in option && typeof option.code === "string") {
      map.set(normalizeLabel(option.code), option.id);
    }
  }
  return map;
}

function mapOptions(values: string[], map: Map<string, string>) {
  const matches = new Set<string>();
  for (const value of values) {
    const normalized = normalizeLabel(value);
    const exact = map.get(normalized);
    if (exact) matches.add(exact);
    for (const [label, id] of map) {
      if (label.length >= 4 && containsNormalizedPhrase(normalized, label)) {
        matches.add(id);
      }
    }
  }
  return [...matches];
}

function splitList(value: CompanyImportValue | undefined) {
  return cellText(value)
    .split(/[;,|\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function splitLists(values: CompanyImportValue[] | undefined) {
  return (values || []).flatMap((value) => splitList(value)).slice(0, 30);
}

function firstValue(values: Map<FieldName, CompanyImportValue[]>, field: FieldName) {
  return values.get(field)?.find((value) => cellText(value).length > 0);
}

function containsNormalizedPhrase(value: string, phrase: string) {
  return `_${value}_`.includes(`_${phrase}_`);
}

function findHeaderRowIndex(rows: CompanyImportValue[][]) {
  let bestIndex = -1;
  let bestScore = 0;

  rows.forEach((row, index) => {
    const fields = new Set(
      row
        .map((value) => HEADER_ALIASES[normalizeLabel(cellText(value))])
        .filter((field): field is FieldName => Boolean(field))
    );
    const score = fields.size;
    if (fields.has("name") && score >= 2 && score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });

  return bestIndex;
}

function parseBoolean(value: CompanyImportValue | undefined) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["tak", "yes", "true", "1", "x"].includes(
    normalizeLabel(cellText(value))
  );
}

function limitedText(value: CompanyImportValue | undefined, max: number) {
  return cellText(value).slice(0, max);
}

function cellText(value: CompanyImportValue | undefined) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

export function normalizeLabel(value: string) {
  return value
    .replace(/[Łł]/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function websiteHost(value: string) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
}

function isValidPolishNip(value: string) {
  if (!/^\d{10}$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum = weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) % 11;
  return checksum !== 10 && checksum === digits[9];
}
