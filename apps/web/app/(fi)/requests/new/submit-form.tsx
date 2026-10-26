"use client";

import type { DuplicateCandidate } from "@repo/fi";
import { Button } from "@repo/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Spinner } from "@repo/ui/components/spinner";
import { Textarea } from "@repo/ui/components/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FeedbackSteps } from "../../_components/hunch/feedback-steps";
import {
  actionConfirmRequest,
  actionCreateDraftAndTriage,
  actionRetryTriage,
} from "../../actions";

const TRIAGE_STAGES = [
  "Checking for similar feedback",
  "Matching theme",
  "Classifying request",
  "Drafting decision summary",
];

const matchLabel = (score: number) =>
  score > 0.35 ? "Strong match (similar wording)" : "Possible match (lexical)";

const DuplicateLinkSection = ({
  duplicates,
  isExternal,
  linkId,
  setLinkId,
}: {
  duplicates: DuplicateCandidate[];
  isExternal: boolean;
  linkId: string | null;
  setLinkId: (id: string | null) => void;
}) => {
  if (duplicates.length === 0) return null;

  return (
    <section className="space-y-3 rounded-lg border p-4">
      <h2 className="font-medium">
        {isExternal ? "Similar ideas" : "Similar existing requests"}
      </h2>
      {isExternal ? null : (
        <ul className="space-y-2 text-sm">
          {duplicates.map((d) => (
            <li key={d.id}>
              <Link
                className="text-primary underline"
                href={`/signals/${d.id}`}
              >
                {d.title}
              </Link>
              <span className="text-muted-foreground"> — {d.explanation}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium" id="intake-link-label">
          {isExternal
            ? "Link to a similar idea (optional)"
            : "Link this submission to an existing request (optional)"}
        </p>
        <RadioGroup
          aria-labelledby="intake-link-label"
          onValueChange={(value) => {
            setLinkId(value === "none" ? null : value);
          }}
          value={linkId ?? "none"}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="intake-link-none" value="none" />
            <Label htmlFor="intake-link-none">No link</Label>
          </div>
          {duplicates.map((d) => (
            <div className="flex items-center gap-2" key={d.id}>
              <RadioGroupItem id={`intake-link-${d.id}`} value={d.id} />
              <Label htmlFor={`intake-link-${d.id}`}>
                {d.title}
                {isExternal ? (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    ({matchLabel(d.score)})
                  </span>
                ) : null}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </section>
  );
};

export const SubmitForm = ({
  context,
}: {
  context: "external" | "internal";
}) => {
  const router = useRouter();
  const isExternal = context === "external";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [decisionBrief, setDecisionBrief] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [thankYou, setThankYou] = useState(false);
  const [degraded, setDegraded] = useState(false);

  const source = isExternal ? "customer" : "internal";

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setStageIndex((i) => (i + 1) % TRIAGE_STAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [loading]);

  const runTriage = async () => {
    setLoading(true);
    setStageIndex(0);
    const { harness, request } = await actionCreateDraftAndTriage({
      description,
      source,
      title,
    });
    if (!request) {
      setLoading(false);
      return;
    }
    setRequestId(request.id);
    setDegraded(harness.degraded);
    setProblemStatement(
      harness.problemStatement.trim() || description.trim().slice(0, 500)
    );
    setDecisionBrief(harness.decisionBrief);
    setDuplicates(harness.duplicateCandidates);
    setLinkId(harness.recommendedIntakeLinkId);
    setLoading(false);
  };

  const confirm = async () => {
    if (!requestId) return;
    setLoading(true);
    await actionConfirmRequest({
      intakeLinkedRequestId: linkId,
      problemStatement,
      requestId,
    });
    setLoading(false);
    if (isExternal) {
      setThankYou(true);
      return;
    }
    router.push(`/signals/${requestId}`);
  };

  if (thankYou && requestId)
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-lg border p-6">
        <p className="text-lg">
          Thank you — we&apos;ll consider this with other feedback.
        </p>
        <Link
          className="text-primary text-sm underline"
          href={`/signals/${requestId}`}
        >
          View your submission
        </Link>
      </div>
    );

  if (loading && !requestId)
    return (
      <div
        aria-live="polite"
        className="mx-auto flex max-w-xl flex-col items-center gap-3 py-12 text-center"
      >
        <Spinner className="size-8" />
        <p className="font-medium">{TRIAGE_STAGES[stageIndex]}</p>
        <p className="text-muted-foreground text-sm">
          Usually takes 10–20 seconds while we check similar requests and draft
          a summary.
        </p>
      </div>
    );

  if (!requestId)
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          runTriage().catch(console.error);
        }}
      >
        <FeedbackSteps current={1} />
        <Input
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          value={title}
        />
        <Textarea
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            isExternal
              ? "What's going wrong or missing?"
              : "Paste notes from customer or support ticket"
          }
          required
          rows={6}
          value={description}
        />
        <Button disabled={loading} type="submit">
          Find related signals
        </Button>
      </form>
    );

  let confirmLabel = "Confirm & publish";
  if (loading) confirmLabel = "Publishing…";
  else if (isExternal) confirmLabel = "Submit feedback";

  const retryAi = async () => {
    if (!requestId) return;
    setLoading(true);
    const { harness } = await actionRetryTriage({ requestId });
    setDegraded(harness.degraded);
    setProblemStatement(
      harness.problemStatement.trim() || description.trim().slice(0, 500)
    );
    setDecisionBrief(harness.decisionBrief);
    setDuplicates(harness.duplicateCandidates);
    setLinkId(harness.recommendedIntakeLinkId);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <FeedbackSteps current={2} />
      {degraded ? (
        <output className="border-border bg-muted/50 block space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">AI review was limited</p>
          <p className="text-muted-foreground">
            We saved your title and description. You can edit the summary below,
            submit anyway, or retry AI review.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              disabled={loading}
              onClick={() => retryAi().catch(console.error)}
              type="button"
              variant="outline"
            >
              Retry AI review
            </Button>
          </div>
        </output>
      ) : null}
      <DuplicateLinkSection
        duplicates={duplicates}
        isExternal={isExternal}
        linkId={linkId}
        setLinkId={setLinkId}
      />
      <label className="block text-sm font-medium" htmlFor="problem-statement">
        {isExternal ? "We heard this as:" : "Problem statement"}
      </label>
      <Textarea
        id="problem-statement"
        onChange={(e) => setProblemStatement(e.target.value)}
        rows={isExternal ? 2 : 4}
        value={problemStatement}
      />
      {!isExternal && decisionBrief ? (
        <Collapsible>
          <CollapsibleTrigger className="text-sm font-medium underline">
            PM summary
          </CollapsibleTrigger>
          <CollapsibleContent className="text-muted-foreground pt-2 text-sm">
            {decisionBrief}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      <Button
        disabled={loading}
        onClick={() => {
          confirm().catch(console.error);
        }}
        type="button"
      >
        {confirmLabel}
      </Button>
    </div>
  );
};
