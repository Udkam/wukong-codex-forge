# Codex 样式运行时调查

## 结论

Windows Codex 26.715.2305.0 的原生 Chrome Theme 只能表达颜色、字体和语义色，不能表达背景图、组件切角或 landing/thread 状态。外部修改 `config.toml` 也不会让已打开窗口热加载。因此“深度样式替换”需要受控运行时 CSS；只放置原生主题文件只能得到用户已否决的颜色变化。

## 已确认的本机边界

1. `desktop.appearance*ChromeTheme` 支持 accent、contrast、ink、surface、opaqueWindows、fonts 和 semanticColors，不支持 backgroundImage/customCss/companion。
2. `codex://codex-app/apply-config` 只处理远程连接配置，不刷新桌面外观。
3. 当前主进程没有对外部 `config.toml` 写入的外观 watcher。
4. 已安装 Chromium 150 会忽略默认用户数据目录上的远程调试参数；受管隔离 profile 可建立随机回环调试通道。
5. 当前生产 renderer 暴露 conversation/composer/message/new-chat 数据属性，可避免依赖哈希 class。

## 路线比较

| 路线 | 背景/组件样式 | 当前窗口热清理 | 风险结论 |
| --- | --- | --- | --- |
| 只写原生配置 | 否，只能换色 | 否 | 稳定但不满足需求 |
| 修改 `app.asar`/WindowsApps | 是 | 需重启 | 破坏签名与更新，不采用 |
| 任意进程注入 | 是 | 理论可行 | 崩溃与安全风险高，不采用 |
| 受管随机回环 CSS | 是 | 是 | 官方文件零写入，可清理，当前采用 |

## 为什么需要受管入口

已经运行的普通 Codex 没有调试通道，外部文件复制无法取得 renderer。强行补丁官方包与“使用成本最优、不得导致崩溃”的要求冲突。安装器因此不强关当前窗口，只创建 `Codex - Wukong Theme`：它启动官方 `ChatGPT.exe`，但为 Chromium web 数据使用主题私有 profile，并把调试端口限制在 `127.0.0.1` 的随机端口。

watcher 只接受 `app://codex/` 或本地开发页目标；WebSocket URL 必须是 loopback。它检查一个 style/runtime probe，缺失时才重新注入；Codex 退出后两次短暂断连即结束。卸载请求先触发 RESTORE_EXPRESSION，再处理磁盘恢复。

## 真实验收边界

- TOML、state、包结构和 fixture 自动测试只能证明交付契约。
- 两张 `runtime-style-*.png` 是生产 DOM 形态 fixture，不是当前 Codex 窗口。
- 当前普通 Codex 进程没有被重启；在从受管入口完成一次真实启动和截图前，生产视觉认证仍为待完成。
- 大版本更新若改变数据属性或多窗口结构，必须重新执行真实截图审计；几何 fallback 不是无限兼容承诺。
