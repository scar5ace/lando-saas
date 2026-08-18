import { expect, test } from "@playwright/test";

const prompt =
  "Создайте светлый лендинг для семейного фотографа в Казани с услугами, ценами, отзывами и формой записи";

test("публичная главная сохраняет запрос и открывает регистрацию", async ({
  page,
}) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/создайте сайт одной фразой/i);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Создайте сайт одной фразой",
    }),
  ).toBeVisible();

  const promptField = page.getByLabel("Опишите сайт, который хотите создать");
  await expect(promptField).toBeVisible();
  await promptField.fill(prompt);
  await promptField.press("Control+Enter");

  await expect(page).toHaveURL((url) => {
    return (
      url.pathname === "/register" &&
      url.searchParams.get("next") === "/dashboard/new"
    );
  });

  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("lando.pendingPrompt")),
    )
    .toBe(prompt);
});
