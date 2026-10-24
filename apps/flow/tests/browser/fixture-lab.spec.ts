import { expect, test } from "@playwright/test";
import { flowGenuiFixtureIds } from "@repo/genui/fixtures/lab-fixtures";

test.describe.configure({ mode: "serial" });

const widths = [320, 768, 1280] as const;

for (const fixtureId of flowGenuiFixtureIds) {
  test.describe(`fixture ${fixtureId}`, () => {
    for (const width of widths) {
      test(`renders at ${width}px without horizontal overflow`, async ({
        page,
      }) => {
        await page.setViewportSize({ height: 900, width: 1280 });
        await page.goto(`/__genui__/fixtures/${fixtureId}`);
        const container = page.locator("[data-fixture-id]");
        await container.evaluate((node, w) => {
          const el = node as HTMLElement;
          el.style.maxWidth = `${w}px`;
          el.style.width = "100%";
        }, width);
        await expect(container).toBeVisible();
        const overflow = await container.evaluate((node) => {
          const el = node as HTMLElement;
          return el.scrollWidth > el.clientWidth + 1;
        });
        expect(overflow).toBe(false);
      });
    }
  });
}

test("injection-safe fixture shows answer copy", async ({ page }) => {
  await page.goto("/__genui__/fixtures/injection-safe");
  await expect(page.getByText(/approved UI components/iu)).toBeVisible();
});
