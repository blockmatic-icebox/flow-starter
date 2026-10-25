/** Deterministic author for evaluator-owned baseline commits (never global git config). */
export const EVALUATOR_GIT_AUTHOR_NAME = "Flow Factory Evaluator";
export const EVALUATOR_GIT_AUTHOR_EMAIL = "flow-eval@factory.local";

export const evaluatorGitConfig = () => ({
  "user.email": EVALUATOR_GIT_AUTHOR_EMAIL,
  "user.name": EVALUATOR_GIT_AUTHOR_NAME,
});
