# Wukong Codex Forge

Windows ChatGPT/Codex 桌面端的本地主题工作台。它采用墨色山海、低饱和玉色与克制金色，提供“启行 / 新建任务”主命令样式、主题配置导入链路和可选的小行者伴随者。

![Theme Studio browser evidence](docs/screenshots/theme-studio.png)

## 已验证能力

- Theme Studio 维护有效主题对象：名称、完整调色板、背景模式/来源/焦点/暗化/任务页强度、无障碍和伴随者字段都会保存到浏览器本地存储，并能导出为可直接通过 validateTheme 的 JSON。
- 导入 JSON 会重新验证完整 schema。导入本地 PNG/JPEG/WebP 会实时应用到预览；本地二进制不会写入 GitHub，导出的 JSON 仅保存其文件名，需在运行时导入步骤再次指定图片。
- 官方来源画廊提供 Game Science、Steam、PlayStation、Xbox 四张可选择卡片、版权提示与直达链接；它们不是图片下载或再分发功能。
- 高可读性预设去除任务页背景、强制高暗化并启用 reduced-motion；reduced-motion 也会停止小行者的轻量待机动画。
- 小行者是本项目的原创生成资产，可关闭、左右放置和调大小。它是 pointer-events none 的静态状态标识，不要求或拦截悬停、点击、输入。

## 配置管线

Theme Studio → 有效 theme.json → scripts/theme.ps1 受控导入 → themes/active.json + 受管背景副本 → injector → CSS variables

注入时读取 themes/active.json，将受管本地背景编码为数据 URL，并生成实际的 --forge-bg、--forge-position、--forge-backdrop-dim、--forge-art-intensity、伴随者尺寸和动效变量。没有导入本地图片时，画廊仍保存来源选择，但不会请求或下载第三方图片。

## Studio

Run npm install, then npm run studio; open http://127.0.0.1:5173/studio/ .

## 安装、导入、应用、恢复

关闭 Codex 后运行 powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1。

从 Studio 导出 JSON 后，把配置和可合法使用的本地背景导入唯一受控目录：

powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\WukongCodexForge\app\scripts\theme.ps1" -Import .\wukong-forge-theme.json -Image .\my-background.jpg

自行以仅回环 CDP 启动官方 Codex，再应用主题：

powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\WukongCodexForge\app\scripts\start.ps1" -Port 9222

运行时仅接受 127.0.0.1 监听器，并检查监听 PID 的可执行路径属于当前注册的 OpenAI.Codex 包。它不会修改 WindowsApps、app.asar、Codex 配置、Wallpaper Engine 或全局系统设置。

CDP 仍允许同一 Windows 用户下的本地进程检查开启调试的应用；不用时执行 restore.ps1 -Port 9222。卸载只会删除精确的 LOCALAPPDATA\WukongCodexForge 管理目录，并在删除前验证路径与状态标记；传入任何其他 -Destination 会拒绝。

## 验证

npm run check 运行 schema、JSON round-trip、受管图片到注入变量、注入选择器范围与卸载路径拒绝测试。

浏览器验收使用 with_server.py 配合 npm run studio 和 node tests/studio.e2e.mjs。它覆盖画廊选择、本地背景/焦点/暗化/任务强度、reduced-motion、伴随者静态可达性、有效 JSON 导出与截图。

## 当前限制

Codex 桌面端 DOM 会随版本改变。本仓库只对明确标记的节点（精确匹配“新建任务”或 “New task”、header、nav、textarea/contenteditable 容器和 role=dialog）施加样式，不使用无约束的全局 button 或类名子串选择器。当前没有针对每个 Codex 版本进行真实运行中注入的视觉认证；若找不到这些节点，运行时会保持功能优先而不会强行覆盖整个界面。

## 素材与许可证

[docs/ASSET_SOURCES.md](docs/ASSET_SOURCES.md) 记录来源与版权边界。仓库未包含任何未经许可的《黑神话：悟空》截图或官方图片二进制。代码以 [MIT](LICENSE) 发布；游戏名称、截图和官方艺术作品属于其权利人。
