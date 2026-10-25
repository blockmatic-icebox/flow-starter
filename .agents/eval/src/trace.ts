import type {
  Completeness,
  EvalEvent,
  HarnessKind,
  TokenUsage,
  TurnTermination,
} from "./types.ts";

const MAX_LINE_BYTES = 512_000;

export const PROTOCOL_ID = "cursor-cli-stream-json-2026.10";
export const HOST_SESSION_PROTOCOL_ID = "host-session-v1";

export { SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";

export const isProtocolVerified = ({
  agentCliVersion,
}: {
  agentCliVersion: string;
}) => agentCliVersion.startsWith("2026.10");

const eventIso = () => new Date().toISOString();

const stripEnvFromLine = (obj: Record<string, unknown>) => {
  if (obj.type !== "tool_call" || obj.subtype !== "completed") return obj;
  const { env: _env, ...rest } = obj;
  return rest;
};

const textFromMessage = (message: unknown) => {
  if (!message || typeof message !== "object") return "";
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (c) =>
        c && typeof c === "object" && (c as { type?: string }).type === "text"
    )
    .map((c) => String((c as { text?: string }).text ?? ""))
    .join("");
};

const toolOneofKey = (toolCall: Record<string, unknown> | undefined) => {
  if (!toolCall) return undefined;
  for (const key of [
    "shellToolCall",
    "readToolCall",
    "editToolCall",
    "grepToolCall",
    "deleteToolCall",
    "globToolCall",
    "lsToolCall",
  ])
    if (key in toolCall) return key;
  return undefined;
};

const shellExitFromResult = (result: Record<string, unknown> | undefined) => {
  if (!result) return { exitCode: undefined, output: undefined };
  if (result.success) {
    const s = result.success as Record<string, unknown>;
    const output =
      typeof s.stdout === "string"
        ? s.stdout
        : typeof s.interleavedOutput === "string"
          ? s.interleavedOutput
          : undefined;
    return {
      exitCode: typeof s.exitCode === "number" ? s.exitCode : 0,
      output,
    };
  }
  if (result.failure) {
    const f = result.failure as Record<string, unknown>;
    return {
      exitCode: typeof f.exitCode === "number" ? f.exitCode : 1,
      output: typeof f.stderr === "string" ? f.stderr : undefined,
    };
  }
  if (result.timeout) return { exitCode: 124, output: undefined };
  if (result.rejected || result.spawnError || result.permissionDenied)
    return { exitCode: 1, output: undefined };
  return { exitCode: undefined, output: undefined };
};

const shellFromToolCall = (toolCall: Record<string, unknown> | undefined) => {
  const key = toolOneofKey(toolCall);
  if (key !== "shellToolCall" || !toolCall) return null;
  const shell = toolCall.shellToolCall as Record<string, unknown> | undefined;
  if (!shell) return null;
  const args = shell.args as Record<string, unknown> | undefined;
  const result = shell.result as Record<string, unknown> | undefined;
  const command = typeof args?.command === "string" ? args.command : undefined;
  const { exitCode, output } = shellExitFromResult(result);
  return { command, exitCode, output, args, result };
};

const readPathFromToolCall = (
  toolCall: Record<string, unknown> | undefined
) => {
  const key = toolOneofKey(toolCall);
  if (!key || !toolCall) return undefined;
  const inner = toolCall[key] as Record<string, unknown> | undefined;
  const args = inner?.args as Record<string, unknown> | undefined;
  if (typeof args?.path === "string") return args.path;
  if (Array.isArray(args?.paths) && typeof args.paths[0] === "string")
    return args.paths[0];
  return undefined;
};

type StreamPush = (
  partial: Omit<EvalEvent, "id" | "seq" | "ts" | "scenarioId">
) => void;

type StreamParseState = {
  sawMalformed: boolean;
  sawResultSuccess: boolean;
  sessionId?: string;
  toolCount: number;
  usage?: TokenUsage;
};

const usageFromResultObj = (obj: Record<string, unknown>) => {
  const u = obj.usage as Record<string, unknown> | undefined;
  if (!u) return undefined;
  return {
    cacheReadTokens:
      typeof u.cache_read_tokens === "number" ? u.cache_read_tokens : undefined,
    cacheWriteTokens:
      typeof u.cache_write_tokens === "number"
        ? u.cache_write_tokens
        : undefined,
    inputTokens:
      typeof u.input_tokens === "number" ? u.input_tokens : undefined,
    outputTokens:
      typeof u.output_tokens === "number" ? u.output_tokens : undefined,
  };
};

