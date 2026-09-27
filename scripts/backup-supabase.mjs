#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const CODEX_DIR = path.join(os.homedir(), "Documents", "Codex");
const DATA_ROOT = path.join(CODEX_DIR, "dane supabase");
const STORAGE_ROOT = path.join(CODEX_DIR, "zdjecia supabase");
const PAGE_SIZE = 1000;

const args = new Set(process.argv.slice(2));
if (args.has("--help") || args.has("-h")) {
  console.log(`
Backup Supabase dla WHUB

Komendy:
  npm run backup:supabase          pobiera dane i zdjęcia/pliki
  npm run backup:supabase:data     pobiera tylko dane
  npm run backup:supabase:storage  pobiera tylko zdjęcia/pliki

Foldery wyjściowe:
  ~/Documents/Codex/dane supabase
  ~/Documents/Codex/zdjecia supabase

Wymagane w .env.local:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Opcjonalne dla pełnego dumpa SQL:
  SUPABASE_DB_URL

Uwaga:
  Bez SUPABASE_DB_URL skrypt nadal robi eksport danych do JSON,
  ale pełny plik SQL z bazy zostanie pominięty.
`);
  process.exit(0);
}
const runData = !args.has("--storage-only");
const runStorage = !args.has("--data-only");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

const env = await loadEnv(path.join(projectRoot, ".env.local"));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;

