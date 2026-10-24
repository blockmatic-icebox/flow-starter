import { validateCompositionEnvelope } from "../contract/compiler";
import type { CompositionEnvelope } from "../core/envelope";
import type { ComposeResult } from "../orchestration/compose";
import type { QueryMatrixCase } from "./query-matrix";

export type MatrixGrade = "PASS" | "FAIL";

const groundedRecordPrefix = /^(?:entity:|document:|metric:|media:)/u;

export const rootExperienceFromOpenUi = (openuiText: string) =>
  openuiText.match(/^\s*root\s*=\s*(?<root>\w+)/u)?.groups?.root ?? null;

const gradeError = ({
  error,
  matrixCase,
}: {
  error: unknown;
  matrixCase: QueryMatrixCase;
}) => {
  const message = error instanceof Error ? error.message : String(error);
  if (matrixCase.category === "malformed" && message === "invalid-query") {
    return { grade: "PASS" as const };
  }
  return { grade: "FAIL" as const, reason: `unexpected error: ${message}` };
};

const gradeCategorySurface = ({
  category,
  envelope,
}: {
  category: QueryMatrixCase["category"];
  envelope: CompositionEnvelope | null;
}) => {
  if (category === "injection") {
    if (!envelope) {
      return {
        grade: "FAIL" as const,
        reason: "injection case missing envelope",
      };
    }
    const root = rootExperienceFromOpenUi(envelope.openuiText);
    if (root === "Answer" || root === "StatusMessage") {
      return { grade: "PASS" as const };
    }
    return {
      grade: "FAIL" as const,
      reason: `injection expected safe surface, got ${root}`,
    };
  }
  if (category === "unsupported") {
    if (!envelope) {
      return {
        grade: "FAIL" as const,
        reason: "unsupported case missing envelope",
      };
    }
    if (rootExperienceFromOpenUi(envelope.openuiText) === "StatusMessage") {
      return { grade: "PASS" as const };
    }
    return {
      grade: "FAIL" as const,
      reason: "unsupported expected StatusMessage",
    };
  }
  return null;
};

const gradeValidatedEnvelope = (envelope: CompositionEnvelope | null) => {
  if (!envelope) {
    return { grade: "FAIL" as const, reason: "missing complete envelope" };
  }
  const compile = validateCompositionEnvelope({ envelope });
  if (!compile.ok) {
    return { grade: "FAIL" as const, reason: `compiler: ${compile.reason}` };
  }
  for (const record of envelope.records) {
    if (!groundedRecordPrefix.test(record.id)) {
      return {
        grade: "FAIL" as const,
        reason: `unknown record id ${record.id}`,
      };
    }
  }
  return { grade: "PASS" as const };
};

export const gradeQueryMatrixCase = ({
  matrixCase,
  result,
  error,
}: {
  matrixCase: QueryMatrixCase;
  result: ComposeResult | null;
  error: unknown;
}): { grade: MatrixGrade; reason?: string } => {
  if (error !== null && error !== undefined) {
    return gradeError({ error, matrixCase });
  }

  if (!result) {
    return { grade: "FAIL", reason: "missing compose result" };
  }

  if (
    matrixCase.expectTier !== undefined &&
    result.metadata.tier !== matrixCase.expectTier
  ) {
    return {
      grade: "FAIL",
      reason: `expected tier ${matrixCase.expectTier}, got ${result.metadata.tier}`,
    };
  }

  if (result.modelCalls !== 0) {
    return {
      grade: "FAIL",
      reason: `expected zero model calls, got ${result.modelCalls}`,
    };
  }

  const complete = result.events.find((event) => event.type === "complete");
  const envelope = complete?.type === "complete" ? complete.envelope : null;

  const categoryGrade = gradeCategorySurface({
    category: matrixCase.category,
    envelope,
  });
  if (categoryGrade && categoryGrade.grade === "FAIL") {
    return categoryGrade;
  }

  if (matrixCase.requiresValidation === false) {
    return { grade: "PASS" };
  }

  if (!result.metadata.validationOk) {
    return { grade: "FAIL", reason: "validation failed" };
  }

  return gradeValidatedEnvelope(envelope);
};

export const envelopeFromResult = (result: ComposeResult) => {
  const complete = result.events.find((event) => event.type === "complete");
  return complete?.type === "complete"
    ? (complete.envelope as CompositionEnvelope)
    : null;
};
