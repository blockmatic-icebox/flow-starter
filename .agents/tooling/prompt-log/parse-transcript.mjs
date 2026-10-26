import { readFileSync } from "node:fs";

const extractUserQuery = (text) => {
  const match = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/u);
  const raw = match ? match[1].trim() : text.trim();
  return raw.replace(/<timestamp>[\s\S]*?<\/timestamp>\s*/u, "").trim();
};

const textFromMessage = (message) => {
  const parts = message?.content ?? [];
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
};

const summarizeAgent = (text) => {
  const withoutSkills =
    text.split(/\n---\n\*\*Skills loaded\*\*/u)[0]?.trim() ?? text;
  const taskReport = withoutSkills.match(/\*\*Task report\*\*[\s\S]*/u)?.[0];
  if (taskReport) {
    const outcome = taskReport.match(/\*\*Outcome\*\*[^\n]*\n+([^\n#]+)/u)?.[1];
    if (outcome) return outcome.trim();
    const firstLine = taskReport
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith("**"));
    if (firstLine) return firstLine.slice(0, 400);
  }
  const line = withoutSkills
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return (line ?? withoutSkills).slice(0, 400);
};

export const parseLastTurnFromTranscript = (transcriptPath) => {
  const lines = readFileSync(transcriptPath, "utf-8")
    .split("\n")
    .filter((line) => line.trim());

  let lastUser = "";
  let lastAssistant = "";
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.type === "turn_ended") continue;
    if (row.role === "user") {
      const text = textFromMessage(row.message);
      if (text) lastUser = extractUserQuery(text);
    }
    if (row.role === "assistant") {
      const text = textFromMessage(row.message);
      if (text && !text.startsWith("[REDACTED]")) lastAssistant = text;
    }
  }

  if (!lastUser) return null;
  return {
    agent: summarizeAgent(
      lastAssistant || "(hook: no assistant text in transcript)"
    ),
    human: lastUser,
  };
};
