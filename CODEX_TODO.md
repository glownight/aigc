# CODEX_TODO

## Rules
- Work one task at a time.
- After finishing a task, update this file before stopping.
- If blocked, mark the task BLOCKED with the blocker.
- Do not touch backend/, deployment/, node_modules/, dist/, or venv/.
- Keep changes small, safe, and buildable.
- For style-focused rounds, do not run build every task; do one final build after several UI rounds.
- On Windows, when final validation is needed, prefer `cmd /c npm run build`; if shell policy blocks it, use `cmd /c npx tsc -b` and mark the exact blocker.
- Commit only if explicitly asked by the orchestrator.
- Non-lock-screen UI must visually align with the lock-screen design language.
- Do not modify lock-screen components unless explicitly asked.

## Design North Star
- Treat lock screen as the visual benchmark.
- Match color mood, transparency, blur, spacing, border softness, glow, depth, and animation tone.
- The goal is not "more flashy"; the goal is "same product, same designer".
- Prefer cohesive premium feel over busy decoration.

## Tasks

### TODO-UI-1 Align ChatHeader with lock-screen visual language
- Scope: `src/components/ChatHeader/*`
- Goal: make the non-lock-screen header feel like it belongs to the same system as the lock screen.
- Acceptance:
  - improved hierarchy, spacing, and material feel
  - style direction clearly matches lock-screen mood
  - no lock-screen files changed
  - do not run build for this task alone
- Status: DONE
- Notes: Reworked ChatHeader markup and added scoped glass, typography, and responsive styling in `src/components/ChatHeader/*`; no build run per task note.

### TODO-UI-2 Align ChatComposer with lock-screen visual language
- Scope: `src/components/ChatComposer/*`
- Goal: make the input area feel premium, calm, and visually consistent with the lock screen.
- Acceptance:
  - input area, buttons, and states feel unified
  - no functionality regression by inspection
  - do not run build for this task alone
- Status: DONE
- Notes: Added scoped glass-panel composer styling and refined `src/components/ChatComposer/*` markup for mono meta text, calmer spacing, and cohesive send/stop hover and focus states; no build run per task note.

### TODO-UI-3 Align ChatMessages with lock-screen visual language
- Scope: `src/components/ChatMessages/*`, `src/MessageContent*`
- Goal: improve message bubbles, spacing, and streaming presentation so they match the lock-screen aesthetic.
- Acceptance:
  - stronger visual consistency with lock-screen tone
  - assistant/user hierarchy remains clear
  - do not run build for this task alone
- Status: DONE
- Notes: Reworked `src/components/ChatMessages/*` and `src/MessageContent*` with scoped glass message surfaces, calmer role/meta hierarchy, restrained assistant/user differentiation, and upgraded streaming/loading/copy presentation; no build run per task note.

### TODO-UI-4 Align ChatSidebar and SettingsModal with lock-screen visual language
- Scope: `src/components/ChatSidebar/*`, `src/components/SettingsModal/*`
- Goal: unify panels/modals with the same material language.
- Acceptance:
  - sidebar and modal surfaces feel related to lock screen
  - spacing and hover/active states improved
  - do not run build for this task alone
- Status: TODO

### TODO-UI-5 Global non-lock-screen polish pass
- Scope: `src/App.css`, `src/index.css`, `src/WorkspaceApp.tsx`, non-lock-screen component styles only
- Goal: smooth out inconsistencies after component-level rounds.
- Acceptance:
  - whole non-lock-screen UI feels cohesive
  - no lock-screen files changed
- Status: TODO

### TODO-VAL-1 Final validation build
- Scope: repo validation only
- Goal: run final build after several UI rounds.
- Acceptance:
  - `cmd /c npm run build` attempted
  - if blocked, fallback validation noted clearly
- Status: TODO

### TODO-SUM-1 Summarize safe-to-keep changes
- Scope: repo notes only
- Goal: produce concise summary of safe UI + code changes.
- Acceptance:
  - names files changed
  - mentions validation result
  - mentions remaining risks
- Status: TODO
