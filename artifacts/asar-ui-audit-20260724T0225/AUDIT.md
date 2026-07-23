# OpenAI.Codex 26.715.2305.0 renderer UI audit

This is a read-only audit of:

`C:\Program Files\WindowsApps\OpenAI.Codex_26.715.2305.0_x64__2p2nqsd0c76g0\app\resources\app.asar`

No file in `WindowsApps`, `ChatGPT.exe`, or `app.asar` was edited. The extracted
files in this artifact directory are retained inspection copies.

## Source-backed selectors

| Concern | Official renderer evidence | Theme action |
| --- | --- | --- |
| Central opaque surface | `app-shell-CHGA5kyS.js` renders `<main class="... main-surface">`; `app-Dx9fORO1.css` paints `.main-surface` with `--color-token-main-surface-primary` | Clear only `background-color` / `background-image` on `main.main-surface`; preserve radius, shadow, clipping, geometry and hit boxes |
| Decorative top fade | App shell renders `[data-app-shell-main-content-top-fade]` inside the native main-content stack | Clear only the fade paint so it cannot leave an opaque strip over the full-window scene |
| New-task icon | `app-main-B98AP2a1.js` renders the official 56×56 wrapper with `[data-testid="home-icon"]` | Preserve the wrapper and its motion/geometry; hide only the native logo paint and supply one pseudo-element |
| New-task title | `app-main-B98AP2a1.js` renders the headline at `[data-feature="game-source"]`; the hero enters through a 280 ms opacity animation and may mount after initial injection | Preserve the original text node and DOMRect; accept a laid-out node while it is still fading in, render `此去，欲破何局？` through an owned pseudo-element, suppress the nested project-button underline only while active, and restore aria/paint state on disable |

The current landing icon candidate is one horizontal staff with red-gold bands
and three restrained ink tails inside the existing 56×56 slot. It adds no panel,
button, sidebar, footer, bitmap decode or emoji, and remains subject to visual
approval.

## Inspection-copy hashes

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `app-shell-CHGA5kyS.js` | 130,580 | `ADBEE1FA739BA16ABB7C8E61B77AF9CE82C2592C6C88F0D637099F81645B8545` |
| `app-main-B98AP2a1.js` | 844,117 | `7CE06F0AB534FCD9D0DC44EDA09284A296D9B0F9F9B66C7E7CA4825EEBDA5743` |
| `app-Dx9fORO1.css` | 612,683 | `996CCC44D41A2CDD19EAA23C9D2D7C6D1B79CA42DFE183166BD7394DB45C0BD3` |
