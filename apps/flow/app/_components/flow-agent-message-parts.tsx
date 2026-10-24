"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/collapsible";
import { Message, MessageContent } from "@repo/ui/components/message";
import { Spinner } from "@repo/ui/components/spinner";
import type { DynamicToolUIPart, ToolUIPart, UIMessage } from "ai";
import { ChevronDownIcon } from "lucide-react";

const toolStateLabel = (
  state: ToolUIPart["state"] | DynamicToolUIPart["state"]
) => {
  if (state === "input-streaming" || state === "input-available")
    return "Running";
  if (state === "output-available") return "Done";
  if (state === "output-error") return "Error";
  return state;
};

const ToolPart = ({ part }: { part: ToolUIPart | DynamicToolUIPart }) => {
  const label =
    part.type === "dynamic-tool"
      ? part.toolName
      : part.type.replace(/^tool-/u, "").replaceAll("_", " ");
  const stateLabel = toolStateLabel(part.state);

  return (
    <Collapsible
      defaultOpen={
        part.state === "output-available" || part.state === "output-error"
      }
      className="rounded-md border px-3 py-2 text-xs"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 font-medium">
        <span className="capitalize">{label}</span>
        <span className="text-muted-foreground flex items-center gap-1">
          {stateLabel}
          {(part.state === "input-streaming" ||
            part.state === "input-available") && <Spinner className="size-3" />}
          <ChevronDownIcon className="size-3" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-muted-foreground mt-2 space-y-2">
        {part.input !== undefined && (
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        )}
        {part.output !== undefined && (
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {typeof part.output === "string"
              ? part.output
              : JSON.stringify(part.output, null, 2)}
          </pre>
        )}
        {part.errorText && <p className="text-destructive">{part.errorText}</p>}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const FlowAgentMessageParts = ({ message }: { message: UIMessage }) => (
  <Message align={message.role === "user" ? "end" : "start"}>
    <MessageContent>
      {message.parts.map((part, index) => {
        if (part.type === "reasoning" || part.type === "reasoning-file")
          return null;
        if (part.type === "text") {
          return (
            <p
              key={`${message.id}-text-${index}`}
              className="whitespace-pre-wrap"
            >
              {part.text}
            </p>
          );
        }
        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          return (
            <ToolPart
              key={`${message.id}-tool-${index}`}
              part={part as ToolUIPart | DynamicToolUIPart}
            />
          );
        }
        return null;
      })}
    </MessageContent>
  </Message>
);
