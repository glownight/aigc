# AGENTS.md

## Codex continue workflow

When the orchestrator says `continue`, do this:
1. Read `CODEX_TODO.md`.
2. Pick the first task with `Status: TODO`.
3. Complete only that task.
4. Update the task status in `CODEX_TODO.md` to `DONE` or `BLOCKED`, with short notes.
5. For style-only tasks, skip build unless the TODO explicitly asks for validation.
6. Stop after one task and print a concise summary.

## Constraints
- Work only in this repository.
- Keep changes small and conservative.
- Non-lock-screen UI must visually align with the lock-screen design language.
- Treat lock screen as the aesthetic benchmark, but do not modify lock-screen files unless explicitly told.
- Do not touch `backend/`, `deployment/`, `node_modules/`, `dist/`, or virtual env folders.
- Do not commit unless explicitly told.
- Prefer maintainability and cohesive product feel over flashy changes.
- Read `WORKFLOW.md` before continuing if it exists.
- A round that does not change code or update `CODEX_TODO.md` is considered a failed round unless the TODO explicitly asked for analysis.
