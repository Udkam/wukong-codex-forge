# Wukong Codex Forge 0.9.0 发布记录

## 最终推荐便携包

- 文件：`E:\Proj\wukong-codex-forge\release\wukong-codex-forge-0.9.0-portable-20260721-185413-8390691.zip`
- 大小：2,932,159 bytes
- SHA-256：`BCF9F9E7C7F9B8C7490ED3ECFFF576966A76AE5FC46BC7A8C8AF6F53A07FC697`
- 条目：35
- 保留的打包/运行目录：`C:\Users\Alex Chen\AppData\Local\Temp\wukong-codex-forge-0.9.0-portable-20260721-185413-8390691`

这是唯一通过隐藏 Windows PowerShell 5.1、全新目录、全新 `.wukong-runtime\profile` 真启动的推荐包：`ChatGPT.exe` PID 45072、随机端口 34661、watcher PID 46940，事件 `starting → watching`。启动 stderr 为 0 bytes；renderer 为 V10 battle / scene 0、128 个受管标记，三项安全位均为 true。真实图为 `docs/screenshots/live-codex-v10-release-fresh-profile-landing.png/.json`。

包检查：禁用项 0、缺失活动文件 0；包含 11 张 JPEG、三张活动 WebP、短入口、V10 runtime、启动/停用脚本和文档。没有 `node_modules`、docs、tests、tmp、Git、源 PNG、chroma、旧宠物、夜叉套或神锋 UI 素材。

## 首个静态包（历史，已弃用）

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
- 最终包 fresh-profile：真实 `starting → watching`，隐藏启动 stderr 0 bytes。

### fresh-profile 发布后补充验证

首个 0.9.0 ZIP 的静态内容正确，但从全新 profile 启动时发现 Windows PowerShell 5.1 会把 renderer 未就绪时的 native stderr 提升为终止错误，提前跳过 20 秒 apply retry。该 ZIP 与其 stage 均保留作失败证据，不再作为最终推荐包；后续唯一命名的更正版将记录在本文件追加段和工作日志中。

第二个唯一包修复了 retry，但隐藏 PowerShell 5.1 子进程没有自动加载 `Get-FileHash` 模块，入口在写哈希审计事件时失败。该包、stage、profile 和 stdout/stderr 同样保留且不再推荐。入口现使用只依赖核心 .NET 的只读 SHA-256 函数。

## 安全与回退

没有修改 WindowsApps、`ChatGPT.exe`、`app.asar`、签名或 `config.toml`，也没有结束任何 Codex 进程。主题根不存在时，保留的短桥接脚本动态启动官方原生应用。直接 WindowsApps 可执行文件、Store AUMID、协议与第三方入口不经过主题适配器，这是避免系统级注入和崩溃风险的明确边界。
