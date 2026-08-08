# Wukong final acceptance state

Updated: 2026-08-08 (V50 native-geometry parchment and real-page acceptance)

## Active scope

- Finish the non-pet Black Myth: Wukong native Codex theme release.
- Pets remain deferred and the gourd remains cancelled; do not edit, package, install, or validate either.
- Preserve the native Codex layout, text, interaction, geometry, and hit targets.
- Never delete local files and never use Computer Use for acceptance.

## Authoritative checkpoint

- Branch: `main`
- V50 starts from pushed checkpoint `fa938cf4d1812929c7245094e2b2cb0c337bc5a2`; local `main` and `origin/main` were equal before this implementation.
- Store package: `OpenAI.Codex 26.715.2305.0`
- ASAR size baseline: `201143773` bytes, matching `docs/native-asar-provenance.json`
- Retained candidate: `0.13.0-20260808-121354`
- The live launch-adapter verifier passes for that retained candidate. Both Start Menu entries point to the same Codex-embedded-Node bridge, the bridge is event-driven and non-PowerShell, and the release marker resolves to the expected append-only app root. The two runtime files previously synchronized into `0.13.0-20260803-191843` were restored byte-for-byte from its installation-time Git checkpoint before release closeout.
- Repository and installed copies have identical current SHA-256 for the changed runtime files: CSS `7A64BF22733B3615E005F49FB1A2B9EEE28DC2F22B5F84E9EE6E181154B0E3D0`; injection plan `5E5A2D36E41682A5A69853C97ADC8417B4CE002A7405040F08997D9B067C506B`.
- Capture script re-resolves the visible native ProseMirror editor, verifies focus without mutating the draft, uses plain `Enter`, and fails closed on missing requested queue/goal state. Its V50 geometry mode temporarily removes only the theme root class, compares native/themed composer and every footer button, and separately requires the four-corner parchment paint to remain.
- Runtime CSS directly targets stable native composer, submit, environment card/row, and explicit sidebar selected attributes. These high-frequency surfaces therefore receive theme paint during the first style calculation after React remount; runtime marker classes remain a fallback for dynamic/contextual surfaces.
- Composer surface, editor shell, editor, footer, buttons, padding, anchors, and responsive dimensions use native geometry without a theme height or spacing exception. The Wukong parchment remains a long rectangle with four 8px corners on a non-interactive pseudo-element inside those exact bounds.
- Thread-footer fade, portal-excluded queue/goal panels, and the production `host -> Motion wrapper -> progress fade` topology have direct first-paint coverage, with marker fallback and forced-colors restoration retained.
- Background scenes are pinned once per renderer and mode. Same-mode task/history/hash changes and streaming text do not switch or decode a scene; landing/thread changes use a 220 ms transition. Hidden documents defer refresh and merge one update on resume.
- Current verification passes: focused runtime/lifecycle/install 45/45, supplemental non-pet ASAR/pixel/scene/native-apply 19/19, and UI material/native-geometry contracts 4/4. Exact staged-content review remains before commit/push.

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

V50 implementation, documentation/source consistency, the real-page technical gate, supplemental non-pet regression, exact staged-content review, commit, and push are complete. At handoff the tracked worktree is clean and local `main` matches `origin/main`. Pets remain deferred and the gourd remains cancelled; do not restart periodic resource sampling or leave a debug host running.
