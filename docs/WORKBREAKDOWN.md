# 分工与交付边界

本轮由 Codex 主代理统一实施，没有启动子代理。职责按审计域拆分如下：

| 责任域 | 负责人角色 | 交付 | 完成证据 |
| --- | --- | --- | --- |
| 产品边界 | Product owner | 样式替换、无额外 UI、尺寸与内容零侵入 | `REQUIREMENTS.md` |
| 视觉设计 | Theme designer | 六根盘、无框墨幕、单线棍势体系 | 两张 runtime 截图 |
| DOM 适配 | Frontend engineer | 当前 Codex 属性标记、双状态、清理 | 动态 fixture 2/2 |
| Windows 生命周期 | Runtime engineer | 固定目录、受管启动、同启停 watcher、卸载 | 生命周期 2/2 |
| 配置恢复 | Safety engineer | 暗到亮升级、键级还原、路径/reparse 检查 | 原生主题 4/4 |
| 包结构 | Release engineer | 最小独立 runtime，无开发目录 | 受管包 1/1 |
| QA | Verification owner | 几何、文本、无框回答、平衡明度、真实窗口审计 | 自动证据 + 用户截图 |
| 发布 | Release owner | 每轮 commit/push、网络失败披露 | 本地/远端 SHA |

## 0.5.0 里程碑

1. M1：恢复运行时样式能力，建立当前 Codex 原生三栏 fixture 和 V4 清理协议。已完成。
2. M2：探索暗系与明亮日照宣纸，两版均经用户审计后否决。已归档。
3. M3：废弃旧版切角卡片/双金边组件骨架，按本地游戏战绩页完全重构为六根盘、无框墨幕和单线棍势；回答无框，输入框和消息几何零变化。已完成。
4. M4：建立烟墨原生基线升级、最小 runtime 打包、随机回环受管启动与卸载。代码和定向测试已完成。
5. M5：原位升级本机安装目录并创建正式入口。已完成；39 个文件、约 0.36 MiB，入口与源码 hash 已核对。
6. M6：由受管入口启动真实 Codex、截图、根据用户审计迭代。自动 fixture 已验收，真实窗口待用户从受管入口启动。
7. M7：精确 diff、文档、commit/push；若 GitHub 网络不可用则持续标记未发布。进行中。

## 交接规则

- fixture 截图不得称为真实 Codex 生产截图。
- 不修改 `app.asar`、WindowsApps、`ChatGPT.exe` 或官方快捷方式。
- 不强关 Codex；运行中卸载先实时恢复，再要求用户关闭以删除 in-use profile。
- 不增加主题侧栏、底栏、状态卡或 in-app 开关。
- 不用整份 `config.toml` 备份覆盖用户后续设置。
- 每轮只运行覆盖当前变更风险的测试，并精确暂存路径。
