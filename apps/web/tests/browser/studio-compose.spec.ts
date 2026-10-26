import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { acmeCatalogRecords, supportDashboardRecords } from "@repo/genui";

import { trackPageErrors } from "./track-page-errors";

const supportTicket = supportDashboardRecords.find(
  (record) => record.id === "entity:ticket-1042"
);
const supportTicketTitle =
  supportTicket?.kind === "entity" ? supportTicket.title : "Ticket #1042";

const orbitPlan = acmeCatalogRecords.find(
  (record) => record.id === "entity:orbit-plan"
);
const novaPlan = acmeCatalogRecords.find(
  (record) => record.id === "entity:nova-plan"
);
const orbitTitle =
  orbitPlan?.kind === "entity" ? orbitPlan.title : "Orbit Plan";
const orbitPrice =
  orbitPlan?.kind === "entity" ? (orbitPlan.price ?? "$29") : "$29";
const novaTitle = novaPlan?.kind === "entity" ? novaPlan.title : "Nova Plan";

const composeSupportDashboard = async (page: Page) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /customer support dashboard/iu })
    .click();
  await expect(page.getByText(supportTicketTitle)).toBeVisible({
    timeout: 30_000,
  });
};

test("starter chip composes support dashboard without prior refine context", async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await composeSupportDashboard(page);
  expect(errors).toEqual([]);
});

test("new composition clears preview and allows another deterministic example", async ({
  page,
}) => {
  const errors = trackPageErrors(page);
  await composeSupportDashboard(page);

  await page.getByRole("button", { name: "New composition" }).click();
  await expect(page.getByText("What should we build?")).toBeVisible();

  await page
    .getByRole("button", { name: /compare orbit and nova plans/iu })
    .click();
  const preview = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Studio" }) });
  await expect(preview.getByText(orbitTitle)).toBeVisible({ timeout: 30_000 });
  await expect(preview.getByText(orbitPrice)).toBeVisible();
  await expect(preview.getByText(novaTitle)).toBeVisible();
  expect(errors).toEqual([]);
});
