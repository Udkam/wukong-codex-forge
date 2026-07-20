# 大圣归来 · 残卷入梦 — 设计与实现

## 设计判断

参考主题目录里最有效的方案都有同一个共同点：它们为新建页建立了“主画面”，而不是把聊天区当成一张可换壁纸的透明玻璃。由此本项目选择“编辑式游戏封面 + 克制工作台”的双态结构。

签名动作是“一图，两境”：

1. `landing` 使用用户截图的右侧剪影和夕照，左侧墨幕为标题与提示留出空间。
2. `thread` 使用同一图片、相同缓存和不同遮罩，显影强度降到 13%，避免文字与代码争夺注意力。
3. 高可读性完全移除图片，不依赖“继续加深滤镜”来假装纯色。

不采用视频、粒子引擎、WebGL、远程字体或每帧 JavaScript 动画。它们会提高崩溃风险和 GPU/内存成本，却不会改善 Codex 的核心工作流。

## 视觉系统

### 色彩

| Token | 值 | 用途 |
| --- | --- | --- |
| 墨黑 `ink` | `#090b0a` | 全局底色、代码面 |
| 漆褐 `lacquer` | `#211713` | 抬升表面、暖色过渡 |
| 黛玉 `jade` | `#748b78` | 选中、焦点、状态 |
| 烬金 `gold` | `#d2a45d` | 主要行动、启程、边界 |
| 宣纸 `paper` | `#e8dec9` | 主文本 |

烬金只标记行动和章节，黛玉只标记状态和焦点。消息面使用墨色半透明承载，不把整个应用做成金色发光面板。

### 字体

- 展示：本机楷体/中文衬线回退，用于“心有所向、万行自明”和印章。
- UI：Segoe UI / Microsoft YaHei UI / system-ui。
- 数据：Cascadia Code / Consolas。

不加载网络字体，避免离线闪烁、隐私请求和启动阻塞。

### 组件

- 新建对话：左侧“启”印、烬金外框、右上削角。
- 活动项目：黛玉淡染 + 左侧状态线。
- 消息：一层低透明墨面，助手消息以烬金边区分。
- 代码：纯墨背景 + 三像素烬金书脊。
- 输入区：卷轴上缘的圆角、底部直角，焦点时显示黛玉外环。
- 小行者：原图透明 PNG、投影和落地影；`pointer-events:none`。

## 运行时结构

```mermaid
flowchart LR
  A["受管快捷方式"] --> B["launch.ps1"]
  B --> C["ChatGPT.exe + loopback CDP"]
  B --> D["watch.mjs"]
  D --> E["语义 DOM 标记"]
  F["themes/active.json"] --> D
  G["本地背景与小行者"] --> D
  E --> H["landing / thread 自动状态"]
  H --> I["forge-theme.css"]
  J["悟主题开关"] --> I
  C -. "进程结束" .-> K["watcher 自动退出"]
```

`shared/theme-model.mjs` 是 Studio、导出和运行时的 schema v2 单一来源。背景分别提供 `landingPosition`、`landingIntensity`、`position` 和 `taskIntensity`。

注入器只做三类动作：

1. 插入唯一 style、主题开关、landing 标记和可选小行者。
2. 给明确语义节点增加 `forge-*` 类及 `data-forge-mark`。
3. 用合并后的 MutationObserver 在路由和动态渲染后重新识别状态。

它不替换 Codex markup。开关只切换根类 `forge-ink-mountain`，因此原生事件和布局继续存在；受管控制点保留用于重新开启主题。完整 restore 会连控制点一起删除。

## 状态判定

- `main` 内不存在 `article`、`role=article` 或 `data-message-author-role`：`landing`。
- 出现上述任一消息语义：`thread`。
- 状态写入 `html[data-forge-surface]`，CSS 不依赖不稳定的哈希类名。
- MutationObserver 仅观察 child list；标记产生的 class 变化不会触发递归刷新。

## 生命周期与恢复

`install.ps1 -CreateShortcut` 在当前用户开始菜单创建受管入口。它指向隐藏 PowerShell 包装器；包装器启动可见的官方 ChatGPT.exe，并显式传入只绑定 `127.0.0.1` 的 CDP 参数。

`watch.mjs` 在启动阶段最多等待约 15 秒。连接后每 1.4 秒用一个布尔表达式探测运行时是否仍存在；只有新 renderer 或页面重载后才重新发送完整主题。CDP 连失三次视为 ChatGPT 退出，watcher 自行结束。

安全恢复分两层：

- 主题开关：去掉根主题类，保留“悟”控制点。
- `restore.ps1`：停止 observer，删除受管 DOM/style/标记和本地偏好；`-Uninstall` 还会验证 state marker、受控路径和精确快捷方式路径后删除管理目录。

## 无障碍与响应式

- 所有交互保留 button/input 语义和 focus-visible。
- 状态输出使用 `aria-live`。
- 主题开关使用 `aria-pressed`，切换不依赖颜色。
- 系统 `prefers-reduced-motion` 与主题 reduced motion 均停止伴随者动画。
- 900 px 以下缩小 landing 标记和宠物；640 px 以下移除装饰标题；不遮挡输入区。

## 性能预算

| 项目 | 预算 |
| --- | --- |
| 背景 | 1 张 JPEG，78,423 bytes |
| 宠物 | 可选 1 张透明 PNG，静态解码 |
| 网络 | 0 个主题网络请求 |
| 动画 | 1 个 transform-only 待机动画 |
| DOM 常驻 | style、开关、landing 标记、可选宠物 |
| 观察器 | 1 个 child-list observer，120 ms 合并 |

生产 DOM 版本仍需要在实际受管启动后做截图、开关和新建/对话切换验收。fixture 通过不代表每个未来版本自动兼容。
