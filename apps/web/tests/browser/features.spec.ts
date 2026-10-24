import { expect, test } from "@playwright/test";

test("feature intelligence journeys", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Feature Intelligence" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Browse requests" }).click();
  await expect(
    page.getByRole("heading", { name: "Discover requests" })
  ).toBeVisible();
  await expect(
    page.getByText("Slack digest for high-priority requests")
  ).toBeVisible();

  await page.getByRole("button", { name: "New request" }).click();
  await page.getByLabel("Title").fill("Assessment smoke test request");
  await page
    .getByLabel("Description")
    .fill("Need CSV export for quarterly planning with support counts.");
  await page.getByRole("button", { name: "Submit request" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Assessment smoke test request"
  );

  await page.getByRole("button", { name: "Support this request" }).click();
  await expect(page.getByText("1 supporters")).toBeVisible();

  await page.getByRole("button", { name: "Run triage" }).click();
  await expect(page.getByText("Suggested triage")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Fixture mode")).toBeVisible();

  await page.getByRole("button", { name: "Confirm triage" }).click();
  await expect(page.getByText("triaged", { exact: true })).toBeVisible();
});
