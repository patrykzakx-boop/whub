import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPasswordNotPwned,
  PwnedPasswordCheckUnavailableError,
} from "@/lib/pwnedPasswords";

describe("pwned password protection", () => {
  afterEach(() => vi.restoreAllMocks());

  it("odrzuca hasło obecne w bazie wycieków", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("1E4C9B93F3F0682250B6CF8331B7EE68FD8:100\nAAAA:0", {
        status: 200,
      })
    );

    await expect(assertPasswordNotPwned("password")).rejects.toThrow(
      "To hasło pojawiło się w znanych wyciekach danych."
    );
  });

  it("nie odrzuca hasła, którego skrótu nie znaleziono", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:2", { status: 200 })
    );

    await expect(assertPasswordNotPwned("unikalne-haslo-123")).resolves.toBeUndefined();
  });

  it("bezpiecznie przerywa operację, gdy usługa jest niedostępna", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("awaria", { status: 503 })
    );

    await expect(assertPasswordNotPwned("unikalne-haslo-123")).rejects.toBeInstanceOf(
      PwnedPasswordCheckUnavailableError
    );
  });
});
