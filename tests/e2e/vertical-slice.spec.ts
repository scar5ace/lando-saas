import { expect, test } from "@playwright/test";

test.skip(
  process.env.E2E_FULL !== "1",
  "Требуется подготовленная PostgreSQL и выполненный development seed.",
);

test.setTimeout(90_000);

test("вход → правка → автосохранение → публикация", async ({ page }) => {
  await page.goto("/login?next=%2Fdashboard");
  await page.getByLabel("Email").fill("demo@lando.test");
  await page.getByLabel("Пароль").fill("Demo-Lando-2026!");
  await page.getByRole("button", { name: "Войти", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(
    page.getByRole("heading", {
      name: "Климат Мастер — демонстрационный лендинг",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Открыть", exact: true }).click();

  await expect(page).toHaveURL(/\/editor$/);
  const previewNavigation = page
    .getByLabel("Предпросмотр сайта")
    .locator('nav[aria-label="Навигация по странице"]');
  await page.getByRole("button", { name: "Телефон" }).click();
  await expect(previewNavigation).toBeHidden();
  await page.getByRole("button", { name: "Компьютер" }).click();
  await expect(previewNavigation).toBeVisible();

  const title = `Проверенная публикация ${Date.now()}`;
  await page.getByLabel("Основной текст").fill(title);
  await expect(page.getByText("Сохранено", { exact: true })).toBeVisible({
    timeout: 20_000,
  });

  await page
    .getByRole("button", { name: /^(?:Обновить|Опубликовать)$/ })
    .click();
  await expect(
    page.getByText("Сайт опубликован. Публичная версия обновлена."),
  ).toBeVisible({ timeout: 20_000 });

  const publicPagePromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Открыть", exact: true }).click();
  const publicPage = await publicPagePromise;
  await publicPage.waitForLoadState("domcontentloaded");
  await expect(
    publicPage.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
});
