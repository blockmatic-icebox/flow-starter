import { expect, test } from "@playwright/test";

test("homepage renders studio shell", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("What should we build?")).toBeVisible();
  await expect(
    page.getByPlaceholder(/customer support dashboard/iu)
  ).toBeVisible();

  expect(errors).toEqual([]);
});