const handleToolCallLine = ({
  obj,
  push,
  state,
}: {
  obj: Record<string, unknown>;
  push: StreamPush;
  state: StreamParseState;
}) => {
  const type = "tool_call";
  const subtype = typeof obj.subtype === "string" ? obj.subtype : undefined;
  const toolCall = obj.tool_call as Record<string, unknown> | undefined;
  const callId = typeof obj.call_id === "string" ? obj.call_id : undefined;
  const shell = shellFromToolCall(toolCall);
  const readPath = readPathFromToolCall(toolCall);
  const toolKey = toolOneofKey(toolCall);

  if (subtype === "started") {
    state.toolCount += 1;
    push({
      kind: "tool",
      origin: "observed",
      name: toolKey,
      callId,
      phase: "started",
      rawType: type,
      rawSubtype: subtype,
      path: readPath,
      command: shell?.command,
      args: shell?.args as Record<string, unknown> | undefined,
    });
    return;
  }
  if (subtype !== "completed") return;

  push({
    kind: "tool",
    origin: "observed",
    name: toolKey,
    callId,
    phase: "completed",
    rawType: type,
    rawSubtype: subtype,
    path: readPath,
    command: shell?.command,
    exitCode: shell?.exitCode,
    result: shell?.result as Record<string, unknown> | undefined,
  });
  if (!shell?.command) return;
  push({
    kind: "command",
    origin: "observed",
    callId,
    command: shell.command,
    exitCode: shell.exitCode,
    phase:
      shell.exitCode === 0
        ? "succeeded"
        : shell.exitCode === undefined
          ? "unknown"
          : "failed",
    text: shell.output?.slice(0, 4000),
  });
};

const handleResultSuccessLine = ({
  obj,
  push,
  state,
}: {
  obj: Record<string, unknown>;
  push: StreamPush;
  state: StreamParseState;
}) => {
  const type = "result";
  const subtype = "success";
  state.sawResultSuccess = !obj.is_error;
  const usage = usageFromResultObj(obj);
  if (usage) state.usage = usage;
  push({
    kind: "result",
    origin: "observed",
    rawType: type,
    rawSubtype: subtype,
    exitCode: obj.is_error ? 1 : 0,
    text:
      typeof obj.result === "string" ? obj.result.slice(0, 4000) : undefined,
  });
};

const handleChatLine = ({
  obj,
  push,
  type,
}: {
  obj: Record<string, unknown>;
  push: StreamPush;
  type: "user" | "assistant";
}) => {
  if (type === "user") {
    push({
      kind: "user",
      origin: "observed",
      rawType: type,
      text: textFromMessage(obj.message),
    });
    return;
  }
  const text = textFromMessage(obj.message);
  push({ kind: "assistant", origin: "observed", rawType: type, text });
  if (text)
    push({ kind: "assistant", origin: "agent-reported", rawType: type, text });
};

const handleObservedLine = ({
  obj,
  push,
  state,
}: {
  obj: Record<string, unknown>;
  push: StreamPush;
  state: StreamParseState;
}) => {
  const type = String(obj.type ?? "");
  const subtype = typeof obj.subtype === "string" ? obj.subtype : undefined;

  if (type === "system" && subtype === "init") {
    push({
      kind: "system",
      origin: "observed",
      name: "init",
      rawType: type,
      rawSubtype: subtype,
      text: typeof obj.model === "string" ? obj.model : undefined,
    });
    return;
  }
  if (type === "user" || type === "assistant") {
    handleChatLine({ obj, push, type });
    return;
  }
  if (type === "tool_call") {
    handleToolCallLine({ obj, push, state });
    return;
  }
  if (type === "result" && subtype === "success") {
    handleResultSuccessLine({ obj, push, state });
    return;
  }
  if (
    type === "thinking" ||
    type === "interaction_query" ||
    type === "retry" ||
    type === "connection" ||
    (type === "system" && subtype)
  )
    push({
      kind: "system",
      origin: "observed",
      rawType: type,
      rawSubtype: subtype,
      text: typeof obj.text === "string" ? obj.text.slice(0, 500) : undefined,
    });
};

