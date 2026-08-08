# Wukong final acceptance state

Updated: 2026-08-08 (V48 lifecycle audit)

## Active scope

- Finish the non-pet Black Myth: Wukong native Codex theme release.
- Pets remain deferred and the gourd remains cancelled; do not edit, package, install, or validate either.
- Preserve the native Codex layout, text, interaction, geometry, and hit targets.
- Never delete local files and never use Computer Use for acceptance.

## Authoritative checkpoint

- Branch: `main`
- Last pushed checkpoint before this V48 note: `54aefc43ca5a7330fb2b9ab4d4b2f4da4de33f4d`; local `main` and `origin/main` were equal after the successful push.
- Store package: `OpenAI.Codex 26.715.2305.0`
- ASAR size baseline: `201143773` bytes, matching `docs/native-asar-provenance.json`
- Retained candidate: `0.13.0-20260803-191843`
- The live launch-adapter verifier passes for that retained candidate. Both Start Menu entries point to the same Codex-embedded-Node bridge, the bridge is event-driven and non-PowerShell, and the release marker resolves to the expected append-only app root.
- Repository and installed copies have identical SHA-256 for `runtime/host.mjs`, `runtime/injection-plan-v13.mjs`, `runtime/forge-background-v13.css`, `themes/active.json`, `themes/native-wukong.json`, and `pets/release-policy.json`.
- Capture script uses a focused native ProseMirror editor and plain `Enter`, then fails closed unless the input clears and a real `.forge-composer-queue-item` appears.
- Targeted syntax and lifecycle checks pass: `node --check scripts/capture-live-playwright.mjs`; `node --test tests/lifecycle-contract.test.mjs` (13/13).

## Remaining release gate

Obtain one real, complete Codex page showing all of these in the same selected task state:

- native top bar and sidebar;
- themed workspace/background;
- at least one real queued message plus the active goal;
- themed composer;
- unified 300px environment card.

Fixture or component-only screenshots do not close this gate. The capture must use one transient retained-release window, close it immediately after success or failure, and prove exact root PID, owner PID, and loopback port release.

Only after that visual gate passes, re-run the non-PowerShell launch-adapter, native-restore, preserving-install, and documentation audit.

## Resource gate and next batch

The 2026-08-08 V48 resume sample was still red: CPU was `95.0%` and then `95.3%`, available RAM was `15.58 GB` and then `14.58 GB`, and disk queue was `0.0` and then `1.0`. No project-owned Codex, Node, watcher, or listener remained, so no debug window or test runner was started.

Next batch:

1. Sample CPU, available RAM, and disk queue again.
2. Proceed only after consecutive green samples (`CPU < 70%`, `RAM >= 12 GB`, queue `< 1.0`).
3. Start exactly one portable retained-release host, capture the combined full page, then immediately verify cleanup.
4. If capture succeeds, inspect the full screenshot from disk and continue the lifecycle/native-restore/documentation audit.
