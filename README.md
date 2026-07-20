# Wukong Codex Forge

“大圣归来 · 日照命簿”是 Windows Codex 桌面端的《黑神话：悟空》样式层。它保留 Codex 原生顶部栏、侧栏、工作区、输入区和环境栏，不增加主题按钮、侧栏或底栏；在原生 DOM 上替换背景、按钮、输入框、消息、代码块、菜单和环境卡样式。

当前视觉为明亮系：用户提供的 `大圣归来.jpg` 作为主背景，新对话页高显影、进入对话后浅化；侧栏采用朱砂签印与墨刷选中态，输入框采用金箍棒横卷结构，消息和环境卡采用命簿碑刻切角。

## 安装与使用

下载并解压后双击 [install-theme.cmd](install-theme.cmd)，或执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

安装器会：

1. 把最小运行包安装到 `%USERPROFILE%\.codex\themes\wukong-codex-forge`。
2. 写入明亮原生外观基线，并按键记录安装前值。
3. 创建开始菜单入口 `Codex - Wukong Theme`。

若 Codex 已打开，安装器不会强关或修改当前进程。准备审计时，正常关闭当前 Codex，再从 `Codex - Wukong Theme` 启动；主题 watcher 与该次 Codex 同启同停。普通 Codex 入口仍保持官方行为。

该启动方式是当前 Chromium 安全策略下实现自定义背景与 CSS 的稳定边界：默认 profile 会忽略外部远程调试参数，受管启动器因此使用主题目录内的隔离 web profile 和随机回环端口。它不修改 `ChatGPT.exe`、WindowsApps、`app.asar` 或签名文件。

## 删除与恢复

双击 [remove-theme.cmd](remove-theme.cmd)，或执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore.ps1 -Uninstall
```

卸载器先移除打开窗口中的样式并按键恢复原生配置，再删除快捷方式和受管目录。若受管 Codex 窗口仍占用 profile，样式会先恢复原生，卸载器会要求关闭该窗口后再运行一次，以避免强杀进程或损坏 profile。

不要直接删除 `state.json`：它保存精确恢复安装前外观所需的键级记录。用户在安装后再次修改过的受管键会被保留，不会被旧值覆盖。

## 视觉与运行边界

- 页面布局和事件由 Codex 提供；样式层不创建 body 子节点。
- 运行时只在 `head` 添加一个受管 `<style>`，并为现有元素添加可清理标记类。
- landing/thread 状态由当前 Codex 数据属性与路由判定，110 ms 合并刷新。
- 背景图本地内嵌，无主题网络请求；素材大小约 78 KB。
- watcher 每 1.7 秒进行一次廉价存活/样式探测，Codex 关闭后自动退出。
- 小悟空宠物本版暂缓，因为用户当前优先要求原生页面无额外节点。

## 针对性验证

```powershell
npm install
npm run validate
npm run test:theme
npm run test:lifecycle
npm run test:managed-package
npm run test:runtime-states
```

这些测试分别覆盖原生基线升级/恢复、Windows 生命周期与路径边界、最小包独立导入、landing/thread 动态样式、明亮度、无新增 UI、原生槽位几何不变和清理恢复。

当前两张自动实渲染证据：

- [新对话样式](docs/screenshots/runtime-style-landing.png)
- [对话中样式](docs/screenshots/runtime-style-thread.png)

它们是生产 DOM 形态 fixture 的浏览器渲染，不冒充当前真实 Codex 窗口截图；真实窗口验收须在受管入口启动后完成。

## 文档

- [需求与验收](docs/REQUIREMENTS.md)
- [设计与实现](docs/DESIGN.md)
- [分工与交付边界](docs/WORKBREAKDOWN.md)
- [运行时调查](docs/RUNTIME_FINDINGS.md)
- [素材来源与发布边界](docs/ASSET_SOURCES.md)

过程日志位于本地 `docs/logs/CHANGELOG.md`，按仓库约定不提交。代码以 [MIT](LICENSE) 发布；游戏名称、截图与官方艺术作品的权利属于其各自权利人。
