import { describe, expect, it } from "vitest";
import { validateRequestSubmission } from "@/lib/requestSubmission";

const SUPABASE_URL = "https://example.supabase.co";

const validInput = {
  title: " Balustrada na taras ",
  category: "Balustrady",
  description: " Potrzebuję wykonania balustrady. ",
  city: " Kraków ",
};

describe("validateRequestSubmission", () => {
  it("normalizuje bezpieczne dane podstawowego zapytania", () => {
    expect(validateRequestSubmission(validInput, SUPABASE_URL)).toEqual({
      title: "Balustrada na taras",
      category: "Balustrady",
      description: "Potrzebuję wykonania balustrady.",
      city: "Kraków",
      customerName: null,
      customerPhone: null,
      customerEmail: null,
      requestType: "individual",
      companyId: null,
      imageUrls: [],
    });
  });

  it("odrzuca brak wymaganych pól", () => {
    expect(() =>
      validateRequestSubmission({ ...validInput, title: " " }, SUPABASE_URL)
    ).toThrow("Uzupełnij tytuł, opis projektu i lokalizację.");
  });

  it("odrzuca nieznaną kategorię i błędny identyfikator firmy", () => {
    expect(() =>
      validateRequestSubmission(
        { ...validInput, category: "../../../admin" },
        SUPABASE_URL
      )
    ).toThrow("Wybrana kategoria zapytania jest nieprawidłowa.");

    expect(() =>
      validateRequestSubmission({ ...validInput, companyId: -1 }, SUPABASE_URL)
    ).toThrow("Identyfikator firmy jest nieprawidłowy.");
  });

  it("odrzuca błędny email", () => {
    expect(() =>
      validateRequestSubmission(
        { ...validInput, customerEmail: "nie-email" },
        SUPABASE_URL
      )
    ).toThrow("Adres email jest nieprawidłowy.");
  });

  it("akceptuje wyłącznie zdjęcia z właściwego bucketu Supabase", () => {
    const validImage =
      SUPABASE_URL +
      "/storage/v1/object/public/request_images/requests/16f36b8a-1e06-4f96-81ea-fbb1243c0554.webp";

    expect(
      validateRequestSubmission(
        { ...validInput, imageUrls: [validImage] },
        SUPABASE_URL
      ).imageUrls
    ).toEqual([validImage]);

    expect(() =>
      validateRequestSubmission(
        { ...validInput, imageUrls: ["https://attacker.example/image.webp"] },
        SUPABASE_URL
      )
    ).toThrow("Adres jednego ze zdjęć jest nieprawidłowy.");

    expect(() =>
      validateRequestSubmission(
        { ...validInput, imageUrls: [validImage + "?token=podmieniony"] },
        SUPABASE_URL
      )
    ).toThrow("Adres jednego ze zdjęć jest nieprawidłowy.");
  });

  it("ogranicza liczbę zdjęć", () => {
    const images = Array.from(
      { length: 7 },
      (_, index) =>
        `${SUPABASE_URL}/storage/v1/object/public/request_images/requests/16f36b8a-1e06-4f96-81ea-fbb1243c05${String(index).padStart(2, "0")}.webp`
    );

    expect(() =>
      validateRequestSubmission({ ...validInput, imageUrls: images }, SUPABASE_URL)
    ).toThrow("Możesz dodać maksymalnie 6 zdjęć.");
  });

  it("odrzuca wypełnione pole-pułapkę na boty", () => {
    expect(() =>
      validateRequestSubmission(
        { ...validInput, website: "https://spam.example" },
        SUPABASE_URL
      )
    ).toThrow("Nie udało się wysłać formularza.");
  });
});
