import { classifyThemeDeterministic } from "../src/theme/classify-deterministic";

const fixtures = [
  {
    description: "export all dashboards to csv weekly",
    expectedTheme: "reporting_exports",
    title: "CSV export",
  },
  {
    description: "notify slack when alert fires",
    expectedTheme: "integrations_alerts",
    title: "Slack alerts",
  },
];

export const runTriageMatrixOffline = () => {
  const results = fixtures.map((fixture) => {
    const out = classifyThemeDeterministic({
      description: fixture.description,
      title: fixture.title,
    });
    return {
      expectedTheme: fixture.expectedTheme,
      ok: out.themeKey === fixture.expectedTheme,
      themeKey: out.themeKey,
      title: fixture.title,
    };
  });

  const failed = results.filter((r) => !r.ok);
  return { failed, ok: failed.length === 0, results };
};

if (import.meta.url === `file://${process.argv[1]}`)
  console.log(JSON.stringify(runTriageMatrixOffline(), null, 2));
