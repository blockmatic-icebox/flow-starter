"use client";

import type { DuplicateCandidate } from "@repo/fi";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Spinner } from "@repo/ui/components/spinner";
import { Textarea } from "@repo/ui/components/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  actionConfirmRequest,
  actionCreateDraftAndTriage,
} from "../../actions";

const TRIAGE_STAGES = [
  "Checking for similar requests",
  "Matching theme",
  "Classifying request",
  "Drafting decision summary",
];

export const SubmitForm = ({
  context,
}: {
  context: "external" | "internal";
}) => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [thankYou, setThankYou] = useState(false);

  const source = context === "external" ? "customer" : "internal";

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
    setProblemStatement(harness.problemStatement);
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
    if (context === "external") {
      setThankYou(true);
      return;
    }
    router.push(`/requests/${requestId}`);
  };

  if (thankYou)
    return (
      <p className="text-lg">
        Thank you — your feedback was published. We appreciate it.
      </p>
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
        className="mx-auto max-w-xl space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          runTriage().catch(console.error);
        }}
      >
        <Input
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          value={title}
        />
        <Textarea
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the need"
          required
          rows={6}
          value={description}
        />
        <Button disabled={loading} type="submit">
          Continue
        </Button>
      </form>
    );

  const showDupes = context === "internal" || duplicates.length > 0;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {showDupes && duplicates.length > 0 ? (
        <section className="space-y-3 rounded-lg border p-4">
          <h2 className="font-medium">Similar existing requests</h2>
          <ul className="space-y-2 text-sm">
            {duplicates.map((d) => (
              <li key={d.id}>
                <Link
                  className="text-primary underline"
                  href={`/requests/${d.id}`}
                >
                  {d.title}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  — {d.explanation}
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-sm font-medium" id="intake-link-label">
              Link this submission to an existing request (optional)
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
                  <Label htmlFor={`intake-link-${d.id}`}>{d.title}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </section>
      ) : null}
      <label className="block text-sm font-medium" htmlFor="problem-statement">
        Problem statement
      </label>
      <Textarea
        id="problem-statement"
        onChange={(e) => setProblemStatement(e.target.value)}
        rows={4}
        value={problemStatement}
      />
      {linkId && !showDupes ? (
        <p className="text-muted-foreground text-sm">
          Suggested link:{" "}
          <Link className="underline" href={`/requests/${linkId}`}>
            View linked request
          </Link>
        </p>
      ) : null}
      <Button
        disabled={loading}
        onClick={() => {
          confirm().catch(console.error);
        }}
        type="button"
      >
        {loading ? "Publishing…" : "Confirm & publish"}
      </Button>
    </div>
  );
};
