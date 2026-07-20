# Wukong Codex Forge

“大圣归来 · 玄锋双境”是 Windows Codex 桌面端的《黑神话：悟空》样式层。它保留 Codex 原生顶部栏、侧栏、工作区、输入区和环境信息栏，不增加主题按钮、侧栏、底栏或宠物；只替换现有 DOM 的背景、轮廓与材质。用户提示词和回答不改写，助手回答保持无框，所有原生槽位尺寸不变。

## 玄锋双境

- **新建任务页＝战斗境**：首幕是用户指定的水墨杨戬对决图；大圣归来和金箍棒同属主组，夜叉王、雷法与蓝色对峙只低频出现。
- **进入对话＝风景境**：根据任务路径和标题稳定选择岭谷、林寺、山径、佛窟或晚霞，同一任务不随时间跳图。
- **装备采用小面积实物嵌件**：侧栏与环境信息窗口裁取厌火套装的长角/鬼面/甲片；输入框只嵌入短截兽棍·神锋与金箍棒实景，不贴整个人物或拉伸武器。
- **原生形状优先**：275 px 侧栏、46 px 任务栏、768/736 px 内容与输入器、300 px 浮动环境卡及原生圆角均不变；只换背景、透明度、边线和材质。

## 安装与使用

下载并解压后双击 [install-theme.cmd](install-theme.cmd)，或执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install-preserving.ps1
```

安装器会：

1. 把最小运行包写入 `%USERPROFILE%\.codex\themes\wukong-codex-forge\releases\<版本-时间>`。
2. 保留旧 app、旧 state、旧素材和历史配置副本；若检测到早期颜色主题，只在完整备份后按键恢复用户原值。
3. 创建版本化开始菜单入口 `Codex - Wukong Theme 0.7.0`，不会覆盖旧入口。

安装完成后，从版本化入口启动即使用主题，watcher 与这次 Codex 同启同停。普通 Codex 可以保持打开；主题入口使用独立受管 profile，不强关现有窗口，也不修改 `ChatGPT.exe`、WindowsApps、`app.asar`、签名文件或官方快捷方式。已经运行且没有调试端口的普通 Codex 窗口无法通过“只复制文件”即时换肤。

## 停用与保留

双击 [remove-theme.cmd](remove-theme.cmd)，或执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\disable.ps1
```

停用脚本向当前受管 watcher 请求恢复原生样式，但不删除任何文件；再次从普通 Codex 入口打开就是原生界面。0.7.0 不向官方程序或 Codex 原生主题配置写入持续样式，因此用户自行移除整个受管主题目录后也不会残留背景或组件 CSS。本轮按最高约束保留所有旧版本、历史 state、素材、测试证据和研究副本。

## 成本与稳定性

- 11 张压缩 JPEG 和 2 张透明 PNG 共 4,693,008 bytes（约 4.48 MiB）；启动后无素材网络请求。
- 无视频解码、定时轮播、持续截图或布局轮询。
- 页面内只有一个 `head` 样式节点和一个 110 ms 合并的 `MutationObserver`；watcher 每 1.7 秒做一次廉价存活探测。
- 页面内停用只撤销受管 style 和 `forge-*` 标记；磁盘文件与历史版本全部保留。

## 针对性验证

```powershell
npm run test:theme
npm run test:managed-package
npm run test:runtime-states
```

当前证据分两类：

- 生产 DOM 形态 fixture：验证双境切换、原生几何不变、回答无框、文字零改写、装备素材实际载入与完全清理。
- 本机生产窗口：只有从受管入口启动、并同时记录注入状态与端口的截图才算真实 Codex 证据。

自动实渲染截图：

- [原生 UI 基线](docs/screenshots/native-ui-baseline.png)
- [战斗境·杨戬首幕](docs/screenshots/runtime-style-battle-erlang.png)
- [战斗境·大圣归来](docs/screenshots/runtime-style-battle-great-sage.png)
- [战斗境·夜叉王](docs/screenshots/runtime-style-battle-yaksha.png)
- [战斗境·金箍棒](docs/screenshots/runtime-style-battle-jingu.png)
- [风景境·对话中](docs/screenshots/runtime-style-thread.png)
- [金箍棒与兽棍·神锋输入框近景](docs/screenshots/runtime-style-composer.png)
- [厌火套装环境信息近景](docs/screenshots/runtime-style-environment.png)

## 文档

- [需求与验收](docs/REQUIREMENTS.md)
- [设计与实现](docs/DESIGN.md)
- [多对话分工与交付边界](docs/WORKBREAKDOWN.md)
- [运行时调查](docs/RUNTIME_FINDINGS.md)
- [Codex 26.715.2305.0 原生 UI 基线](docs/UI_BASELINE.md)
- [素材来源与发布边界](docs/ASSET_SOURCES.md)

过程日志位于本地 `docs/logs/CHANGELOG.md`，按仓库约定不提交。代码以 [MIT](LICENSE) 发布；游戏名称、截图、装备参考与官方艺术作品的权利属于其各自权利人。
