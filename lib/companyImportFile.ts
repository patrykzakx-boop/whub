import "server-only";

import { parse } from "csv-parse/sync";
import { readSheet } from "read-excel-file/node";

import {
  CompanyImportValue,
  MAX_COMPANY_IMPORT_FILE_BYTES,
  parseCompanyImportRows,
} from "@/lib/companyImport";

const ACCEPTED_EXTENSIONS = new Set(["xlsx", "csv"]);

export async function parseCompanyImportFile(file: File) {
  if (file.size === 0) throw new Error("Wybierz niepusty plik.");
  if (file.size > MAX_COMPANY_IMPORT_FILE_BYTES) {
    throw new Error("Plik może mieć maksymalnie 2 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    throw new Error("Dozwolone są wyłącznie pliki .xlsx i .csv.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: CompanyImportValue[][];

  if (extension === "xlsx") {
    rows = (await readSheet(buffer)) as CompanyImportValue[][];
  } else {
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const delimiter = detectDelimiter(text);
    rows = parse(text, {
      delimiter,
      bom: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
      max_record_size: 20_000,
    }) as CompanyImportValue[][];
  }

  return parseCompanyImportRows(rows);
}

function detectDelimiter(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

