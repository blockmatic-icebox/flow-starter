import { createHash } from "node:crypto";

import type { EvalArm } from "./types.ts";

const HASH_LENGTH = 8;
const PG_IDENTIFIER_MAX = 63;
const DATABASE_PREFIX = "flow_eval_";

export type SubjectIdentityInput = {
  arm: EvalArm;
  repetition?: number;
  runId: string;
  scenarioId: string;
  prepareNonce?: string;
  subjectId?: string;
};

export type SubjectIdentity = {
  databaseName: string;
  hash: string;
  productName: string;
  subjectKey: string;
  worktreeName: string;
};

const defaultSubjectId = ({
  arm,
  repetition = 1,
  scenarioId,
}: Pick<SubjectIdentityInput, "arm" | "repetition" | "scenarioId">) =>
  `${arm}:${scenarioId}:${repetition}`;

const identityMaterial = (input: SubjectIdentityInput) => {
  const repetition = input.repetition ?? 1;
  const subjectId = input.subjectId ?? defaultSubjectId(input);
  const parts = [
    input.runId,
    input.arm,
    input.scenarioId,
    String(repetition),
    subjectId,
  ];
  if (input.prepareNonce) parts.push(input.prepareNonce);
  return parts.join(":");
};

export const subjectIdentityHash = (input: SubjectIdentityInput) =>
  createHash("sha256")
    .update(identityMaterial(input))
    .digest("hex")
    .slice(0, HASH_LENGTH);

const assertPgSafeIdentifier = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  if (!/^[a-z][a-z0-9_]*$/u.test(value))
    throw new Error(`subject-identity: invalid ${label} "${value}"`);
  if (value.length > PG_IDENTIFIER_MAX)
    throw new Error(`subject-identity: ${label} exceeds PostgreSQL limit`);
};

export const buildSubjectIdentity = (
  input: SubjectIdentityInput
): SubjectIdentity => {
  const hash = subjectIdentityHash(input);
  const productName = `product-${hash}`;
  const worktreeName = `ws-${hash}`;
  const databaseName = `${DATABASE_PREFIX}${hash}`;
  const subjectKey = input.subjectId ?? defaultSubjectId(input);

  assertPgSafeIdentifier({ label: "databaseName", value: databaseName });

  return {
    databaseName,
    hash,
    productName,
    subjectKey,
    worktreeName,
  };
};

export const isOwnedEvalDatabaseName = (name: string) =>
  /^flow_eval_[a-f0-9]{8}$/u.test(name);

/** @deprecated use buildSubjectIdentity */
export const evalProductName = (input: {
  arm: EvalArm;
  repetition?: number;
  runId: string;
  scenarioId: string;
}) => buildSubjectIdentity(input).productName;
