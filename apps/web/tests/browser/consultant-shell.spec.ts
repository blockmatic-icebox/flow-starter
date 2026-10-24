import { expect, test } from "@playwright/test";

test("consultant sidebar is visible on desktop", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Consultant" })).toBeVisible();
  await expect(page.getByPlaceholder("Message the consultant…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
});
