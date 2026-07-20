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
| 受管随机回环 CSS | 是 | 是 | 官方文件零写入，可清理，当前采用 |

## 为什么需要受管入口

已经运行的普通 Codex 没有调试通道，外部文件复制无法取得 renderer。强行补丁官方包与“使用成本最优、不得导致崩溃”的要求冲突。安装器因此不强关当前窗口，只创建 `Codex - Wukong Theme`：它启动官方 `ChatGPT.exe`，但为 Chromium web 数据使用主题私有 profile，并把调试端口限制在 `127.0.0.1` 的随机端口。

watcher 只接受 `app://codex/` 或本地开发页目标；WebSocket URL 必须是 loopback。它检查一个 style/runtime probe，缺失时才重新注入；Codex 退出后两次短暂断连即结束。卸载请求先触发 RESTORE_EXPRESSION，再处理磁盘恢复。

## 真实验收边界

- TOML、state、包结构和 fixture 自动测试只能证明交付契约。
- 两张 `runtime-style-*.png` 是生产 DOM 形态 fixture，不是当前 Codex 窗口。
- 当前普通 Codex 进程没有被重启；在从受管入口完成一次真实启动和截图前，生产视觉认证仍为待完成。
- 大版本更新若改变数据属性或多窗口结构，必须重新执行真实截图审计；几何 fallback 不是无限兼容承诺。

## 2026-07-21 生产 UI 与热应用复核

本轮只读检查了已安装包
`C:\Program Files\WindowsApps\OpenAI.Codex_26.715.2305.0_x64__2p2nqsd0c76g0\app\resources\app.asar`，
并将解包副本保留在
`C:\Users\Alex Chen\AppData\Local\Temp\codex-ui-audit-267152305\extracted`。
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

在保留普通 Codex 的同时，受管实例通过 127.0.0.1:60542 完成热应用：

- landing：`surface=landing`、`mode=battle`、场景 0、130 个受管标记。
- thread：`surface=thread`、`mode=scenery`、场景 8、320 个受管标记。
- 全窗背景：`body::before` 实测 `position:fixed; inset:0; background-size:cover`，覆盖 2050 × 1106 视口。
- thread 实测：侧栏 275 px、composer 736 × 98 px、环境卡 300 px；助手回答背景保持透明。
- 真实截图保留在 `docs/logs/live-codex-theme-0.7.0.png` 与
  `docs/logs/live-codex-theme-thread-0.7.0.png`，它们是本机审计件，不作为测试网页冒充生产结果。

因此本节取代上文“生产视觉认证仍待完成”的历史状态；上文保留用于解释路线演变。
