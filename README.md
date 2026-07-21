# Wukong Codex Forge

> 当前交付为 **0.9.0 / V10**。本节覆盖后文仍保留的 0.8.0 / V9 历史说明；旧文字与旧证据没有删除。

## 0.9.0 当前交付

- **普通入口自动生效**：首次双击 `start-theme.cmd` 会把用户开始菜单中的普通 `ChatGPT.lnk` 改为 178 字符的短入口，并立即启动主题窗口。以后从同一个普通 ChatGPT 快捷方式启动即可；主题根目录不存在时，版本化桥接脚本动态定位当前官方 Store 包并按原生方式启动。
- **关闭同生命周期**：主题 watcher 只跟随使用隔离 profile 启动的 `ChatGPT.exe`，应用退出后 watcher 结束；不会结束或改写用户已经打开的普通 Codex。
- **原生外形、场景换肤**：仍是 36 px 菜单栏、275 px 侧栏、原生工作区、736 × 98 px 输入器和 300 px 环境卡；没有主题侧栏、底栏、按钮或开关。新任务自动为战斗境，进入对话自动为风景境。
- **11 组场景自适应矿色**：每张背景同时携带独立的文字、侧栏、顶栏、输入器、用户气泡、代码块、菜单、环境卡与 veil 色板，换图不再只换背景。
- **独立同行者层**：新绘小悟空、小八戒与湘妃葫芦位于一个 `aria-hidden`、`inert`、`pointer-events:none` 的固定覆盖层；不再依附输入框伪元素。小悟空和小八戒站在工作区底部两侧，葫芦按页面在新任务主视觉、环境卡脚部或工作区上缘之间选择安全位置。
- **只增不删**：官方 `ChatGPT.exe`、WindowsApps、`app.asar` 与 `config.toml` 零写入；官方快捷方式原件、失败的 1023 字符入口和后续入口版本均保存在 append-only 历史目录。脚本不删除、不移动文件。

当前本机真实窗口证据：

- [普通快捷方式启动·新任务战斗境](docs/screenshots/live-codex-v10-autostart-landing.png)及其[状态与几何 JSON](docs/screenshots/live-codex-v10-autostart-landing.json)
- [同一窗口·对话风景境](docs/screenshots/live-codex-v10-autostart-thread.png)及其[状态与几何 JSON](docs/screenshots/live-codex-v10-autostart-thread.json)

本次实测为 PID 26812、随机回环端口 38625、watcher PID 18296；V10 active、背景 `cover`、输入器 736 × 98、环境卡 300 × 473、助手回答透明无框，三件伴随元素均不接收鼠标。定向回归 24/24 通过。

安全边界：开始菜单快捷方式、安装目录内 `start-theme.cmd` 与由它安装的入口可自动带主题启动。直接运行 WindowsApps 内 `ChatGPT.exe`、Store AUMID、协议或第三方自建入口会绕过适配器；若要无条件拦截这些入口，需要修改官方包、IFEO、注入 DLL 或系统服务，本项目为避免崩溃与破坏签名明确不采用。

## 0.8.0 / V9 历史记录（保留）

“大圣归来 · 潇湘双境”是 Windows Codex 桌面端的《黑神话：悟空》样式层。它复用真实 Codex DOM，保留顶部栏、275 px 侧栏、工作区、736 × 98 px 输入器与 300 px 环境卡，不增加主题控制栏、侧栏或底栏。用户提示词和回答不改写，助手回答保持无框；小悟空、小八戒与湘妃葫芦只作为无交互伪元素出现，不改变任何原生槽位。

## 潇湘双境

- **新建任务页＝战斗境**：首幕是用户指定的水墨杨戬对决图；大圣归来和金箍棒同属主组，夜叉王、雷法与蓝色对峙只低频出现。
- **进入对话＝风景境**：根据任务路径和标题稳定选择岭谷、林寺、山径、佛窟或晚霞，同一任务不随时间跳图。
- **组件采用“潇湘矿色”**：侧栏和环境卡只换墨铁、石青、旧金、漆褐材质，不再粘贴夜叉套、神锋或武器条。
- **三件伴随元素**：以实机画面为造型依据的小悟空与小八戒站在输入器左右空白沟槽，湘妃葫芦位于左侧余量；三者都不进入输入框，碰撞正文、窗口过窄或强制高对比时自动隐藏。
- **原生形状优先**：46 px 任务栏、275 px 侧栏、768/736 px 内容与输入器、300 px 浮动环境卡及其原生圆角均不变；只换背景、透明度、边线和材质。

## 安装与使用

下载并解压发布包后，直接双击 `start-theme.cmd`。它会同时启动官方 Codex 与主题 watcher；无需 npm、全局 Node、浏览器扩展或管理员安装。

仓库用户也可直接运行：

```powershell
.\start-theme.cmd
```

