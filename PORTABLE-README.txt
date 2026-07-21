Wukong Codex Forge 0.8.0 - portable use

1. Keep this extracted directory intact.
2. Double-click start-theme.cmd. It starts Codex and the local theme watcher together.
3. To return the open themed window to native appearance, double-click stop-theme.cmd.
4. Close that Codex window before deleting this extracted directory. A later ordinary Codex launch is native.

The package does not modify ChatGPT.exe, app.asar, WindowsApps, Codex config.toml, or the official Codex shortcut.
It uses the Node runtime already bundled with the official Microsoft Store Codex package and a dependency-free loopback protocol client; no npm install is required.
All runtime state stays under .wukong-runtime inside this extracted directory.
