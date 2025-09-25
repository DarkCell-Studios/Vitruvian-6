import { expect, test } from "@playwright/test";

test.describe("Cosmoscope journeys", () => {
  test("Landing to planet exploration flow", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /cosmoscope/i })).toBeVisible();
    await page.getByRole("button", { name: /start exploring/i }).click();

    await expect(page).toHaveURL(/system/);
    await page.getByRole("button", { name: /mars/i }).click();
    await page.getByRole("button", { name: /travel to the planet/i }).click();

    await expect(page).toHaveURL(/planet\/mars/);

    await page.keyboard.press("KeyO");
    await page.getByRole("slider", { name: /time/i }).press("ArrowRight");
    await page.getByRole("button", { name: /poi/i }).first().click();

    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
