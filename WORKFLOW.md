# WORKFLOW.md

## Goal
Make Codex work continuously on the non-lock-screen UI until the TODO list is exhausted or the orchestrator changes direction.

## Operating model
- Codex works in short single-task rounds.
- State lives in `CODEX_TODO.md`, not in chat memory.
- The orchestrator must immediately inspect and relaunch after each round.
- If there is no running Codex worker and unfinished TODO items remain, that is an error condition.

## Continuous run rules
1. Read `CODEX_TODO.md`.
2. If any task is still `Status: TODO`, there should normally be an active Codex worker.
3. If there is no active worker while TODO items remain, immediately start the next round.
4. A finished round must leave one of these outcomes:
   - task marked `DONE`
   - task marked `BLOCKED` with a concrete blocker
   - explicit note explaining why no code change was made
5. Analysis-only rounds are not acceptable unless the TODO explicitly asks for analysis.

## Failure handling
Treat these as anomalies:
- worker exited and no new worker was started
- `CODEX_TODO.md` did not change after a claimed work round
- no relevant file diff after a claimed implementation round
- repeated stalls on the same task

When an anomaly happens:
1. inspect task status
2. inspect relevant diffs
3. restart a new Codex round with a stricter prompt
4. if repeated twice, narrow the task scope further

## Prompt quality rules
Every Codex round should include:
- exact TODO item to complete
- exact file scope
- explicit aesthetic or engineering goal
- what not to touch
- requirement to update `CODEX_TODO.md`
- requirement to stop after one task

## UI north star
For this repo, non-lock-screen UI must align with lock-screen visual language:
- same product feel
- same designer feel
- premium restraint
- soft glass / blur / glow
- cohesive spacing, hierarchy, border softness, and depth

## Validation policy
- Do not run build on every style-only round.
- After several UI rounds, do one final validation round.
- On Windows prefer `cmd /c npm run build`; if blocked, use `cmd /c npx tsc -b` and record the blocker.
