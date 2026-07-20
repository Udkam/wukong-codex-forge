# 大圣归来 · 日照命簿 — 设计与实现

## 视觉母题

背景沿用用户指定的 `大圣归来.jpg`。组件不再使用通用暗色或通用浅色卡片，而由三套可重复语言组成：

| 母题 | 应用位置 | 设计特征 |
| --- | --- | --- |
| 朱砂签印 | 新建任务、侧栏选中、发送 | 朱砂端条、菱形签印、红漆圆印 |
| 金箍横卷 | 输入框、任务栏分隔 | 双金线、鎏金端箍、非对称切角、八角工具钮 |
| 命簿碑刻 | 消息、代码、菜单、环境卡 | 双层细框、朱砂/青玉侧脊、碑帖字体、石刻切角 |

明亮基底为 `#f7eed8`，正文深墨 `#2e261c`，朱砂 `#8b3e2f`，鎏金 `#b9782d`，青玉 `#627f69`。代码块保留深褐底以保证长代码对比度，但不主导整页明度。

## 双页面状态

- `landing`：背景高显影，标题使用朱砂碑帖字与金线下划；输入框在画面底部形成金箍横卷锚点。
- `thread`：用浅宣纸 wash 降低背景竞争；消息与代码获得命簿层级，输入框保持同一造型。

状态由 Codex 当前数据属性、路由和消息证据判定；MutationObserver 以 110 ms 合并刷新。没有额外主题开关或状态栏。

## 原生 DOM 适配

运行时优先使用当前 Codex 的稳定属性：

- `data-thread-find-target="conversation"`
- `data-thread-find-composer="true"`
- `data-virtualized-turn-content`
- `data-content-search-turn-key`
- `data-user-message-bubble`
- `data-local-conversation-user-anchor`
- `data-local-conversation-final-assistant`
- `data-vscode-context*="supportsNewChatMenu"`

侧栏、工作区、环境栏和任务栏另有基于可见区域与几何范围的保守 fallback。标记器只给现有节点增加 `forge-*` class 和 `data-forge-mark`；唯一新增元素是 `head` 内的一个受管 `<style>`。

恢复表达式断开 observer、移除 listener/style/class/data 标记，并将 landing/thread 状态清空。测试断言 body 子节点数不增加、清理后受管标记为零。

## 生命周期

```mermaid
flowchart LR
  A["install-theme.cmd"] --> B["安装明亮原生基线"]
  B --> C["打包最小 runtime"]
  C --> D["创建 Codex - Wukong Theme"]
  D --> E["启动官方 ChatGPT.exe + 随机回环端口"]
  E --> F["watcher 注入/维持样式"]
  F --> G["Codex 关闭后 watcher 退出"]
  H["remove-theme.cmd"] --> I["实时清理样式 + 恢复 TOML 键"]
  I --> J["删除快捷方式、profile 与受管目录"]
```

默认 Chromium profile 会忽略远程调试参数，因此受管入口使用主题目录内的隔离 web profile。官方 Store 包路径在每次启动时通过 `Get-AppxPackage OpenAI.Codex` 解析，更新后无需写死版本路径。

## 配置恢复

原生明亮基线用于启动前和非注入表面：`appearanceTheme=light`、`appearanceLightChromeTheme` 暖纸/深墨/朱砂值。0.3.0 暗色安装可原位升级：引擎先按旧 state 精确还原基线，再应用新定义并生成新 state；卸载仍能回到主题安装前的用户值。

恢复只操作主题持有的 TOML section/key。若用户安装后改过某键，恢复保留用户值并输出警告，不回滚整份配置。

## 性能与兼容

| 项目 | 设计值 |
| --- | --- |
| 背景网络请求 | 0，本地 JPEG 以内嵌 data URL 使用 |
| 新增 body 节点 | 0 |
| 样式节点 | 1，位于 head |
| observer | 1，110 ms 合并 |
| watcher | 1 个 Node 进程，1.7 s 存活探测 |
| 调试端口 | 随机、仅 `127.0.0.1` |
| 官方文件写入 | 0 |

选择器以稳定属性和角色为主，哈希 class 变化时由几何 fallback 承接；Codex 大版本更新后仍必须执行真实 DOM 截图审计。