如需把一个只增不删的版本副本放入 Codex 用户目录，再双击 [install-theme.cmd](install-theme.cmd)，或执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-preserving.ps1
```

版本化安装器会：

1. 把最小运行包写入 `%USERPROFILE%\.codex\themes\wukong-codex-forge\releases\<版本-时间>`。
2. 保留旧 app、旧 state、旧素材和历史配置副本；只记录早期颜色主题证据，不改写当前 `config.toml`。
3. 不创建开始菜单快捷方式。进入新 release 目录，双击其中的 `start-theme.cmd` 即可。

主题入口使用包内 `.wukong-runtime` 作为独立 profile 和状态目录，不强关现有窗口，也不修改 `ChatGPT.exe`、WindowsApps、`app.asar`、签名文件、官方快捷方式或 Codex 配置。已经运行且没有调试端口的普通 Codex 窗口无法通过“只复制文件”即时换肤；这是 Chromium 的运行边界。

## 停用与保留

双击 `stop-theme.cmd`（`remove-theme.cmd` 是同义入口）可把当前主题窗口热恢复为原生 DOM：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\disable.ps1 -Root . -Portable
```

停用脚本必须先验证 renderer 已无 style、class、标记和运行时对象，才报告成功；它不删除任何文件。关闭主题 Codex 后，用户自行删除解压目录即可完全回到普通 Codex。0.8.0 的运行状态、profile、请求与日志全部位于该目录的 `.wukong-runtime`，目录外不创建快捷方式或持久主题配置。

## 成本与稳定性

- 11 张压缩 JPEG 和 3 张透明 WebP 共 2,737,884 bytes（约 2.61 MiB）；启动后无素材网络请求。
- 无视频解码、定时轮播、持续截图或布局轮询。
- 每张背景只编码一次，语义别名引用同一 CSS 变量；注入变量约 3.65M 字符、完整样式约 3.67M 字符，本机热应用约 1.2 秒。
- 随机回环端口就绪后，启动器以最多 20 秒、每 350 ms 一次的有界重试等待首个 Codex renderer；只有 V9 完整样式已应用并回读验证，才进入 watcher 状态。
- V9 只保留一个 `childList` 结构观察器：忽略属性、文字、滚动、逐字输入和焦点变化，仅当新增/移除节点命中对话、输入器或浮层结构时触发；所有刷新以 650 ms 合并节流，侧栏与提交动作只安排有限次复核。
- 同一真实 renderer 稳态 6 秒采样：原生 landing 约 3.90% 单核，V9 主题 landing 约 1.82% 单核；差异处于调度噪声内，未测得主题常驻增量。
- 页面内停用只撤销受管 style 和 `forge-*` 标记；磁盘文件与历史版本全部保留。

## 针对性验证

```powershell
npm run test:theme
npm run test:managed-package
npm run test:runtime-states
```

当前证据分两类：

- 生产 DOM 形态 fixture：验证双境切换、原生几何不变、回答无框、文字零改写、三件装饰实际载入、碰撞避让与完全清理。
- 本机生产窗口：只有从受管入口启动、并同时记录注入状态与端口的截图才算真实 Codex 证据。

与最终 release 使用同一视觉载荷的真实 Codex 截图（同名 JSON 保留状态、几何与 computed style）：

- [新建任务·战斗境](docs/screenshots/live-codex-v9-final-landing.png)
- [进入任务·风景境与无框正文](docs/screenshots/live-codex-v9-final-thread.png)

自动实渲染截图：

- [原生 UI 基线](docs/screenshots/native-ui-baseline.png)
- [战斗境·杨戬首幕](docs/screenshots/runtime-style-battle-erlang.png)
- [战斗境·大圣归来](docs/screenshots/runtime-style-battle-great-sage.png)
- [战斗境·夜叉王](docs/screenshots/runtime-style-battle-yaksha.png)
- [战斗境·金箍棒](docs/screenshots/runtime-style-battle-jingu.png)
- [风景境·对话中](docs/screenshots/runtime-style-thread.png)
- 旧 0.7.0 的金箍棒、神锋和夜叉套 UI 近景素材保留为历史证据，但不进入 0.8.0 运行包；当前金箍棒只作为战斗境背景画面使用。

## 文档

- [需求与验收](docs/REQUIREMENTS.md)
- [设计与实现](docs/DESIGN.md)
- [多对话分工与交付边界](docs/WORKBREAKDOWN.md)
- [运行时调查](docs/RUNTIME_FINDINGS.md)
- [Codex 26.715.2305.0 原生 UI 基线](docs/UI_BASELINE.md)
- [素材来源与发布边界](docs/ASSET_SOURCES.md)
- [V10 同行者生成谱系](docs/PET_GENERATION.md)
- [0.9.0 发布记录](docs/RELEASE_0.9.0.md)

过程日志位于本地 `docs/logs/CHANGELOG.md`，按仓库约定不提交。代码以 [MIT](LICENSE) 发布；游戏名称、截图、装备参考与官方艺术作品的权利属于其各自权利人。
