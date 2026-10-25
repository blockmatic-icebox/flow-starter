import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

import { baselineDevPath, baselinesDir, baselineRunId } from "./paths.ts";

interface BaselineIndex {
  runId: string;
  fileChecksums: { path: string; sha256: string }[];
}

const hashFile = ({ absolutePath }: { absolutePath: string }) =>
  createHash("sha256").update(readFileSync(absolutePath)).digest("hex");

const walkChecksums = ({ dir, rel = "" }: { dir: string; rel?: string }) => {
  const out: { path: string; sha256: string }[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const absolute = path.join(dir, entry);
    const relative = rel ? `${rel}/${entry}` : entry;
    if (statSync(absolute).isDirectory())
      out.push(...walkChecksums({ dir: absolute, rel: relative }));
    else
      out.push({
        path: relative,
        sha256: hashFile({ absolutePath: absolute }),
      });
  }
  return out;
};

const loadBaselineIndex = () => {
  const indexPath = path.join(baselinesDir, "20261024-flow-v0.1.json");
  return JSON.parse(readFileSync(indexPath, "utf-8")) as BaselineIndex & {
    missingEvidence: string[];
  };
};

export const verifyBaselinePreserved = () => {
  const index = loadBaselineIndex();
  if (index.runId !== baselineRunId)
    return { errors: [`unexpected runId ${index.runId}`], ok: false };

  const live = walkChecksums({ dir: baselineDevPath }).toSorted((a, b) =>
    a.path.localeCompare(b.path)
  );
  const expected = index.fileChecksums.toSorted((a, b) =>
    a.path.localeCompare(b.path)
  );

  const errors: string[] = [];
  if (live.length !== expected.length)
    errors.push(`file count ${live.length} !== ${expected.length}`);

  const expectedMap = new Map(expected.map((f) => [f.path, f.sha256]));
  for (const file of live) {
    const want = expectedMap.get(file.path);
    if (!want) errors.push(`unexpected file ${file.path}`);
    else if (want !== file.sha256)
      errors.push(`checksum mismatch ${file.path}`);
  }
  for (const file of expected) {
    if (!live.some((l) => l.path === file.path))
      errors.push(`missing file ${file.path}`);
  }

  return {
    errors,
    missingEvidence: index.missingEvidence,
    ok: errors.length === 0,
  };
};
