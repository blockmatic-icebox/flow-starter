import { expect, test } from "@playwright/test";

test("Flow Agent sidebar is visible on desktop", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Flow Agent" })).toBeVisible();
  await expect(page.getByPlaceholder("Message Flow Agent…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
});

test("Flow Agent answers without credentials", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");
  const composer = page.getByPlaceholder("Message Flow Agent…");
  await composer.click();
  await page.keyboard.type("How is Flow Starter built?");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Flow Starter/iu).first()).toBeVisible();
});

test("Flow Agent is reachable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 390 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open Flow Agent" }).click();
  await expect(page.getByPlaceholder("Message Flow Agent…")).toBeVisible();
});
