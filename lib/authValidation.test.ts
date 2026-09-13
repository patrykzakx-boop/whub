import { describe, expect, it } from "vitest";
import {
  validateLoginCredentials,
  validatePasswordReset,
  validateRegistration,
} from "@/lib/authValidation";

describe("auth input validation", () => {
  it("normalizuje e-mail bez zmieniania hasła", () => {
    expect(
      validateLoginCredentials({
        email: "  TEST@Example.com ",
        password: " hasło ze spacją ",
      })
    ).toEqual({
      email: "test@example.com",
      password: " hasło ze spacją ",
    });
  });

  it("odrzuca brak lub błędny adres e-mail", () => {
    expect(() =>
      validateLoginCredentials({ email: "", password: "sekret" })
    ).toThrow("Wpisz e-mail i hasło.");

    expect(() => validatePasswordReset({ email: "nie-email" })).toThrow(
      "Adres e-mail jest nieprawidłowy."
    );
  });

  it("odrzuca puste i przesadnie długie hasło", () => {
    expect(() =>
      validateLoginCredentials({ email: "test@example.com", password: "   " })
    ).toThrow("Wpisz e-mail i hasło.");

    expect(() =>
      validateLoginCredentials({
        email: "test@example.com",
        password: "a".repeat(1_025),
      })
    ).toThrow("Hasło jest zbyt długie.");
  });

  it("wymaga co najmniej ośmiu znaków przy rejestracji", () => {
    expect(() =>
      validateRegistration({
        email: "test@example.com",
        password: "1234567",
      })
    ).toThrow("Hasło musi mieć co najmniej 8 znaków.");

    expect(
      validateRegistration({
        email: "TEST@example.com",
        password: "12345678",
      })
    ).toEqual({ email: "test@example.com", password: "12345678" });
  });
});
