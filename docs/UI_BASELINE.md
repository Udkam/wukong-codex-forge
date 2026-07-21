# Codex 26.715.2305.0 原生 UI 基线

## 审计方式

- 2026-07-21 只读检查本机 Microsoft Store 包：`C:\Program Files\WindowsApps\OpenAI.Codex_26.715.2305.0_x64__2p2nqsd0c76g0`。
- UI 来源是 `app\resources\app.asar` 内的 `webview/index.html` 与打包 CSS/JS；只把检查副本展开到项目的只读临时工作目录，没有修改 `WindowsApps`、`app.asar`、`ChatGPT.exe` 或签名文件。
- 本轮没有使用 computer use，也没有用视觉点击推测 DOM。仓库保留的只读摘录位于 `docs/logs/asar-inspect/`。

## 原生结构合同

| 区域 | 原生证据 | 复刻合同 |
| --- | --- | --- |
| 窗口根 | `html`、`body`、`#root` 均为 100% 宽高且无 margin | fixture 以 1600 × 900 固定视口验证，不添加外层主题节点 |
| 左侧栏 | `aside.app-shell-left-panel`；浮动态为 `aside[data-testid="app-shell-floating-left-panel"]` | 默认 275 px，允许宿主自身 240–520 px 调节；主题不改宽度 |
| 主工作区 | `<main class="... main-surface">` 与 `[data-app-shell-main-content-layout]` | 只清除承载层的不透明底色，不改 grid/flex/overflow |
| 任务工具栏 | 原生 token `--height-toolbar: 46px`，紧凑栏 `--height-toolbar-sm: 36px` | 菜单 36 px、任务栏 46 px；主题只换材质和分隔线 |
| 对话正文 | `--thread-content-max-width: 48rem` | 内容容器 768 px；左右 16 px 内边距后可见内容/输入面为 736 px |
| 输入器语义壳 | `[data-thread-find-composer="true"]` | 只是定位与滚动容器，严禁标记成输入框 |
| 输入器实体 | `.composer-surface-chrome`、`[data-codex-composer]`、`[data-codex-composer-root]` | 仅实体面允许主题化；多行圆角沿用 `--radius-3xl`，单行沿用 22 px token |
| 编辑器 | `.ProseMirror[contenteditable][role="textbox"]` | 不改文本、placeholder、宽高、最小高度或事件 |
| 对话 | `[data-thread-find-target="conversation"]`、`[data-virtualized-turn-content]` | 用户气泡只换材质；助手最终回答只标记 `[data-local-conversation-final-assistant]` 且始终无框 |
| 环境信息 | `[data-pip-obstacle="thread-summary-panel"]` | 300 px 浮动层，距右/上下 12–16 px；不是永久右侧栏，不改成整列 |
| 右侧应用面板 | `aside[data-app-shell-focus-area="right-panel"]` | 保持宿主最小宽 320 px 与 z-index；主题不强制其出现 |

## 状态识别

- 新建任务页：可见原生首页标题；当前 26.715.2305.0 使用 `[data-feature="game-source"]` 与 `.heading-xl`，没有可见 conversation turn。
- 已进入对话：存在可见 conversation/virtualized turn/assistant 节点。
- `data-vscode-context*="supportsNewChatMenu"` 两种页面都可能出现，不能单独作为状态依据。
- 路由 pathname 不是稳定合同，本实现不依赖它判断战斗境或风景境。

## 视觉差分原则

原生基线截图是 `docs/screenshots/native-ui-baseline.png`。主题截图必须与它保持同一槽位坐标、尺寸、圆角和文字；允许变化的只有全窗背景、表面透明度、边框/阴影颜色，以及输入器两侧空白沟槽中的无交互同行者/葫芦。fixture 证明 DOM/CSS 合同，不冒充真实生产 renderer 截图。
