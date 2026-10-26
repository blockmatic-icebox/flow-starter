import { getDb, getInsights } from "@repo/fi";
import { Card, CardHeader, CardTitle } from "@repo/ui/components/card";

const formatMs = (ms: number | null) => {
  if (ms === null) return "—";
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}m`;
};

export default async function InsightsPage() {
  const insights = await getInsights({ db: getDb() });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Insights</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Decision readiness (avg)</CardTitle>
            <p className="text-2xl font-semibold">
              {formatMs(insights.avgDecisionReadinessMs)}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open queue</CardTitle>
            <p className="text-2xl font-semibold">{insights.openQueueCount}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Decision capture rate</CardTitle>
            <p className="text-2xl font-semibold">
              {insights.decisionCaptureRate === null
                ? "—"
                : `${(insights.decisionCaptureRate * 100).toFixed(0)}%`}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Intake link rate</CardTitle>
            <p className="text-2xl font-semibold">
              {insights.intakeLinkRate === null
                ? "—"
                : `${(insights.intakeLinkRate * 100).toFixed(0)}%`}
            </p>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
