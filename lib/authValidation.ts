export type LoginCredentialsInput = {
  email?: string;
  password?: string;
};

export type PasswordResetInput = {
  email?: string;
};

export function validateLoginCredentials(input: LoginCredentialsInput) {
  const email = normalizeEmail(input.email);
  const password = input.password || "";

  if (!email || !password.trim()) {
    throw new Error("Wpisz e-mail i hasło.");
  }

  if (!isEmailAddress(email)) {
    throw new Error("Adres e-mail jest nieprawidłowy.");
  }

  if (password.length > 1_024) {
    throw new Error("Hasło jest zbyt długie.");
  }

  return { email, password };
}

export function validatePasswordReset(input: PasswordResetInput) {
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("Podaj adres e-mail.");
  }

  if (!isEmailAddress(email)) {
    throw new Error("Adres e-mail jest nieprawidłowy.");
  }

  return { email };
}

function normalizeEmail(value: string | undefined) {
  return (value || "").trim().toLowerCase().slice(0, 320);
}

function isEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
