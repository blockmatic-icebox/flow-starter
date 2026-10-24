import { z } from "zod";

/** Privileged actions never deserialized from model output — registered by the host app. */
export const registeredActionKinds = [
  "navigate",
  "ui-state",
  "filter",
  "sort",
  "submit-form",
  "agent-follow-up",
  "server-tool",
] as const;

export type RegisteredActionKind = (typeof registeredActionKinds)[number];

export const actionInvocationSchema = z.object({
  actionId: z.string().min(1),
  input: z.record(z.string(), z.unknown()).default({}),
  requiresApproval: z.boolean().default(false),
  requiresAuth: z.boolean().default(true),
});

export type ActionInvocation = z.infer<typeof actionInvocationSchema>;

export interface RegisteredAction {
  description: string;
  id: string;
  inputSchema: z.ZodType;
  kind: RegisteredActionKind;
}

export type ActionExecutor = (input: {
  action: RegisteredAction;
  invocation: ActionInvocation;
  principal: { userId: string | null };
}) => Promise<{ ok: true } | { ok: false; code: string }>;

export const createActionRegistry = () => {
  const actions = new Map<string, RegisteredAction>();
  return {
    get: (id: string) => actions.get(id),
    list: () => [...actions.values()],
    register: (action: RegisteredAction) => {
      if (actions.has(action.id))
        throw new Error(`duplicate-action:${action.id}`);
      actions.set(action.id, action);
    },
  };
};

export const validateActionInvocation = ({
  invocation,
  registry,
}: {
  invocation: unknown;
  registry: ReturnType<typeof createActionRegistry>;
}) => {
  const parsed = actionInvocationSchema.safeParse(invocation);
  if (!parsed.success)
    return { code: "invalid_invocation", ok: false as const };
  const action = registry.get(parsed.data.actionId);
  if (!action) return { code: "unknown_action", ok: false as const };
  const input = action.inputSchema.safeParse(parsed.data.input);
  if (!input.success)
    return { code: "invalid_action_input", ok: false as const };
  return {
    action,
    input: input.data,
    invocation: parsed.data,
    ok: true as const,
  };
};
