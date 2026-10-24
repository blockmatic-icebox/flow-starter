export default function HowItWorksPage() {
  return (
    <article className="prose prose-sm dark:prose-invert flex max-w-none flex-col gap-4 text-sm leading-relaxed">
      <h1 className="text-xl font-medium">How requests are evaluated</h1>
      <section className="flex flex-col gap-2">
        <h2 className="font-medium">1. Intake</h2>
        <p className="text-muted-foreground">
          Anyone can submit a request with a title and description. New items
          start in <code className="text-xs">submitted</code> status with theme{" "}
          <code className="text-xs">uncategorized</code>.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-medium">2. Discovery &amp; support</h2>
        <p className="text-muted-foreground">
          The catalog lists all requests sorted by recency. Visitors can support
          a request once per browser (cookie-backed visitor id). Support count
          is a demand signal, not an automatic priority score.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-medium">3. AI triage (human confirmed)</h2>
        <p className="text-muted-foreground">
          Triage suggests a theme slug, priority band, related existing
          requests, and a short rationale. With{" "}
          <code className="text-xs">AI_GATEWAY_API_KEY</code>
          configured, the suggestion comes from a hosted model; otherwise the
          app runs transparent <strong>fixture mode</strong> using keyword and
          lexical overlap rules. Product owners click{" "}
          <strong>Confirm triage</strong> to move the request to{" "}
          <code className="text-xs">triaged</code> and apply the suggested
          theme.
        </p>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="font-medium">4. Prioritization</h2>
        <p className="text-muted-foreground">
          Confirmed items are grouped by theme on the index page. Planned and
          shipped states are reserved for roadmap communication; this assessment
          build seeds examples in those states for discovery UX only.
        </p>
      </section>
    </article>
  );
}
