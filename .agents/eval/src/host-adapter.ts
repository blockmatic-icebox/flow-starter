import type { EvalHost } from "./types.ts";

export type HostPreflightResult =
  | { ok: true; host: EvalHost; modelId?: string; agentCliVersion: string }
  | { ok: false; blocked: true; reason: string };

export type HostAdapter = {
  id: EvalHost | "headless-cursor-agent";
  preflight: () => HostPreflightResult;
};
