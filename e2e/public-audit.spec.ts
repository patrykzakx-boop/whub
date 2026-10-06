import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { installCaptchaMock } from "./helpers";

const publicPages = [
  { path: "/", heading: /Opisz zlecenie/ },
  { path: "/companies", heading: /Lista firm spawalniczych/ },
  { path: "/requests", heading: "Aktywne zlecenia" },
  { path: "/login", heading: "Logowanie" },
  { path: "/register", heading: "Rejestracja" },
  { path: "/forgot-password", heading: "Reset hasła" },
  { path: "/regulamin", heading: /Regulamin/ },
  { path: "/polityka-prywatnosci", heading: /Polityka prywatności/ },
];

test.beforeEach(async ({ page }) => {
  await installCaptchaMock(page);
});

for (const publicPage of publicPages) {
  test(`${publicPage.path} jest dostępna i nie wychodzi poza ekran`, async ({
    page,
  }) => {
    await page.goto(publicPage.path);
    await expect(
      page.getByRole("heading", { level: 1, name: publicPage.heading })
    ).toBeVisible();

    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(overflow.content).toBeLessThanOrEqual(overflow.viewport + 1);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const seriousViolations = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact || "")
    );
    expect(seriousViolations).toEqual([]);
  });
}

test("cała publiczna nawigacja działa klawiaturą", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Przejdź do treści" })
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("menu mobilne udostępnia wszystkie główne sekcje", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: /Menu/ });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const mobileNavigation = page.getByRole("navigation", {
    name: "Nawigacja mobilna",
  });
  await expect(mobileNavigation.getByRole("link", { name: "Firmy" })).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Zlecenia" })).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Dodaj zlecenie" })
  ).toBeVisible();
  await expect(
    mobileNavigation.getByRole("link", { name: "Rejestracja" })
  ).toBeVisible();

  await mobileNavigation.getByRole("link", { name: "Firmy" }).click();
  await expect(page).toHaveURL(/\/companies$/);
  await expect(mobileNavigation).toBeHidden();
});
