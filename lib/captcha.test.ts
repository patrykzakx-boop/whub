import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CaptchaUnavailableError,
  CaptchaVerificationError,
  requireCaptchaToken,
  verifyTurnstile,
} from "@/lib/captcha";

describe("Turnstile CAPTCHA", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  });

  it("odrzuca brakujący i zbyt długi token", () => {
    expect(() => requireCaptchaToken(undefined)).toThrow(
      CaptchaVerificationError
    );
    expect(() => requireCaptchaToken("x".repeat(2_049))).toThrow(
      CaptchaVerificationError
    );
  });

  it("weryfikuje token, akcję, host i adres klienta", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sekret";
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "localhost, whub.example";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          action: "request_create",
          hostname: "whub.example",
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyTurnstile(
        new Request("https://whub.example/api/requests", {
          headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
        }),
        "token",
        "request_create"
      )
    ).resolves.toBeUndefined();

    const body = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get("secret")).toBe("sekret");
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("203.0.113.10");
  });

  it("odrzuca token wystawiony dla innej akcji", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sekret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            action: "login",
            hostname: "localhost",
          })
        )
      )
    );

    await expect(
      verifyTurnstile(new Request("http://localhost"), "token", "register")
    ).rejects.toBeInstanceOf(CaptchaVerificationError);
  });

  it("odrzuca token wystawiony dla obcego hosta", async () => {
    process.env.TURNSTILE_SECRET_KEY = "sekret";
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "whub.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            action: "login",
            hostname: "phishing.example",
          })
        )
      )
    );

    await expect(
      verifyTurnstile(new Request("https://whub.example"), "token", "login")
    ).rejects.toBeInstanceOf(CaptchaVerificationError);
  });

  it("zgłasza błąd konfiguracji, gdy brakuje sekretu", async () => {
    await expect(
      verifyTurnstile(new Request("http://localhost"), "token", "login")
    ).rejects.toBeInstanceOf(CaptchaUnavailableError);
  });
});
