import { expect, test } from "@playwright/test";

test("consultant sidebar is visible on desktop", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Consultant" })).toBeVisible();
  await expect(page.getByPlaceholder("Message the consultant…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
});

test("consultant opens from the keyboard and answers without credentials", async ({
  page,
}) => {
  await page.setViewportSize({ height: 900, width: 1280 });
  await page.goto("/");
  const composer = page.getByPlaceholder("Message the consultant…");
  await composer.click();
  await page.keyboard.type("How is this app built?");
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Flow Starter/iu).first()).toBeVisible();
});

test("consultant is reachable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 390 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open consultant chat" }).click();
  await expect(page.getByPlaceholder("Message the consultant…")).toBeVisible();
});
