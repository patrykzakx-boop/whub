import { describe, expect, it } from "vitest";

import {
  findDuplicateReason,
  parseCompanyImportRows,
} from "./companyImport";

describe("company import", () => {
  it("maps Polish headers and normalizes company fields", () => {
    const result = parseCompanyImportRows([
      [
        "Nazwa firmy",
        "NIP",
        "Miasto",
        "Województwo",
        "Telefon firmowy",
        "E-mail firmowy",
        "Strona WWW",
        "Usługi",
        "Materiały",
        "Metody spawania",
        "Usługi mobilne",
        "Źródło URL",
      ],
      [
        "Test Stal",
        "526-104-08-28",
        "Nysa",
        "opolskie",
        "+48 500 600 700",
        "BIURO@TEST-STAL.PL",
        "test-stal.pl",
        "Balustrady; Konstrukcje stalowe",
        "Stal czarna (węglowa)",
        "MIG, MAG",
        "tak",
        "https://test-stal.pl/kontakt",
      ],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].errors).toEqual([]);
    expect(result.rows[0].data).toMatchObject({
      name: "Test Stal",
      nip: "5261040828",
      city: "Nysa",
      region: "opolskie",
      email: "biuro@test-stal.pl",
      website: "https://test-stal.pl/",
      services: ["balustrady", "konstrukcje"],
      materials: ["stal-czarna"],
      weldingMethods: ["mig", "mag"],
      mobileService: true,
    });
  });

  it("rejects missing required headers", () => {
    const result = parseCompanyImportRows([
      ["Firma", "Telefon"],
      ["Test Stal", "500600700"],
    ]);

    expect(result.rows).toEqual([]);
    expect(result.errors).toContain("Brakuje kolumny „miasto”.");
    expect(result.errors).toContain(
      "Brakuje kolumny „zrodlo_url” albo „strona_www”."
    );
  });

  it("marks invalid values without rejecting the whole file", () => {
    const result = parseCompanyImportRows([
      ["nazwa", "nip", "miasto", "email", "zrodlo_url"],
      ["A", "1234567890", "", "zly-email", "google.pl/maps"],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows[0].errors).toEqual(
      expect.arrayContaining([
        "Podaj nazwę firmy.",
        "Podaj miasto.",
        "NIP jest nieprawidłowy.",
        "Adres e-mail jest nieprawidłowy.",
      ])
    );
  });

  it("detects duplicate companies inside one file", () => {
    const result = parseCompanyImportRows([
      ["nazwa", "miasto", "strona_www"],
      ["Test Stal", "Nysa", "https://test-stal.pl"],
      ["Inna nazwa", "Opole", "https://www.test-stal.pl/oferta"],
    ]);

    expect(result.rows[0].duplicateReason).toBeNull();
    expect(result.rows[1].duplicateReason).toContain("Ta sama domena");
  });

  it("detects a duplicate against an existing company", () => {
    const candidate = parseCompanyImportRows([
      ["nazwa", "miasto", "strona_www"],
      ["Test Stal", "Nysa", "https://test-stal.pl"],
    ]).rows[0].data;

    expect(
      findDuplicateReason(candidate, [
        { name: "Test Stal", city: "Nysa", website: "https://other.pl" },
      ])
    ).toBe("Ta sama nazwa i miasto");
  });
});

