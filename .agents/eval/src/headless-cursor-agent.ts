import { spawnSync } from "node:child_process";

import { agentCliVersion } from "./agent.ts";
import type { HostAdapter, HostPreflightResult } from "./host-adapter.ts";

export const headlessCursorAgentAdapter: HostAdapter = {
  id: "headless-cursor-agent",
  preflight: (): HostPreflightResult => {
    const version = agentCliVersion();
    if (!version || version === "unknown") {
      const probe = spawnSync("agent", ["--version"], { encoding: "utf-8" });
      if (probe.status !== 0)
        return {
          blocked: true,
          ok: false,
          reason:
            "Cursor agent CLI unavailable (install agent CLI or run interactive /flow-eval)",
        };
    }
    const resolved = agentCliVersion();
    const modelId = process.env.FLOW_EVAL_MODEL_ID?.trim();
    if (!modelId)
      return {
        blocked: true,
        ok: false,
        reason: "FLOW_EVAL_MODEL_ID required for headless runs",
      };
    return {
      agentCliVersion: resolved,
      host: "cursor",
      modelId,
      ok: true,
    };
  },
};
