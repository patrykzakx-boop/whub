import { describe, expect, it } from "vitest";
import {
  isAllowedRequestImageType,
  MAX_REQUEST_IMAGE_BYTES,
  validateRequestImageMetadata,
} from "@/lib/requestImages";

describe("request image validation", () => {
  it("akceptuje wyłącznie bezpieczne formaty rastrowe", () => {
    expect(
      validateRequestImageMetadata({ contentType: "image/webp", size: 1024 })
    ).toEqual({ contentType: "image/webp", extension: "webp", size: 1024 });

    expect(isAllowedRequestImageType("image/jpeg")).toBe(true);
    expect(isAllowedRequestImageType("image/svg+xml")).toBe(false);
  });

  it("odrzuca SVG i pliki większe niż 5 MB", () => {
    expect(() =>
      validateRequestImageMetadata({ contentType: "image/svg+xml", size: 1024 })
    ).toThrow("Dozwolone są zdjęcia JPG, PNG i WebP.");

    expect(() =>
      validateRequestImageMetadata({
        contentType: "image/png",
        size: MAX_REQUEST_IMAGE_BYTES + 1,
      })
    ).toThrow("Zdjęcie może mieć maksymalnie 5 MB.");
  });

  it("odrzuca zerowy i niecałkowity rozmiar", () => {
    expect(() =>
      validateRequestImageMetadata({ contentType: "image/png", size: 0 })
    ).toThrow("Zdjęcie może mieć maksymalnie 5 MB.");

    expect(() =>
      validateRequestImageMetadata({ contentType: "image/png", size: 1.5 })
    ).toThrow("Zdjęcie może mieć maksymalnie 5 MB.");
  });
});
