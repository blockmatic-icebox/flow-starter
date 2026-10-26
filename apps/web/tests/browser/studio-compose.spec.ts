import { expect, test } from "@playwright/test";

test("starter chip composes support dashboard without prior refine context", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await page
    .getByRole("button", { name: /customer support dashboard/iu })
    .click();

  await expect(page.getByText("Ticket #1042")).toBeVisible({
    timeout: 30_000,
  });
  expect(errors).toEqual([]);
});

test("new composition clears preview and allows another deterministic example", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /customer support dashboard/iu })
    .click();
  await expect(page.getByText("Ticket #1042")).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: "New composition" }).click();
  await expect(page.getByText("What should we build?")).toBeVisible();

  await page
    .getByRole("button", { name: /compare orbit and nova plans/iu })
    .click();
  const preview = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Studio" }) });
  await expect(preview.getByText("Orbit Plan")).toBeVisible({
    timeout: 30_000,
  });
  await expect(preview.getByText("$29")).toBeVisible();
  await expect(preview.getByText("Nova Plan")).toBeVisible();
});
