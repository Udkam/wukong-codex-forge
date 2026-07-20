# 分工与交付边界

本项目按可验证职责拆分，不以“写了多少 CSS”作为完成标准。当前由 Codex 主代理统一实施；下表同时定义后续任何协作者接手时的边界。

| 责任域 | 负责人角色 | 输入 | 必须交付 | 完成证据 |
| --- | --- | --- | --- | --- |
| 产品与需求 | Product owner | 用户目标、稳定性约束 | `REQUIREMENTS.md`、验收边界 | 每项需求有可观察标准 |
| 视觉系统 | Theme designer | 用户截图、主题参考目录 | 双态布局、色彩/字体/组件规则 | Studio landing/thread 截图 |
| Studio | Frontend engineer | schema v2、视觉规范 | 控件、导入导出、主题/状态预览 | Studio E2E |
| 运行时 | Runtime engineer | ChatGPT 语义 DOM、主题 JSON | 标记、状态识别、原生几何保护、恢复 | mock DOM 与像素测试 |
| 生命周期 | Windows engineer | OpenAI.Codex 包、受管目录 | 安装、快捷方式、启动、watch、卸载 | 脚本契约测试 |
| QA | Verification owner | 上述交付及实际 Codex renderer | 针对性测试、CDP 截图、风险清单 | 无页面错误、原生结构不变、清理无残留 |
| 发布记录 | Release owner | 精确差异与证据 | 小步 commit、push、工作日志 | 本地/远端 SHA 一致 |

## 本轮里程碑

1. M1：需求、视觉方向与素材决策冻结。
2. M2：Studio 双态预览和 schema v2 完成。
3. M3：无页面内控制点的动态状态、原生几何保护和生命周期 watcher 完成。
4. M4：针对性测试、真实浏览器截图、文档和发布完成。
5. M5：从受管快捷方式重新启动真实 ChatGPT 后，做生产 DOM 视觉认证。

## 交接规则

- 视觉验收必须看真实帧，测试通过不能代替外观验收。
- 生产 DOM 找不到节点时记录为兼容性缺口，不扩大选择器到哈希类名。
- 不在同一提交混入无关清理。
- 不修改 WindowsApps、`app.asar` 或未被 state marker 管理的路径。
- 每轮只运行覆盖本轮风险的测试；发布里程碑再运行完整套件。
