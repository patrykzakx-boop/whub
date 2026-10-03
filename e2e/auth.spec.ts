import { expect, test } from "@playwright/test";
import {
  installCaptchaMock,
  installSupabaseAuthFetchMock,
  mockEmptySupabaseRest,
  mockJwt,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await installCaptchaMock(page);
});

test("rejestracja pokazuje potwierdzenie bez przeładowania strony", async ({
  page,
}) => {
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 201,
      json: { message: "Konto utworzone. Sprawdź swoją skrzynkę e-mail." },
    })
  );
  await page.goto("/register");
  await page.getByLabel("Adres e-mail").fill("nowy@whub.pl");
  await page.getByLabel("Hasło").fill("Bardzo-Dlugie-Haslo-2026!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Utwórz konto" }).click();
  await expect(page.getByRole("status")).toContainText("Konto utworzone");
});

test("reset hasła przechodzi do jednoznacznego potwierdzenia", async ({
  page,
}) => {
  await page.route("**/api/auth/forgot-password", (route) =>
    route.fulfill({ status: 200, json: { message: "Przyjęto prośbę." } })
  );
  await page.goto("/forgot-password");
  await page.getByLabel("Adres e-mail").fill("klient@whub.pl");
  await page.getByRole("button", { name: "Wyślij link resetujący" }).click();
  await expect(
    page.getByRole("heading", { name: "Sprawdź swoją skrzynkę" })
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("klient@whub.pl");
});

test("poprawne logowanie otwiera panel klienta", async ({ page }) => {
  const accessToken = mockJwt();
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@whub.pl",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      status: 200,
      json: { accessToken, refreshToken: "e2e-refresh-token" },
    })
  );
  const session = {
    access_token: accessToken,
    refresh_token: "e2e-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  };
  await installSupabaseAuthFetchMock(page, user, session);
  await page.route("**/auth/v1/**", (route) => {
    const isUserRequest = new URL(route.request().url()).pathname.endsWith(
      "/user"
    );
    return route.fulfill({
      status: 200,
      json: isUserRequest ? user : session,
    });
  });
  await mockEmptySupabaseRest(page);

  await page.goto("/login");
  await page.getByLabel("Adres e-mail").fill("e2e@whub.pl");
  await page.getByLabel("Hasło").fill("Bardzo-Dlugie-Haslo-2026!");
  await page.getByRole("button", { name: "Zaloguj się" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Panel klienta" })
  ).toBeVisible();
});
