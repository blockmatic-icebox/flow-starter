import { expect, test } from "@playwright/test";
import { flowGenuiFixtures } from "@repo/genui/fixtures/lab-fixtures";

test.describe.configure({ mode: "serial" });

test.describe("GenUI demo shell", () => {
  test("compose button submits mocked NDJSON stream", async ({ page }) => {
    const fixture = flowGenuiFixtures["compare-plans"];
    await page.route("**/api/genui/compose", async (route) => {
      const payload = route.request().postDataJSON() as {
        clientRequestId?: string;
      };
      const requestId = payload.clientRequestId ?? "pw-demo";
      const events = [
        { requestId, sequence: 0, type: "start" },
        {
          envelope: fixture.envelope,
          requestId,
          sequence: 1,
          type: "complete",
        },
      ];
      await route.fulfill({
        body: `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
        contentType: "application/x-ndjson",
        status: 200,
      });
    });

    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Flow" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText(/Status:\s*complete/iu)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Orbit Plan/iu)).toBeVisible();
  });

  test("empty compose is a no-op when query is whitespace", async ({
    page,
  }) => {
    let composeCalls = 0;
    await page.route("**/api/genui/compose", async (route) => {
      composeCalls += 1;
      await route.fulfill({ body: "{}", status: 400 });
    });
    await page.goto("/?q=%20%20%20");
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText(/Status:\s*idle/iu)).toBeVisible();
    expect(composeCalls).toBe(0);
  });

  test("keeps the newer submission when two requests overlap", async ({
    page,
  }) => {
    const compare = flowGenuiFixtures["compare-plans"];
    const metrics = flowGenuiFixtures["metrics-dashboard"];
    await page.route("**/api/genui/compose", async (route) => {
      const payload = route.request().postDataJSON() as {
        clientRequestId?: string;
        query?: string;
      };
      const requestId = payload.clientRequestId ?? "pw-demo";
      const slow = payload.query?.includes("FIRST") === true;
      if (slow) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 800);
        });
      }
      const envelope = slow ? compare.envelope : metrics.envelope;
      const events = [
        { requestId, sequence: 0, type: "start" },
        { envelope, requestId, sequence: 1, type: "complete" },
      ];
      try {
        await route.fulfill({
          body: `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
          contentType: "application/x-ndjson",
          status: 200,
        });
      } catch {
        // The superseded request can abort before fulfill.
      }
    });

    await page.goto("/");
    const query = page.locator("form input");
    await query.fill("FIRST compare");
    await page.getByRole("button", { name: "Compose" }).click();
    await query.fill("show revenue");
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText(/Monthly recurring revenue/iu)).toBeVisible();
    await expect(page.getByText(/Status:\s*complete/iu)).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Orbit Plan/iu)).toHaveCount(0);
  });

  test("shows an error for a failed HTTP request", async ({ page }) => {
    await page.route("**/api/genui/compose", async (route) => {
      await route.fulfill({ body: "nope", status: 500 });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText(/Status:\s*error/iu)).toBeVisible();
  });

  test("shows an error for invalid NDJSON", async ({ page }) => {
    await page.route("**/api/genui/compose", async (route) => {
      await route.fulfill({
        body: "not-json\n",
        contentType: "application/x-ndjson",
        status: 200,
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText(/Status:\s*error/iu)).toBeVisible();
    await expect(page.getByText(/Status:\s*complete/iu)).toHaveCount(0);
  });

  test("does not complete when a stream error follows a partial", async ({
    page,
  }) => {
    const fixture = flowGenuiFixtures["compare-plans"];
    await page.route("**/api/genui/compose", async (route) => {
      const payload = route.request().postDataJSON() as {
        clientRequestId?: string;
      };
      const requestId = payload.clientRequestId ?? "pw-demo";
      const events = [
        { requestId, sequence: 0, type: "start" },
        {
          envelope: fixture.envelope,
          requestId,
          sequence: 1,
          type: "partial",
        },
        {
          message: "Composition failed validation.",
          requestId,
          sequence: 2,
          type: "error",
        },
      ];
      await route.fulfill({
        body: `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
        contentType: "application/x-ndjson",
        status: 200,
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText(/Status:\s*error/iu)).toBeVisible();
    await expect(page.getByText(/Orbit Plan/iu)).toBeVisible();
  });
});
