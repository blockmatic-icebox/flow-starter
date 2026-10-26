import { expect, test } from "@playwright/test";

import { trackPageErrors } from "./track-page-errors";

test("homepage renders studio shell", async ({ page }) => {
  const errors = trackPageErrors(page);

  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("What should we build?")).toBeVisible();
  await expect(
    page.getByPlaceholder(/customer support dashboard/iu)
  ).toBeVisible();

  expect(errors).toEqual([]);
});