if (!supabaseUrl || !serviceRoleKey) {
  fail(
    "Brakuje NEXT_PUBLIC_SUPABASE_URL albo SUPABASE_SERVICE_ROLE_KEY w .env.local."
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

if (runData) {
  await backupData();
}

if (runStorage) {
  await backupStorage();
}

console.log("");
console.log("Gotowe.");
console.log(`Dane: ${DATA_ROOT}`);
console.log(`Zdjęcia: ${STORAGE_ROOT}`);

async function backupData() {
  const targetDir = path.join(DATA_ROOT, `backup-${timestamp}`);
  const jsonDir = path.join(targetDir, "json");
  const sqlDir = path.join(targetDir, "sql");
  await fs.mkdir(jsonDir, { recursive: true });
  await fs.mkdir(sqlDir, { recursive: true });

  console.log("");
  console.log(`Backup danych Supabase -> ${targetDir}`);

  const tableNames = await getPublicTableNames();
  const tableManifest = [];

  for (const tableName of tableNames) {
    const rows = await fetchAllRows(tableName);
    await writeJson(path.join(jsonDir, `${safeName(tableName)}.json`), rows);
    tableManifest.push({ table: tableName, rows: rows.length });
    console.log(`- ${tableName}: ${rows.length} wierszy`);
  }

  const users = await fetchAuthUsers();
  await writeJson(path.join(jsonDir, "auth_users.json"), users);
  console.log(`- auth_users: ${users.length} użytkowników`);

  const storageIndex = await getStorageIndex();
  await writeJson(path.join(jsonDir, "storage_index.json"), storageIndex);
  console.log(`- storage_index: ${storageIndex.objects.length} plików w indeksie`);

  await writeJson(path.join(targetDir, "manifest.json"), {
    createdAt: new Date().toISOString(),
    supabaseUrl,
    tables: tableManifest,
    authUsers: users.length,
    storageObjects: storageIndex.objects.length,
    note:
      "JSON export zawiera dane dostępne przez API Supabase. Pełny dump SQL wymaga SUPABASE_DB_URL.",
  });

  await tryFullSqlDump(sqlDir);
}

async function backupStorage() {
  const targetDir = path.join(STORAGE_ROOT, `backup-${timestamp}`);
  await fs.mkdir(targetDir, { recursive: true });

  console.log("");
  console.log(`Backup zdjęć/plików Supabase Storage -> ${targetDir}`);

  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const manifest = [];

  for (const bucket of buckets || []) {
    const bucketDir = path.join(targetDir, safePathSegment(bucket.name));
    await fs.mkdir(bucketDir, { recursive: true });

    const objects = await listBucketObjects(bucket.name);
    console.log(`- bucket ${bucket.name}: ${objects.length} plików`);

    for (const objectPath of objects) {
      const { data, error: downloadError } = await supabase.storage
        .from(bucket.name)
        .download(objectPath);

      if (downloadError) {
        manifest.push({
          bucket: bucket.name,
          path: objectPath,
          ok: false,
          error: downloadError.message,
        });
        console.warn(`  ! błąd: ${bucket.name}/${objectPath}`);
        continue;
      }

      const localPath = path.join(
        bucketDir,
        ...objectPath.split("/").map(safePathSegment)
      );
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      const buffer = Buffer.from(await data.arrayBuffer());
      await fs.writeFile(localPath, buffer);
      manifest.push({
        bucket: bucket.name,
        path: objectPath,
        localPath,
        bytes: buffer.length,
        ok: true,
      });
    }
  }

  await writeJson(path.join(targetDir, "manifest.json"), {
    createdAt: new Date().toISOString(),
    supabaseUrl,
    files: manifest,
  });
}

async function getPublicTableNames() {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/openapi+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać listy tabel: ${response.status}`);
  }

  const spec = await response.json();
  return Object.keys(spec.definitions || {})
    .filter((name) => !name.startsWith("_"))
    .sort((a, b) => a.localeCompare(b));
}

async function fetchAllRows(tableName) {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.warn(`! pomijam ${tableName}: ${error.message}`);
      return rows;
    }

    rows.push(...(data || []));

    if (!data || data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

async function fetchAuthUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      console.warn(`! nie udało się pobrać auth.users: ${error.message}`);
      return users;
    }

    users.push(...(data.users || []));
    if (!data.users || data.users.length < PAGE_SIZE) break;
    page += 1;
  }

  return users;
}

async function getStorageIndex() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const objects = [];
  for (const bucket of buckets || []) {
    const paths = await listBucketObjects(bucket.name);
    for (const objectPath of paths) {
      objects.push({ bucket: bucket.name, path: objectPath });
    }
  }

  return { buckets: buckets || [], objects };
}

async function listBucketObjects(bucketName, prefix = "") {
  const paths = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.warn(`! nie udało się odczytać bucketu ${bucketName}: ${error.message}`);
      return paths;
    }

    for (const item of data || []) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null || item.metadata === null) {
        paths.push(...(await listBucketObjects(bucketName, itemPath)));
      } else {
        paths.push(itemPath);
      }
    }

    if (!data || data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return paths;
}

async function tryFullSqlDump(sqlDir) {
  const readmePath = path.join(sqlDir, "README.txt");

  if (!dbUrl) {
    await fs.writeFile(
      readmePath,
      [
        "Pełny dump SQL nie został wykonany.",
        "",
        "Aby go włączyć, dopisz lokalnie do .env.local zmienną:",
        "SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-...pooler.supabase.com:6543/postgres",
        "",
        "Connection string znajdziesz w Supabase:",
        "Project Settings -> Database -> Connection string.",
        "",
        "Nie wysyłaj tego hasła na GitHub i nie wklejaj go w czacie.",
      ].join("\n"),
      "utf8"
    );
    console.log("- SQL dump: pominięty, brak SUPABASE_DB_URL");
    return;
  }

  const pgDumpAvailable = await commandExists("pg_dump");
  if (!pgDumpAvailable) {
    await fs.writeFile(
      readmePath,
      [
        "Pełny dump SQL nie został wykonany.",
        "",
        "Powód: na komputerze nie znaleziono programu pg_dump.",
        "",
        "Na macOS można go zainstalować np. przez PostgreSQL/Postgres.app albo Homebrew.",
      ].join("\n"),
      "utf8"
    );
    console.log("- SQL dump: pominięty, brak pg_dump");
    return;
  }

  const dumpPath = path.join(sqlDir, "full-database.sql");
  await runCommand("pg_dump", [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-acl",
    "--file",
    dumpPath,
    dbUrl,
  ]);
  console.log(`- SQL dump: ${dumpPath}`);
}

async function commandExists(command) {
  try {
    await runCommand("command", ["-v", command], { shell: true, silent: true });
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: options.shell || false,
      stdio: options.silent ? "ignore" : "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} zakończył się kodem ${code}`));
      }
    });
  });
}

async function loadEnv(envPath) {
  if (!existsSync(envPath)) {
    fail(`Nie znaleziono pliku ${envPath}`);
  }

  const raw = await fs.readFile(envPath, "utf8");
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safeName(value) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function safePathSegment(value) {
  return value.replace(/[<>:"|?*\u0000-\u001F]/g, "_").replace(/\.\./g, "__");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
