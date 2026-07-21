# Wukong Codex Forge 0.9.0 发布记录

## 便携包

- 文件：`E:\Proj\wukong-codex-forge\release\wukong-codex-forge-0.9.0-portable-20260721-183530-7655056.zip`
- 大小：2,931,727 bytes
- SHA-256：`E0A1F1E25184CC50DCC1003B4D3D3C022154DADE128738DF612594F0BD8274D3`
- 条目：35
- 保留的打包目录：`C:\Users\Alex Chen\AppData\Local\Temp\wukong-codex-forge-0.9.0-portable-20260721-183503-1369179`

最小包包含 V10 runtime、短入口安装器、启动/停用脚本、11 张 JPEG、活动小悟空/小八戒/湘妃葫芦 WebP、主题定义、README 与许可证。检查结果：没有 `node_modules`、docs、tests、tmp、Git、源 PNG、chroma、旧 V2–V6 宠物、夜叉套或神锋 UI 素材；五个必需入口/活动素材均存在。

第一次尝试使用 `Compress-Archive -LiteralPath <stage>\*`，PowerShell 因 LiteralPath 不接受通配符而拒绝，未创建 ZIP；已生成的 stage 原样保留。最终使用 `System.IO.Compression.ZipFile.CreateFromDirectory` 创建新的唯一文件，没有覆盖或删除旧 ZIP。

## 真实本机验收

普通用户开始菜单 `ChatGPT.lnk`：

- Arguments 从被截断的 1023 字符降为 178 字符。
- 原始官方快捷方式和截断失败版都已复制到 append-only 历史。
- `ChatGPT.exe` PID 26812；随机 CDP 端口 38625；watcher PID 18296。
- runtime 事件为 `reattaching` → `watching`，主题实例保留供用户审计。

真实截图：

- `docs/screenshots/live-codex-v10-autostart-landing.png/.json`：V10 battle / scene 0，2050 × 1106，sidebar 275 px，composer 736 × 98，背景 cover。
- `docs/screenshots/live-codex-v10-autostart-thread.png/.json`：V10 scenery / scene 8，composer 736 × 98，环境卡 300 × 473，assistant 透明无框。

## 验证

- 风险定向集：24/24。
- 推送前完整仓库测试：25/25。
- 原生主题定义：valid。
- 打包目录四个 PowerShell 入口：AST 解析 0 错误。
- 打包目录独立导入：主题载荷成功，包含 V10 companion payload。

## 安全与回退

没有修改 WindowsApps、`ChatGPT.exe`、`app.asar`、签名或 `config.toml`，也没有结束任何 Codex 进程。主题根不存在时，保留的短桥接脚本动态启动官方原生应用。直接 WindowsApps 可执行文件、Store AUMID、协议与第三方入口不经过主题适配器，这是避免系统级注入和崩溃风险的明确边界。
