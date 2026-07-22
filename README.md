# Wukong Codex Forge

> 当前开发线为 **0.10.0 / V11**。V10、V9 的文字与证据继续保留为历史；与现行行为冲突时，以本节和 `docs/` 顶部的 V11 合同为准。

## V11 当前实现

- **仍是原生 Codex 页面**：顶部栏、侧栏、工作区、输入器、环境信息卡、原有图标、文案和事件全部保留；不增加主题侧栏、底栏、开关、状态卡或 emoji。
- **替换样式而非只换颜色**：侧栏操作项采用窄边经匣切角与朱砂签，输入器采用同宽同高的短轨经匣轮廓，发送键采用同尺寸八角朱砂印，环境卡采用同尺寸典籍匣角与行分隔。改变的是轮廓、材质和局部构造，不改变原生槽位坐标、宽高、内边距或文字。
- **背景完全覆盖且逐图适配**：唯一的 `body::before` 固定背景使用 `cover` 覆盖全窗；11 张画面分别定义色板、遮罩与亮度，战斗/风景模式遮罩与场景遮罩独立叠加。白场杨戬、大圣、夜叉王和五张风景图不再被统一压成同一种暗色。
- **角色改用原生 Hatch Pet**：页面样式层不再绘制静态小悟空或小八戒。小悟空固定为游科官方天命人厌火夜叉套 1/12 造型并持兽棍·神锋；小八戒固定参考 INART 1/12，使用旧青衣、念珠和恰好九齿的钉耙。两者按 Codex v2 8×11 动画图集制作、验证和安装。
- **页面 motif 只保留湘妃葫芦**：它是无交互、无障碍隐藏的单一装饰，不进入输入器、侧栏或环境卡布局，也不改变任何 DOMRect。
- **回答继续无框**：助手回答及其祖先链保持透明、无阴影、无圆角；用户提示词、回答和输入提示均不改写。

当前 V11 fixture 证据：

- [新建任务·杨戬战斗境](docs/screenshots/runtime-v11-fixture-v2-landing.png)
- [进入对话·佛窟风景境](docs/screenshots/runtime-v11-fixture-v2-thread.png)
- [几何、状态与控制台记录](docs/screenshots/runtime-v11-fixture-v2.json)

fixture 只用于稳定复核 landing/thread 两类 DOM。真实 Codex renderer 已在同一受管实例完成补充审计：

- [真实 V11 新建任务窗口](docs/screenshots/live-codex-v11-native-pets-initial-20260722.png)及其[状态 JSON](docs/screenshots/live-codex-v11-native-pets-initial-20260722.png.json)
- [官方“宠物”页识别两个自定义包](docs/screenshots/live-codex-v11-native-pets-linked-payload-main-20260722.png)及其[状态 JSON](docs/screenshots/live-codex-v11-native-pets-linked-payload-main-20260722.png.json)
- [小八戒原生宠物层](docs/screenshots/live-codex-v11-bajie-pet-linked-payload-20260722.png)与[小悟空原生宠物层](docs/screenshots/live-codex-v11-wukong-pet-linked-payload-20260722.png)
- [小八戒 11 行动作表](docs/pets/little-bajie-v3-inart/contact-sheet.png)、[小悟空 11 行动作表](docs/pets/little-wukong-yaksha-shenfeng/contact-sheet.png)

`start-theme.cmd` 会先运行 `scripts/install-native-pets.ps1`。官方 Codex 只扫描 `Dirent.isDirectory()` 为真的顶层目录，因此安装器建立真实发现目录，并在其内部放置名为 `payload` 的目录 junction；派生 `pet.json` 指向 `payload/spritesheet.webp`。这样不需要管理员或 Developer Mode，不复制多兆字节 atlas，主题源目录不存在后图集自然不可读。若检测到早期直接副本，安装器先把原 manifest 逐字节保存在 `source-pet.json`，旧 atlas 也原位保留，再迁移到 payload 路径；不删除、不移动任何已有文件。安装记录只追加到包内 `.wukong-runtime/native-pet-links.jsonl`，内容冲突时 fail closed。

## 0.9.0 / V10 历史交付（保留）

