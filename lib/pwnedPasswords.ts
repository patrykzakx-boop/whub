const PWNED_PASSWORDS_URL = "https://api.pwnedpasswords.com/range/";
const CHECK_TIMEOUT_MS = 5_000;

export class PwnedPasswordCheckUnavailableError extends Error {
  constructor() {
    super("Nie udało się bezpiecznie zweryfikować hasła. Spróbuj ponownie później.");
    this.name = "PwnedPasswordCheckUnavailableError";
  }
}

export async function assertPasswordNotPwned(password: string) {
  const digest = await sha1(password);
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);

  let response: Response;

  try {
    response = await fetch(`${PWNED_PASSWORDS_URL}${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": "WeldHub-Password-Security/1.0",
      },
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new PwnedPasswordCheckUnavailableError();
  }

  if (!response.ok) throw new PwnedPasswordCheckUnavailableError();

  const matches = (await response.text()).split(/\r?\n/);
  const compromised = matches.some((line) => {
    const [candidateSuffix, count] = line.trim().split(":");
    return candidateSuffix === suffix && Number(count) > 0;
  });

  if (compromised) {
    throw new Error(
      "To hasło pojawiło się w znanych wyciekach danych. Wybierz inne, unikalne hasło."
    );
  }
}

async function sha1(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-1", bytes);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
