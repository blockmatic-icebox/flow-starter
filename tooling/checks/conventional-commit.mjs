/** @typedef {(typeof CONVENTIONAL_COMMIT_TYPES)[number]} ConventionalCommitType */

export const CONVENTIONAL_COMMIT_TYPES = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "docs",
  "test",
  "ci",
  "chore",
  "style",
  "revert",
];

const typePattern = CONVENTIONAL_COMMIT_TYPES.join("|");
const subjectPattern = new RegExp(
  `^(${typePattern})(\\([a-z0-9._/-]+\\))?(!)?: \\S`,
  "u"
);

export const parseCommitSubject = (message) =>
  message.split(/\r?\n/u)[0]?.trim() ?? "";

export const isConventionalCommitSubject = (subject) =>
  subject.length > 0 && subjectPattern.test(subject);

export const formatConventionalCommitHelp = () =>
  `Commit subject must follow Conventional Commits, e.g. feat(web): add triage API

Allowed types: ${CONVENTIONAL_COMMIT_TYPES.join(", ")}
Pattern: <type>(<optional-scope>)?: <description>`;