export const parseStreamJsonLines = ({
  raw,
  scenarioId,
  turn,
  startSeq,
}: {
  raw: string;
  scenarioId: string;
  turn: number;
  startSeq: number;
}) => {
  const events: EvalEvent[] = [];
  let seq = startSeq;
  const state: StreamParseState = {
    sawMalformed: false,
    sawResultSuccess: false,
    toolCount: 0,
  };

  const push = (
    partial: Omit<EvalEvent, "id" | "seq" | "ts" | "scenarioId">
  ) => {
    seq += 1;
    events.push({
      ...partial,
      id: `${scenarioId}-e${seq}`,
      scenarioId,
      seq,
      ts: eventIso(),
      turn,
    });
  };

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (Buffer.byteLength(trimmed, "utf-8") > MAX_LINE_BYTES) {
      state.sawMalformed = true;
      push({
        kind: "missing",
        origin: "missing",
        text: "line exceeded max size",
        phase: "failed",
      });
      continue;
    }
    let obj: Record<string, unknown>;
    try {
      obj = stripEnvFromLine(JSON.parse(trimmed) as Record<string, unknown>);
    } catch {
      state.sawMalformed = true;
      push({
        kind: "missing",
        origin: "missing",
        text: trimmed.slice(0, 200),
        phase: "failed",
      });
      continue;
    }

    if (typeof obj.session_id === "string") state.sessionId = obj.session_id;
    handleObservedLine({ obj, push, state });
  }

  return {
    events,
    nextSeq: seq,
    sessionId: state.sessionId,
    toolCount: state.toolCount,
    sawResultSuccess: state.sawResultSuccess,
    sawMalformed: state.sawMalformed,
    usage: state.usage,
  };
};

export const resolveScenarioCompleteness = ({
  events,
  harness,
  oracle,
  official,
}: {
  events: EvalEvent[];
  harness?: HarnessKind;
  oracle?: {
    expectsCommands?: boolean;
    expectsTools?: boolean;
  };
  official: boolean;
}) => {
  if (!official) return "partial" as const;
  return sessionCompletenessFromEvents({
    events,
    hostSession: harness === "host-session",
    oracle,
  });
};

export const foldSessionTelemetry = ({
  sessionCompleteness,
  sessionProtocolVerified,
  termination,
  turnCompleteness,
  turnProtocolVerified,
}: {
  sessionCompleteness: Completeness;
  sessionProtocolVerified: boolean;
  termination: TurnTermination;
  turnCompleteness: Completeness;
  turnProtocolVerified: boolean;
}) => ({
  completeness:
    sessionCompleteness === "partial" ||
    turnCompleteness !== "complete" ||
    termination !== "completed"
      ? ("partial" as const)
      : ("complete" as const),
  protocolVerified: sessionProtocolVerified && turnProtocolVerified,
});

const sessionCompletenessFromEvents = ({
  events,
  hostSession = false,
  oracle,
}: {
  events: EvalEvent[];
  hostSession?: boolean;
  oracle?: {
    expectsCommands?: boolean;
    expectsTools?: boolean;
  };
}) => {
  const turns = [
    ...new Set(
      events
        .map((event) => event.turn)
        .filter((turn): turn is number => turn !== undefined)
    ),
  ];
  if (turns.length === 0) return "partial" as const;
  for (const turn of turns) {
    const turnEvents = events.filter((event) => event.turn === turn);
    const sawMalformed = turnEvents.some((event) => event.kind === "missing");
    const sawResultSuccess = turnEvents.some(
      (event) =>
        event.kind === "result" &&
        event.exitCode !== 1 &&
        event.rawSubtype === "success"
    );
    const toolCount = turnEvents.filter(
      (event) => event.kind === "tool"
    ).length;
    const commandCount = turnEvents.filter(
      (event) => event.kind === "command"
    ).length;
    const turnComplete = hostSession
      ? turnEvents.some((event) => event.kind === "assistant")
      : turnCompleteness({
          commandCount,
          expectsCommands: oracle?.expectsCommands ?? false,
          expectsTools: oracle?.expectsTools ?? false,
          sawMalformed,
          sawResultSuccess,
          termination: sawResultSuccess ? "completed" : "exited",
          toolCount,
        }) === "complete";
    if (!turnComplete) return "partial" as const;
  }
  return "complete" as const;
};

export const turnCompleteness = ({
  termination,
  sawResultSuccess,
  sawMalformed,
  expectsTools,
  expectsCommands,
  toolCount,
  commandCount,
}: {
  termination: TurnTermination;
  sawResultSuccess: boolean;
  sawMalformed: boolean;
  expectsTools: boolean;
  expectsCommands: boolean;
  toolCount: number;
  commandCount: number;
}): Completeness => {
  if (termination !== "completed" || sawMalformed || !sawResultSuccess)
    return "partial";
  if (expectsTools && toolCount === 0) return "partial";
  if (expectsCommands && commandCount === 0) return "partial";
  return "complete";
};
