import { expect, test } from "@playwright/test";
import { flowGenuiFixtures } from "@repo/genui/fixtures/lab-fixtures";

test.describe.configure({ mode: "serial" });

test.describe("GenUI demo shell", () => {
  test("compose button submits mocked NDJSON stream", async ({ page }) => {
    const fixture = flowGenuiFixtures["compare-plans"];
    await page.route("**/api/genui/compose", async (route) => {
      const events = [
        { requestId: "pw-demo", sequence: 0, type: "start" },
        {
          envelope: fixture.envelope,
          requestId: "pw-demo",
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

    await page.goto("/genui-demo");
    await expect(
      page.getByRole("heading", { name: /Acme Analytics GenUI demo/iu })
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
    await page.goto("/genui-demo?q=%20%20%20");
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText(/Status:\s*idle/iu)).toBeVisible();
    expect(composeCalls).toBe(0);
  });
});
