# Wukong final acceptance state

Updated: 2026-08-08 (V50.1 Store relay lifecycle hotfix)

## Active scope

- Finish the non-pet Black Myth: Wukong native Codex theme release.
- Pets remain deferred and the gourd remains cancelled; do not edit, package, install, or validate either.
- Preserve the native Codex layout, text, interaction, geometry, and hit targets.
- Never delete local files and never use Computer Use for acceptance.

## Authoritative checkpoint

- Branch: `main`
- V50.1 starts from pushed checkpoint `c7dab122783c0a776f937d9dd0bfbb1b684a6664`; local `main` and `origin/main` were equal before this hotfix.
- Store package: `OpenAI.Codex 26.715.2305.0`
- ASAR size baseline: `201143773` bytes, matching `docs/native-asar-provenance.json`
- Retained candidate: `0.13.0-20260808-171808`
- The live launch-adapter verifier passes for that retained candidate. Both Start Menu entries point to the same Codex-embedded-Node bridge, the bridge is event-driven and non-PowerShell, and the release marker resolves to the expected append-only app root. Older releases and both prior shortcuts were retained; the pet installer returned before changing any pet state.
- Repository and installed copies have identical SHA-256 for the changed event host: `669E52D2774527EBA397FB27905790AAC19E08A8E23DF5E8D761D6E1DA8F8E83`.
- Root cause: Store launch PID `10564` and host PID `15988` exited after the 17:08 launch while the real ChatGPT renderer continued on port `12906`. The lifecycle had incorrectly equated the Store relay PID with browser ownership, so it never applied the theme.
- The host now uses the profile-scoped loopback DevTools port plus browser identity as ownership. A Store relay exit cannot terminate startup or the event watcher; an orphaned live Codex target can be reattached; a closed browser channel gets only a four-second bounded reconnect grace before host exit. No WMI/CIM or fixed target polling was added.
- Capture script re-resolves the visible native ProseMirror editor, verifies focus without mutating the draft, uses plain `Enter`, and fails closed on missing requested queue/goal state. Its V50 geometry mode temporarily removes only the theme root class, compares native/themed composer and every footer button, and separately requires the four-corner parchment paint to remain.
- Runtime CSS directly targets stable native composer, submit, environment card/row, and explicit sidebar selected attributes. These high-frequency surfaces therefore receive theme paint during the first style calculation after React remount; runtime marker classes remain a fallback for dynamic/contextual surfaces.
- Composer surface, editor shell, editor, footer, buttons, padding, anchors, and responsive dimensions use native geometry without a theme height or spacing exception. The Wukong parchment remains a long rectangle with four 8px corners on a non-interactive pseudo-element inside those exact bounds.
- Thread-footer fade, portal-excluded queue/goal panels, and the production `host -> Motion wrapper -> progress fade` topology have direct first-paint coverage, with marker fallback and forced-colors restoration retained.
- Background scenes are pinned once per renderer and mode. Same-mode task/history/hash changes and streaming text do not switch or decode a scene; landing/thread changes use a 220 ms transition. Hidden documents defer refresh and merge one update on resume.
- Current hotfix verification passes: event-host tests 9/9, focused lifecycle/install/package tests 26/26, native theme validation, and the complete repository test command with 78 passed, 9 contractually skipped, 0 failed. The two initially failing historical V12 assertions were confirmed as 2026-07-23 hard-coded 6/5 scene IDs that had drifted from the current 4/5 active payload; the historical test now derives both pools from the packaged CSS variables and passes without changing runtime behavior. Exact staged-content review passed, and implementation commit `d8d75bc` was pushed to `origin/main`.

## V50.1 live lifecycle proof

The new release reattached to the already-running real Codex target without restarting the app. Event records progressed through `reattaching-event-host -> renderer-found -> renderer-settling -> renderer-applying -> renderer-verified -> watching-event-driven` on port `12906`, with one target. A one-shot CDP proof returned `active=true`, injected style present, runtime V13 active, background ready, composer `736×98px`, editor `712×44px`, and the four-corner parchment pseudo-element present with `pointer-events:none`.

## Real-page release gate

Completed in one transient retained-release instance. The real complete page shows all of these in the same selected task state:

- native top bar and sidebar;
- themed workspace/background;
- at least one real queued message plus the active goal;
- themed composer;
- unified 300px environment card.

The capture was `2050×1106 @ 125%`. Native and themed composer surfaces were both `736×98px`; editor shell and editor were both `712×44px`. The surface, editor shell, editor, footer, and all six native footer buttons had maximum DOMRect delta `0`; button identities and layout properties matched, while the four-corner parchment remained. The thread-footer fade had no background image and zero opacity. The screenshot and raw report remain local because they contain workspace information. Screenshot SHA-256: `4FF7F5B276BFC46E3DB9AB944E9CCA145354D88141BA5D0027ADC1A37D9EA92F`; report SHA-256: `E72AC6F3B6FD1E07D21FCFB35A595D5CB539DE72F35E8EE064EA99A1E3FBF376`.

Cleanup recorded native restoration and watcher confirmation, then released the exact root and host. The CDP endpoint no longer accepts connections and the port has no LISTENING socket; only normal TCP TIME_WAIT records remained immediately after close.

## Completion boundary

V50 visual implementation and the prior real-page technical gate remain complete. V50.1 lifecycle code, tests, retained install, adapter verification, live reattachment, broader regression, exact staged-content review, implementation commit, and push are complete. Pets remain deferred and the gourd remains cancelled; do not restart periodic resource sampling. The single event host attached to the user's current themed Codex window is intentional runtime ownership, not a transient debug host.
