# Flow voice surfaces

**Research date:** 2026-10-17

**Last reviewed:** 2026-10-24

**Status:** Historical

> Historical research note. Some integration recommendations below refer to json-render and a prospective workspace architecture. Current accepted GenUI direction uses OpenUI Lang, as documented in [ADR 003](../adr/0003-genui-openui-foundation.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md). Treat this note as source evidence, not current implementation instructions.

> Dated primary-source research (October 17, 2026). Not the product decision. See [ADR 004](../adr/0004-voice-delegates-to-eve.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md) §7.

Research date: October 17, 2026. Primary-source review; no packages installed or integrations executed. Voice is included in Flow's defined product. This note distinguishes upstream capabilities from the integration Flow still needs to build.

## Recommendation

Keep one eve agent responsible for grounded answers, validated json-render specs, and authorized canvas actions. Add voice as another input/output surface inside `/dev`, alongside text and direct controls. Start from the official eve voice template's delegation approach, adapting its small voice layer to Flow rather than replacing the application with another template. External coding-agent requests remain authenticated, read-only answers/specs; speaking inside the authenticated workspace can use its existing canvas capabilities.

This is an architectural recommendation, not a claim that Flow's complete stack has been validated together. The voice frontend introduces a speech model, but must not introduce a second domain executor or a separate source of canvas truth.

## Verified upstream capabilities

### eve provides a relevant voice template

The official template connects browser `useRealtime` to GPT-Live-1 through AI Gateway using WebSocket. A `VoiceDelegate` sends substantive work to `useEveAgent`; eve handles tools and durable agent state. The server mints a single-use client secret. This directly supports separating speech from task execution. Its production mode uses Better Auth with Vercel sign-in; starter mode uses a shared password. Neither is Flow's required GitHub-only configuration.

The documented Gateway path does **not** support WebRTC, hosted Responses delegation, or live session updates. It requires an AI Gateway API key, not OIDC. The template's call limit is enforced in the browser; calls are not persisted, and each call starts a new eve session. Therefore existing-conversation continuity, server-enforced usage controls, and Flow authorization need explicit adaptation. The README was retrieved; the referenced delegation implementation could not be fetched in this review. [Official template and limitations](https://eve.dev/templates/eve-voice-template), [upstream README](https://github.com/vercel/eve/blob/main/apps/templates/eve-voice-template/README.md).

### Builder.io Agent-Native includes real voice behavior

Builder's checked-in voice guide describes two modes: editable dictation and full-duplex OpenAI Realtime speech over WebRTC. Realtime calls cross an authenticated bridge into its guarded `executeAgentToolCall` executor. The guide names server session/action routes and client lifecycle hooks, and requires completed transcripts to remain associated with the captured chat thread. This is framework functionality, not merely a conceptual pattern.

However, those documented components depend on Builder's executor, session context, application state, and provider resolution. No reviewed source establishes that copying them into Next.js + eve + Better Auth + json-render works without adaptation. Treat Builder as a reference for interaction and execution boundaries; adopting its runtime is a separate architectural decision. The guide was retrieved, but the referenced implementation files were unavailable through the research fetcher. [Builder voice guide](https://github.com/BuilderIO/agent-native/blob/main/.agents/skills/voice-transcription/SKILL.md).

### Direct OpenAI Realtime is an alternative transport

OpenAI documents browser WebRTC with a server-side WebSocket attached to the same session. The server can control the session and handle private tools. This makes a speech-to-eve adapter feasible in principle; it does not provide Flow's authorization or action implementation. A direct Realtime implementation must choose a single executor for each tool event and verify the hosting lifetime of any server connection. Do not mix Realtime call IDs/events with the separate GPT-Live API or assume the Gateway template supports WebRTC. [OpenAI server-side controls](https://developers.openai.com/api/docs/guides/voice-server-controls?api=realtime&voice-api=realtime).

### Dictation and audio components are not conversational voice

Wispr Flow is a dictation application that works in other applications and websites; it can fill Flow's normal composer without becoming Flow's agent runtime. That is distinct from OpenAI Whisper transcription and from spoken conversational responses. The reviewed Wispr page does not establish an embeddable integration contract. [Wispr for developers](https://wisprflow.ai/developers).

AI Elements offers `SpeechInput` for transcription, with browser speech recognition and a MediaRecorder fallback requiring an application transcription callback. `AudioPlayer` supplies playback UI. These components are useful selectively, but do not supply session orchestration, authorization, delegation, or shared canvas state. Provider credentials must remain on Flow's server. [Speech Input](https://elements.ai-sdk.dev/components/speech-input), [Audio Player](https://elements.ai-sdk.dev/components/audio-player).

## Integration spike gates

These are proposed Flow acceptance checks, not verified upstream guarantees:

1. Pin compatible eve, AI SDK, and voice dependencies in the existing monorepo. Demonstrate text and voice invoking the same grounded agent without migrating the app scaffold.
2. Protect voice-secret issuance and eve requests with Flow's GitHub Better Auth session. Reject cross-user conversation/artifact IDs, expired sessions, and disabled `/dev` access. Prove server-enforced usage controls rather than relying on a browser timer.
3. Bind voice to the currently selected `/dev` conversation and canvas. Preserve authoritative text/history and artifacts after ending voice or reloading; audio transport itself need not resume.
4. Speak a request that generates a cited diagram, then change its view by voice and by direct UI. Verify schema validation, ownership, version checks, and idempotency use the same action path.
5. Test interruption during speech and during an eve action, duplicate delegation events, disconnect, late results, and text/voice overlap. Cancellation must not silently undo committed work or let stale output overwrite newer state.
6. Keep spoken claims grounded in eve results and show full citations in chat. Surface unavailable evidence honestly. Do not persist raw microphone audio by default.
7. Verify the chosen transport on Vercel and supported browsers, including denied microphone access, usage limits, cleanup, and return to text. If selecting direct Realtime instead, additionally prove server connection lifetime and sideband recovery before committing to that topology.

Passing these gates establishes Flow compatibility; upstream demos alone do not.
