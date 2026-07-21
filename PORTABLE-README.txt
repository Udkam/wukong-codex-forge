Wukong Codex Forge 0.9.0 - portable use

CURRENT V10 INSTRUCTIONS

1. Keep this extracted directory intact.
2. Double-click start-theme.cmd once. It starts a themed Codex window and safely adapts the user's normal Start Menu ChatGPT shortcut.
3. Later launches from that normal ChatGPT shortcut use this theme automatically while this directory exists.
4. Double-click stop-theme.cmd to restore the open themed renderer to native appearance. No file is deleted.
5. If this extracted theme directory is absent, the retained short launch bridge dynamically starts the current official Store ChatGPT.exe in native mode.

The adapter preserves every prior shortcut in append-only history before changing it. It does not modify ChatGPT.exe, app.asar, WindowsApps, signatures or Codex config.toml. It does not install a service or startup task, and its watcher exits with the managed ChatGPT.exe.
It uses the Node runtime already bundled with the official Microsoft Store Codex package and a dependency-free loopback protocol client; no npm install is required.
Runtime profile, requests and events stay under .wukong-runtime inside this extracted directory. Versioned shortcut backups and bridge scripts stay under %USERPROFILE%\.codex\themes\wukong-codex-forge\history so that no previous content is overwritten or deleted.

Direct execution of the WindowsApps ChatGPT.exe, Store AUMID, protocol links or third-party shortcuts bypasses the safe adapter and launches the official native app.

HISTORICAL 0.8.0 INSTRUCTIONS (retained; superseded above)

1. Keep this extracted directory intact.
2. Double-click start-theme.cmd. It starts Codex and the local theme watcher together.
3. To return the open themed window to native appearance, double-click stop-theme.cmd.
4. Close that Codex window before deleting this extracted directory. A later ordinary Codex launch is native.

The package does not modify ChatGPT.exe, app.asar, WindowsApps, Codex config.toml, or the official Codex shortcut.
It uses the Node runtime already bundled with the official Microsoft Store Codex package and a dependency-free loopback protocol client; no npm install is required.
All runtime state stays under .wukong-runtime inside this extracted directory.
