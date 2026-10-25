# Security policy

Flow Starter is a maintained baseline on the `main` branch. Adopters who fork it choose which versions of their own product they support. This repository does not publish a long-term support schedule for downstream applications.

## Reporting a vulnerability

Do not publish exploit details, proofs of concept, or reproduction steps in a public issue or pull request.

GitHub private vulnerability reporting is **not** enabled on this repository. Report a vulnerability through a private channel the maintainer provides, or ask the maintainer to enable private reporting before sending details. Do not send secrets or live credentials with the report.

Adopters should enable [private vulnerability reporting](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on their own forks when they want that workflow.

## What this repository checks

On pull requests and on pushes to `main`, the CI and security workflows run deterministic checks:

- Unit, script, architecture, documentation, and offline GenUI tests.
- Browser tests that do not use production database credentials or model API keys.
- A secret-scanner canary, a full secret scan of the checkout, OSV lockfile scans, and `pnpm audit`.
- A pre-commit gate that blocks secret files and scans the staged diff.

These checks are described in [the security model](.agents/flow/security/security-model.md) and [ADR 0011](.agents/flow/decisions/adr/0011-api-and-agent-security-boundaries.md).

## What adopters still own

- Identity, sessions, and resource authorization.
- Tenant isolation and product data.
- Production secrets, ingress trust, and deployment configuration.
- Enabling MCP public access or a bearer token deliberately.
- Reviewing dependencies and responding to advisories after they fork.

## Disclaimer

Passing this starter's checks is not a production security certification, penetration test, or compliance attestation. The demos are intentionally unauthenticated. Production MCP and rate limits fail closed until the adopter configures them.
