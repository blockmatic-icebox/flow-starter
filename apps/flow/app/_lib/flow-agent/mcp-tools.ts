export const flowAgentMcpToolNames = [
  "describe_architecture",
  "describe_technologies",
  "describe_capabilities",
  "describe_workflow",
] as const;

export type FlowAgentMcpToolName = (typeof flowAgentMcpToolNames)[number];
