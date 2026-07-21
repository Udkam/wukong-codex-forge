# Codex 样式运行时调查

## 结论

Windows Codex 26.715.2305.0 的原生 Chrome Theme 只能表达颜色、字体和语义色，不能表达背景图、组件切角或 landing/thread 状态。外部修改 `config.toml` 也不会让已打开窗口热加载。因此“深度样式替换”需要受控运行时 CSS；只放置原生主题文件只能得到用户已否决的颜色变化。

## 已确认的本机边界

1. `desktop.appearance*ChromeTheme` 支持 accent、contrast、ink、surface、opaqueWindows、fonts 和 semanticColors，不支持 backgroundImage/customCss/companion。
2. `codex://codex-app/apply-config` 只处理远程连接配置，不刷新桌面外观。
3. 当前主进程没有对外部 `config.toml` 写入的外观 watcher。
4. 已安装 Chromium 150 会忽略默认用户数据目录上的远程调试参数；受管隔离 profile 可建立随机回环调试通道。
5. 当前生产 renderer 暴露 conversation/composer/message/new-chat 数据属性，可避免依赖哈希 class。

## 路线比较

| 路线 | 背景/组件样式 | 当前窗口热清理 | 风险结论 |
| --- | --- | --- | --- |
| 只写原生配置 | 否，只能换色 | 否 | 稳定但不满足需求 |
| 修改 `app.asar`/WindowsApps | 是 | 需重启 | 破坏签名与更新，不采用 |
| 任意进程注入 | 是 | 理论可行 | 崩溃与安全风险高，不采用 |
| 目录内随机回环 CSS | 是 | 是 | 官方文件零写入，可验证清理，当前采用 |

## 为什么需要主题入口

已经运行的普通 Codex 没有调试通道，外部文件复制无法取得 renderer。强行补丁官方包与“使用成本最优、不得导致崩溃”的要求冲突。0.8.0 因此使用包内 `start-theme.cmd`：它启动官方 `ChatGPT.exe`，为 Chromium web 数据使用解压目录内 `.wukong-runtime\profile`，并把调试端口限制在 `127.0.0.1` 的随机端口。没有开始菜单快捷方式、系统服务或开机项。

watcher 默认只接受 `app://codex/` 或标题为 Codex 的精确 `app://-/index.html` renderer；localhost 仅在显式开发开关下允许。调试协议 URL 必须是 loopback。它使用 Codex 包内 Node 24 和仅依赖 Node 核心模块的原始协议客户端，不携带 `node_modules`、第三方 WebSocket 包或运行时 npm 依赖。它检查 V9 style/runtime probe，缺失时才重新注入；Codex 退出后结束。停用请求先触发 `RESTORE_EXPRESSION`，随后重新读取 renderer state；style、class、标记、状态属性和 V4–V9 runtime 全部清空后才确认成功。

Chromium 的随机调试端口可能早于首个 Codex 页面 target 可用。启动器因此在端口验证后提供最多 20 秒、每 350 ms 一次的有界首次生效复核；只有 `--apply` 已读取 V9 state 并确认完整主题生效，才记录 `watching` 并进入低频 watcher。这个门槛避免“窗口已开但主题尚未进入 renderer”的假成功。

V9 页面运行时只安装一个 `childList` 结构观察器，忽略属性、文字、滚动、逐字输入和焦点变化；只有新增/移除节点命中对话、输入器或浮层选择器时才进入刷新调度。侧栏/提交动作与窗口尺寸变化同样走至少 650 ms 的合并节流，提交与导航只安排有限次复核。这避免长任务的逐字流式变化把页面扫描变成常驻负载，同时仍能识别新出现的原生对话结构。

## 真实验收边界

- TOML、state、包结构和 fixture 自动测试只能证明交付契约。
- 两张 `runtime-style-*.png` 是生产 DOM 形态 fixture，不是当前 Codex 窗口。
- 历史阶段的普通 Codex 进程没有被重启；下方 2026-07-21 复核已用独立受管实例完成生产视觉认证。
- 大版本更新若改变数据属性或多窗口结构，必须重新执行真实截图审计；几何 fallback 不是无限兼容承诺。

## 2026-07-21 生产 UI 与热应用复核

