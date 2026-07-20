# 分工与交付边界

当前由 Codex 主代理统一实施；下表定义后续协作者的职责边界。

| 责任域 | 负责人角色 | 交付 | 完成证据 |
| --- | --- | --- | --- |
| 产品边界 | Product owner | 原生能力与未实现项 | `REQUIREMENTS.md` 状态表 |
| 视觉 token | Theme designer | 玄金、暖纸、青绿语义色与字体 | `themes/native-wukong.json` |
| 原生配置 | Runtime engineer | TOML 值级应用与恢复 | 往返及冲突保留测试 |
| Windows 生命周期 | Windows engineer | 固定目录安装/卸载，无启动器 | PowerShell 解析与路径拒绝测试 |
| 视觉构想 | Frontend engineer | 非运行时 Studio 预览 | 仅在预览变更时执行 E2E |
| QA | Verification owner | 实际配置值、目录结构、用户目视审计 | 本地安装 marker 与针对性测试 |
| 发布 | Release owner | 小步提交、推送、工作日志 | 本地与远端 SHA 一致 |

## 0.3.0 里程碑

1. M1：停止 CDP/独立实例路线，确认 Codex 原生 Chrome Theme schema。
2. M2：建立原生主题定义及值级安装/恢复引擎。
3. M3：移除启动器、watcher、端口、快捷方式和运行时注入测试。
4. M4：安装到真实 `CODEX_HOME`，由用户审计实际 Codex 页面颜色。
5. M5：定向测试、文档、commit 与 push。

## 交接规则

- 不把 Studio 概念图称为真实 Codex 运行截图。
- 不为追求背景或宠物重新修改 `app.asar` 或注入 DOM。
- 不用整份 `config.toml` 备份覆盖用户后续配置。
- 不在主题安装器中启动、关闭或自动化 Codex。
- 每轮只运行覆盖当前风险的测试，并精确暂存本轮路径。
