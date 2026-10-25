# Security model

**Status:** Current

This document is the security boundary for the starter. [ARCHITECTURE.md](../../../ARCHITECTURE.md) describes the system. [ADR 0011](../decisions/adr/0011-api-and-agent-security-boundaries.md) records the decision. [SECURITY.md](../../../SECURITY.md) is the disclosure policy.

References: [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [OWASP LLM / agentic guidance](https://genai.owasp.org/), and the [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).

## Boundaries

| Boundary | Status | Where |
| --- | --- | --- |
| Untrusted user input | Implemented and tested | JSON schemas for compose and chat. System instructions are server-owned. |
| HTTP request validation | Implemented and tested | `apps/flow/app/_lib/security/read-json-request.ts`. Compose 16 KiB, chat 128 KiB. |
| Rate limiting and cost controls | Implemented and tested | Memory in development. Upstash Redis in production, fail closed. Chat output bound to 800 tokens and 5 steps. |
| Authentication | Selected, not implemented for product users | MCP bearer or explicit public read-only mode is implemented. Better Auth is planned. |
| Authorization and resource ownership | Selected, not implemented | Host-owned action policy is implemented. Tenant and resource checks are the adopter's job. |
| MCP transport and tool permissions | Implemented and tested | Origin and host checks. Development-only unauthenticated access. Four read-only MCP tools (`describe_architecture`, `describe_technologies`, `describe_capabilities`, `describe_workflow`). In-app chat adds bundled knowledge tools; they are not MCP-exposed. |
| Model-generated text and GenUI | Implemented and tested | Compile and validate before emit. Browser revalidates NDJSON. Renderer refuses invalid envelopes. |
| Host-owned actions | Implemented and tested | `ActionSecurityPolicy` on the registration. Invocations cannot clear auth or approval. |
| Database and credential access | Partially implemented | TLS verification stays on in production. No product tables or credential logging. Tenant isolation is not implemented. |
| Logging and observability | Adopter responsibility | Routes return generic public errors. Do not log bearer tokens, Redis tokens, or database URLs. |

## Production configuration

| Variable | Role |
| --- | --- |
| `APP_ORIGIN` | Required in production for MCP. Exact origin, no path or wildcard. |
| `CONSULTANT_MCP_BEARER` | When set, MCP requires this bearer token. Compared with a SHA-256 digest and `timingSafeEqual`. |
| `CONSULTANT_MCP_PUBLIC_READ_ONLY` | Must be `1` to expose MCP in production without a bearer token. Still read-only. |
| `CONSULTANT_MCP_ALLOWED_ORIGINS` | Comma-separated exact origins. `*` is a configuration error. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Required in production before compose, chat, or MCP work. |
| `RATE_LIMIT_TRUSTED_IP_HEADER` | Required in production when rate limits are enforced. Name a header the ingress overwrites so each caller gets an isolated daily quota. Without it, compose and chat return 503 (fail closed). |
| `DATABASE_TLS_INSECURE_LOCAL` | `1` only outside production, and only for a loopback proxy. |

`NODE_ENV=development` may call MCP without a bearer token from loopback or `flow.localhost`. The request hostname is not proof of that environment.

## Threats

| Threat | Control | Limit |
| --- | --- | --- |
| Prompt injection | Injection-shaped queries route to a safe Answer. Executable OpenUI is rejected. | A model can still be persuaded inside its text budget. |
| Unauthorized tool execution | MCP registers four read-only tools. Unknown and mutating names do not run. | Host-only UI actions stay outside the MCP registry. |
| Auth bypass | Production MCP does not treat localhost, a forged Host, or a matching Origin as authentication. | Product login is not built. |
| DNS rebinding | A present Origin must be allowlisted or the response is 403. | Requests without Origin are accepted only after host and auth checks, for native clients. |
| Untrusted forwarded headers | Quota ignores `x-forwarded-for` unless the adopter names a trusted header. | Production without a trusted header fails closed instead of sharing one bucket. |
| Cross-tenant data access | No product tenant model. | Adopters must scope queries by tenant before storing customer data. |
| Secret leakage | Secret-file blocking, staged diff scan, canary, and full checkout scan. | Scanners miss novel secret shapes. The canary proves the installed binary still detects a known fixture. |
| Model cost abuse | Body limits, per-subject daily quotas, separate global cost ceilings, step limit, output-token limit. Production Redis failure returns 503. | Quotas are per trusted subject, not per authenticated user. |
| Dependency compromise | OSV on both lockfiles, `pnpm audit`, pinned GitHub Actions. | Registry outages fail the security job. They are not treated as a clean scan. |
| Malformed or oversized streams | NDJSON line, total size, and event caps. Invalid events never reach the renderer. | A valid but hostile catalog record is still the host's content problem. |

## Not in this baseline

Better Auth, Eve, MCP Apps, a `/dev` workspace, and a production approval workflow are selected directions. They are not implemented here. The GenUI demo and consultant remain unauthenticated examples.