本轮只读检查了已安装包
`C:\Program Files\WindowsApps\OpenAI.Codex_26.715.2305.0_x64__2p2nqsd0c76g0\app\resources\app.asar`，
并将选定 UI 文件的只读解包副本保留在
`E:\Proj\wukong-codex-forge\tmp\codex-ui-audit-20260721-082644`。
没有改写 WindowsApps、`app.asar`、`ChatGPT.exe` 或官方快捷方式。

从官方 CSS 与真实 DOM 得到的当前基线如下：

- 应用菜单栏 36 px；任务工具栏 46 px。
- 左侧原生面板默认 275 px，官方约束为 240–520 px。
- 对话内容最大宽度 48 rem，左右各 16 px 内边距；当前输入框实测 736 × 98 px、25 px 圆角。
- 环境信息是 300 px 浮动卡片，不是固定第三栏。
- 助手最终回答节点为 `[data-local-conversation-final-assistant]`，原生没有消息框。
- composer 外层定位锚点是 `[data-thread-find-composer="true"]`，实际可着色表面是 `.composer-surface-chrome`。

真实生产 renderer 的当前 URL 是 `app://-/index.html`，不是早期调查中的
`app://codex/`。旧目标白名单因此会漏掉真实窗口；`runtime/cdp-client.mjs`
已改为只接受 `type=page`、标题 `Codex` 且 URL 为当前精确地址或已知官方地址。

在保留普通 Codex 的同时，最终便携实例通过当次随机回环端口 18982 完成热应用：

- landing：`surface=landing`、`mode=battle`、场景 0、131 个含根样式类的受管元素；标题来自当前生产节点 `[data-feature="game-source"]`。
- thread：`surface=thread`、`mode=scenery`、场景 8、386 个含根样式类的受管元素；助手回答 computed style 为透明背景、无阴影、0 px 圆角。
- 全窗背景：`body::before` 实测 `position:fixed; inset:0; background-size:cover`，覆盖 2050 × 1106 视口。
- 两种页面实测均为侧栏 275 px、composer 736 × 98 px；thread 右侧浮层宿主 316 px，其中包含官方 300 px 环境卡。
- 0.8.0 最终安装版真实截图保留在 `docs/screenshots/live-codex-v9-installed-landing.png` 与包含对话正文的 `docs/screenshots/live-codex-v9-installed-thread-content.png`，对应 JSON 记录同名状态、几何与 computed style；它们来自 append-only 正式发布 `0.8.0-20260721-105715`，不把 fixture 冒充生产结果。
- 11 张背景只编码一次，主题变量为 3,654,150 字符，完整 style 为 3,670,925 字符。
- 同一 renderer、同一 landing 页分别稳定 3 秒后采样 6 秒：原生约 3.90% 单核，V9 主题约 1.82% 单核。该差值处于系统调度噪声内，没有测得主题常驻增量；冷启动与正在运行的长任务页面曾短时占用较高，不能归因给主题。

因此本节取代上文“生产视觉认证仍待完成”的历史状态；上文保留用于解释路线演变。

真实截图复核使用 append-only release `0.8.0-20260721-110648`。受管窗口根进程 40840 在端口 41310 上先热恢复到 V4–V9 全空的原生状态，再由该 release 复用同一进程；启动事件只在 `--apply` 回读 V9 成功后记录 `watching`。thread 为 `scenery/scene 8`、468 个受管标记，assistant computed style 为透明背景、无阴影、0 px 圆角；随后 landing 为 `battle/scene 2`、131 个标记。两页都保持 275 px 侧栏与 736 × 98 px composer，背景为单层 embedded JPEG 且 `background-size: cover`。可提交证据为 `docs/screenshots/live-codex-v9-final-thread.*` 与 `docs/screenshots/live-codex-v9-final-landing.*`；带时间戳审计件继续保留在本地 `docs/logs/`。

最终交付 release 为 `0.8.0-20260721-113129`。它与上述截图版的 `forge-theme.css`、`injection-plan.mjs` 和 `active.json` SHA-256 完全一致，只在启动器增加主题根目录重解析点拒绝。相同进程 40840 再次通过原生全空验证后热应用到 `battle/scene 0`、130 个受管标记，V9 与小悟空/小八戒/湘妃葫芦三项安全位均为 true；普通 Codex 根进程 9896 在整个受管切换中保持运行且未被触碰。
