# Wukong Codex Forge

“大圣归来 · 玄金”是 Windows Codex 桌面端的原生 Chrome Theme 包。它保留当前 Codex 页面、侧栏、输入区、环境栏和全部交互，只通过 Codex 自己的 `desktop.appearance*` 设置生成玄黑、烬金、暖纸与青绿语义色。

本版本不再启动第二个 Codex、不使用 CDP、不监听端口、不创建快捷方式，也不向页面添加侧栏、底栏、按钮或宠物节点。

## 安装

下载并解压后双击 [install-theme.cmd](install-theme.cmd)，或执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

安装器执行两件事：

1. 把约 88 KB 的正式主题包放到 `%USERPROFILE%\.codex\themes\wukong-codex-forge`。
2. 只更新 `%USERPROFILE%\.codex\config.toml` 中 Codex 原生支持的主题键，并记录这些键的安装前值。

安装过程不会关闭、重启或另行启动 Codex。当前版本的实际活动值为：

- 外观：深色；代码主题：Vesper。
- 主色：`#d6a85f` 烬金。
- 表面：`#0d100e` 玄黑；正文：`#f2e4c8` 暖纸。
- diff：新增 `#86a96d`，删除 `#c86a5a`。
- UI 字体：Microsoft YaHei UI；代码字体：JetBrains Mono（均为本机回退，无网络字体）。

## 删除与恢复

双击 [remove-theme.cmd](remove-theme.cmd)，或执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\restore.ps1 -Uninstall
```

卸载只恢复本主题接管的键，然后删除 `%USERPROFILE%\.codex\themes\wukong-codex-forge`。如果某个接管值在安装后被用户再次修改，卸载器保留该新值并输出警告，不会用旧备份覆盖它。其他 Codex 配置从未进入回滚范围。

不要只手工删除主题目录：`state.json` 是安全恢复安装前主题值所需的记录。正式的“删除即原生”入口是 `remove-theme.cmd`。

## 原生能力边界

本机 Codex 26.715.2305.0 的原生 Chrome Theme schema 只接受：

- `accent`
- `contrast`
- `ink`
- `surface`
- `opaqueWindows`
- `fonts`
- `semanticColors`

它没有 `backgroundImage`、`customCss` 或 `companion` 字段。因此用户提供的 `大圣归来.jpg` 作为主题包预览与未来能力素材随包保留，但不会伪装成当前原生运行时背景。背景图、landing/thread 双背景和小悟空宠物只有通过 DOM 注入才能实现，而 0.3.0 已明确移除这条不符合“放入对应位置即可用”的交付路线。

## 开发预览

Studio 仅用于视觉构想和素材审查，不是 Codex 运行页，也不会被安装：

```powershell
npm install
npm run studio
```

打开 [http://127.0.0.1:5173/studio/](http://127.0.0.1:5173/studio/)。

## 针对性验证

```powershell
npm run validate
npm run test:native
```

- 主题定义只包含当前 Codex 原生字段。
- 安装和卸载对被管理值精确往返。
- 卸载不覆盖用户安装后的再次修改。
- PowerShell 入口可解析，且只能管理固定的 `CODEX_HOME` 主题目录。
- 任意外部卸载目标会被拒绝。

全窗口 Studio E2E 只在预览代码变化时运行：`npm run test:e2e`。

## 文档

- [需求与验收](docs/REQUIREMENTS.md)
- [设计与实现](docs/DESIGN.md)
- [分工与交付边界](docs/WORKBREAKDOWN.md)
- [素材来源与发布边界](docs/ASSET_SOURCES.md)

过程工作日志保存在本地 `docs/logs/CHANGELOG.md`，按仓库约定不提交。

代码以 [MIT](LICENSE) 发布；游戏名称、截图与官方艺术作品的权利属于其各自权利人。
