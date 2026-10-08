import { expect, test } from "@playwright/test";
import {
  installAuthenticatedSupabaseMock,
  installCaptchaMock,
  mockEmptySupabaseRest,
} from "./helpers";

test("gość dodaje zlecenie i otrzymuje prywatny link", async ({ page }) => {
  await installCaptchaMock(page);
  await page.route("**/api/requests", (route) =>
    route.fulfill({
      status: 201,
      json: { id: 123, access_token: "e2e-access-token" },
    })
  );
  await page.route("**/api/request-access/e2e-access-token", (route) =>
    route.fulfill({
      status: 200,
      json: {
        request: {
          id: 123,
          title: "Balustrada testowa",
          city: "Nysa",
          category: "balustrady",
          description: "Test automatyczny",
          status: "new",
          created_at: new Date().toISOString(),
          customer_name: "Klient Testowy",
          customer_phone: "600000000",
          customer_email: "klient@whub.pl",
          access_token: "e2e-access-token",
        },
        offers: [],
      },
    })
  );

  await page.goto("/add-request");
  await page.getByLabel("Tytuł zlecenia").fill("Balustrada testowa");
  await page.getByLabel("Opis projektu").fill("Test automatyczny");
  await page.getByLabel("Lokalizacja zlecenia").fill("Nysa");
  await page.getByLabel("Imię i nazwisko").fill("Klient Testowy");
  await page.getByRole("button", { name: "Opublikuj zapytanie" }).click();
  await expect(page).toHaveURL(/\/request-access\/e2e-access-token$/);
  await expect(
    page.getByRole("heading", { name: "Balustrada testowa" })
  ).toBeVisible();
});

test("klient wybiera ofertę przez prywatny link", async ({ page }) => {
  await page.route("**/api/request-access/e2e-client-token", (route) =>
    route.fulfill({
      status: 200,
      json: {
        request: {
          id: 321,
          title: "Schody stalowe",
          city: "Opole",
          category: "schody",
          description: "Schody do hali",
          status: "new",
          created_at: new Date().toISOString(),
          customer_name: "Klient",
          customer_phone: "600000000",
          customer_email: "klient@whub.pl",
          access_token: "e2e-client-token",
        },
        offers: [
          {
            id: 77,
            request_id: 321,
            company_id: 12,
            message: "Możemy wykonać schody.",
            price_estimate: "5000 zł",
            price_amount: 5000,
            price_description: "Brutto, z materiałem",
            availability: "2 tygodnie",
            status: "interested",
            created_at: new Date().toISOString(),
            companies: {
              id: 12,
              name: "Stal Test",
              city: "Nysa",
              region: "opolskie",
              phone: "600000001",
              email: "firma@whub.pl",
              logo_url: null,
            },
          },
        ],
      },
    })
  );
  await page.route(
    "**/api/request-access/e2e-client-token/offers/77",
    (route) =>
      route.fulfill({ status: 200, json: { requestStatus: "active" } })
  );

  await page.goto("/request-access/e2e-client-token");
  await page.getByRole("button", { name: "Wybierz firmę" }).click();
  await expect(page.getByRole("table").getByText("Wybrana firma")).toBeVisible();
  await expect(page.getByText(/Firma została oznaczona/)).toBeVisible();
});

test("zalogowany wykonawca przechodzi kreator dodawania firmy", async ({
  page,
}) => {
  await installAuthenticatedSupabaseMock(page);
  await mockEmptySupabaseRest(page);
  await page.route("https://maps.googleapis.com/**", (route) => route.abort());

  await page.goto("/add-company");
  await expect(
    page.getByRole("heading", { name: /Utwórz profil firmy/ })
  ).toBeVisible();
  await page.getByPlaceholder("Np. StalTech Sp. z o.o.").fill("Firma E2E");
  await page.locator("textarea").first().fill("Opis firmy testowej");
  await page.getByPlaceholder("2015").fill("2020");

  for (let step = 0; step < 5; step += 1) {
    await page.getByRole("button", { name: "Dalej" }).click();
  }

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("czeka na zatwierdzenie");
    await dialog.accept();
  });
  await page.getByRole("button", { name: "Opublikuj firmę" }).click();
});

test("obcy użytkownik nie otworzy panelu ani panelu administratora", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/admin");
  await expect(
    page.getByText(/Zaloguj się, aby otworzyć panel administratora/)
  ).toBeVisible();
});
