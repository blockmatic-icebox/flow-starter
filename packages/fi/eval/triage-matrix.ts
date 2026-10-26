import { classifyThemeDeterministic } from "../src/theme/classify-deterministic";

const fixtures = [
  {
    description:
      "Open shift coverage when a cook calls out sick — need replacement staffing.",
    expectedTheme: "scheduling_coverage",
    title: "Sick call coverage gap",
  },
  {
    description:
      "Manager approved our trade but schedules still show the old shift.",
    expectedTheme: "shift_swaps",
    title: "Approved swap did not update",
  },
  {
    description: "Push and SMS alerts when a supervisor changes my shift.",
    expectedTheme: "notifications",
    title: "Shift change notifications",
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