- **普通入口自动生效**：首次双击 `start-theme.cmd` 会把用户开始菜单中的普通 `ChatGPT.lnk` 改为 178 字符的短入口，并立即启动主题窗口。以后从同一个普通 ChatGPT 快捷方式启动即可；主题根目录不存在时，版本化桥接脚本动态定位当前官方 Store 包并按原生方式启动。
- **关闭同生命周期**：主题 watcher 只跟随隔离 profile 的 Codex renderer；连续 8 次、约 13.6 秒没有 renderer 即自动结束。Windows 官方主进程可按托盘策略隐藏窗口并保留 renderer，此时 watcher 继续绑定同一实例而不新增副本；再点同一 ChatGPT 快捷方式会以相同 profile 进入官方 `second-instance` / `codex://launch` 通道并复显该窗口。若 renderer 或进程真正退出，watcher 自动结束，下一次启动再创建。不会结束或改写用户已经打开的普通 Codex。
- **原生外形、场景换肤**：仍是 36 px 菜单栏、275 px 侧栏、原生工作区、736 × 98 px 输入器和 300 px 环境卡；没有主题侧栏、底栏、按钮或开关。新任务自动为战斗境，进入对话自动为风景境。
- **11 组场景自适应矿色**：每张背景同时携带独立的文字、侧栏、顶栏、输入器、用户气泡、代码块、菜单、环境卡与 veil 色板，换图不再只换背景。
- **独立同行者层**：新绘小悟空、小八戒与湘妃葫芦位于一个 `aria-hidden`、`inert`、`pointer-events:none` 的固定覆盖层；不再依附输入框伪元素。小悟空和小八戒站在工作区底部两侧，葫芦按页面在新任务主视觉、环境卡脚部或工作区上缘之间选择安全位置。
- **只增不删**：官方 `ChatGPT.exe`、WindowsApps、`app.asar` 与 `config.toml` 零写入；官方快捷方式原件、失败的 1023 字符入口和后续入口版本均保存在 append-only 历史目录。脚本不删除、不移动文件。

当前本机真实窗口证据：

- [最终便携包 fresh-profile 启动](docs/screenshots/live-codex-v10-release-fresh-profile-landing.png)及其[状态与几何 JSON](docs/screenshots/live-codex-v10-release-fresh-profile-landing.json)
- [普通快捷方式启动·新任务战斗境](docs/screenshots/live-codex-v10-autostart-landing.png)及其[状态与几何 JSON](docs/screenshots/live-codex-v10-autostart-landing.json)
- [同一窗口·对话风景境](docs/screenshots/live-codex-v10-autostart-thread.png)及其[状态与几何 JSON](docs/screenshots/live-codex-v10-autostart-thread.json)

本次实测为 PID 26812、随机回环端口 38625、watcher PID 18296；V10 active、背景 `cover`、输入器 736 × 98、环境卡 300 × 473、助手回答透明无框，三件伴随元素均不接收鼠标。定向回归 24/24 通过。

最终推荐 ZIP 另以全新目录和全新 profile 验收：PID 45072、端口 34661、watcher PID 46940；`starting → watching`，受管标记 128、三项安全位 true、启动 stderr 0 bytes。该窗口保留供现场审计。

安全边界：开始菜单快捷方式、安装目录内 `start-theme.cmd` 与由它安装的入口可自动带主题启动。直接运行 WindowsApps 内 `ChatGPT.exe`、Store AUMID、协议或第三方自建入口会绕过适配器；若要无条件拦截这些入口，需要修改官方包、IFEO、注入 DLL 或系统服务，本项目为避免崩溃与破坏签名明确不采用。

只读核对官方 26.715.2305.0 主进程代码后确认：Windows 的 `window-all-closed` 不调用 `app.quit()`，所以“关闭窗口”与“结束 `ChatGPT.exe`”不是同一事件；驻留实例的恢复由官方 `second-instance` 队列、同一 `CODEX_ELECTRON_USER_DATA_PATH`、同一 `--user-data-dir` 和 `codex://launch` 共同完成。Chromium 在原生窗口已隐藏时仍可能报告 DOM `visible`，因此本项目只按受管根 PID 的 `MainWindowHandle` 验收复显，失败即明确返回非零，不伪造可见或退出状态，也不调用 Win32 窗口操控 API。

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
