# Flow

Flow is a starter for agentic apps where people and agents share actions, context, and persistent state. The repository explorer is its example domain.

Add an entry only when Flow gives a word a project-specific meaning.

## Language

**Repository explorer**: The included example where a person and an agent explore repository architecture and implementation together. _Avoid_: generic agent framework, IDE

**Shared action**: An authorized operation available to both a person through the interface and the agent, with the same rules and outcome. _Avoid_: UI-only handler, agent-only tool

**Workspace**: The place where a person and the agent work on a conversation and its artifact. _Avoid_: app, IDE, page

**Canvas**: The results surface inside the workspace where validated artifacts are shown and updated. _Avoid_: editor, chat

**Artifact**: A validated, source-backed result committed to the canvas. _Avoid_: page, screen

**UI spec**: The validated tree of approved components an artifact may contain. _Avoid_: canvas, artifact

**Selection context**: The objects a person has selected in the current workspace view to give a request its meaning. _Avoid_: durable filters

**Voice**: Spoken conversation inside the workspace that can request the same authorized canvas actions as chat. _Avoid_: dictation, Wispr, ChatGPT Voice app

**External invocation**: An authenticated call from a coding environment or other non-browser client for cited answers and optional validated specs. _Avoid_: MCP server, agent federation
