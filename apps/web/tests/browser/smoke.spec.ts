import { expect, test } from "@playwright/test";

test("homepage renders without consultant or GenUI demo", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Product starter" })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Message Flow Agent…")).toHaveCount(0);
  await expect(page.getByLabel("Ask about Flow")).toHaveCount(0);
});

test("no GenUI demo route", async ({ page }) => {
  const response = await page.goto("/genui-demo");
  expect(response?.status()).toBe(404);
});

test("no MCP endpoint on product app", async ({ page }) => {
  const response = await page.request.post("/api/mcp", {
    data: {},
    headers: { "Content-Type": "application/json" },
  });
  expect(response.status()).toBe(404);
});
