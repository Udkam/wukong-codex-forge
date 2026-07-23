# 大圣归来 · 潇湘双境 — 设计与实现

> **0.12.3 / V13.3 现行设计。** V13.2 及更早章节保留为演变记录；冲突处以 `CURRENT_GOAL.md` 和本节为准。

## V13.3：原生背景状态机、资源硬预算与首帧可靠的新建页

V13.1 的活动范围只有全窗背景与用户明确授权的新建页题字/图案，不恢复任何旧 sidebar、composer、环境卡、消息、按钮或滚动条样式。页面增加一个 `aria-hidden`、`inert`、`pointer-events:none` 的 `#wukong-forge-background`；覆盖层仍有两个 image/veil layer，画面 `cover` 全窗，战斗池为索引 0–5，风景池为索引 6–10。

### 官方 UI 源锚点与完整覆盖

只读检查 `OpenAI.Codex_26.715.2305.0` 的 `app.asar` 后，V13.1 不再通过猜测祖先来清透明度。官方 `app-shell-CHGA5kyS.js` 创建 `<main class="main-surface">`，官方 CSS 为它绘制 `--color-token-main-surface-primary`；这正是用户截图中只剩侧栏可见背景的黑块。活动 CSS 直接命中 `main.main-surface` 与 `[data-app-shell-main-content-top-fade]`，只把 `background-color/background-image` 清空，圆角、阴影、overflow、尺寸与事件全部继续由 Codex 管理。

新建页使用官方 `app-main-B98AP2a1.js` 的两个稳定节点：`[data-testid="home-icon"]` 是 56×56 原图标位，`[data-feature="game-source"]` 是原 headline 位。图案原位绘制两端带赤金箍纹的金箍棒与三道墨尾，题字原位显示“此去，欲破何局？”。实现只用伪元素：原始文字节点、原始 SVG、原生 hover 容器和 DOMRect 均保留，停用时还原 aria 与所有标记。官方 headline 内的项目选择按钮自带点状下划线；主题激活时只把这条原生装饰透明化，避免它穿过替换题字，停用后由移除样式完整恢复。完整只读证据见 `artifacts/asar-ui-audit-20260724T0225/AUDIT.md`。

官方 hero 通过 280 ms opacity 动画进入。V13.3 以“有布局但尚未绘制”作为稳定节点判据，并把 `game-source`、`home-icon` 与新建任务容器加入结构监听；另有 120/420 ms 两次 renderer 内启动探测作为有界兜底，之后页面不轮询。题字与图案的 CSS 锚点改为主题自有 `data-forge-title-copy` / `data-forge-mark`，不再依赖 React 后续 commit 可能覆写的 `className`。因此首次启动、路由切换、延迟挂载和动画后 class 回写都不再依赖窗口缩放。

V13 重写了切换状态机：

1. 读取 session 游标时把负数、字符串和越界状态归一到 `-1`，随后在各自池内安全推进。
2. landing 优先于旧 thread 证据；祖先链上的 `hidden`、`aria-hidden`、`inert`、`display:none`、`visibility:hidden` 或 `opacity≤.01` 都会使旧 turn 失效。
3. 普通侧栏按钮不再触发换图；只有真实新任务、路由/历史变化、任务树导航或 composer 提交安排有限次复核。
4. 非首帧先通过 `Image` 加载并尝试 `decode()`；成功后才翻转双层 opacity。切换进行中只保留最后一个待提交场景，避免快速导航造成黑帧。
5. 覆盖层缺失或层数不为 2 时原位重建；watcher 探针同时检查 style、runtime、两层、活动层和非空活动图。
6. ResizeObserver 只在 workspace 身份变化时重绑，不在每次 refresh 中断开再观察；稳定页面必须达到 refresh quiescence。
7. 杨戬白场使用更高 specificity 的 veil，避免被后置主题变量覆盖；forced-colors 下背景隐藏并恢复系统 `Canvas`。

### V13.3 资源硬预算

活动图库的 11 张图片压缩共 2.45 MiB，但全部展开为 RGBA 约 84.76 MiB。旧实现首次 `refresh()` 会主动创建 11 个 `Image` 并解码全部背景；两个全屏层在淡变后仍保留上一张图片，且永久使用 `will-change`、滤镜和轻微缩放。这些成本会在反复调试重注入时叠加。

V13.2–V13.3 改为：

1. 首屏直接使用当前 CSS 背景，不额外构造预载 `Image`。
2. 只有真实场景切换才解码目标一张；任意时刻最多一个请求，新请求先取消旧请求。
3. 成功、失败、超时、请求替换和 runtime dispose 共用同一清理路径：清 timeout、事件处理器、`src` 和 in-flight 记录。
4. 图层行内只保存短 `var(--forge-bg-N)`，不再复制完整 base64 URL。
5. 过渡结束立即把退场层的图片、veil、位置、亮度与场景数据清空；稳态只有一张图片。
6. `will-change: opacity` 只在 `data-forge-transitioning=true` 的 820 ms 过渡内存在；全屏 `filter` 与 `scale(1.001)` 被移除，色调只由廉价 veil 完成。

资源合同的理论上限是稳态约 7.91–10.19 MiB RGBA，过渡期约 15.82–20.38 MiB；不做相邻场景或跨模式预取。

V13.3 在真实 Codex renderer 稳态采样时为 `loadedLayers=1`、`preloadInFlight=0`、`transitioning=false`，V8 heap 使用约 126.3 MiB。另一个完整调试 Codex 实例会带起 48 个进程，稳定工作集约 2.93 GiB；这不是单张主题背景的占用，却会直接造成双窗口卡顿。因此开发期常态只保留控制窗口：调试实例仅在实机截图与指标采集期间临时启动，完成后立即关闭，并独立核验其 watcher、子进程与专用端口均已释放。

### V8 composer 预览边界

V7 因 footer 分隔线、透明可读性和控件遮挡被整体否决。V8 的“残卷墨界 / 石印绳契 / 丹炉铜契”只在 `docs/design/composer-options/v8-black-myth-silhouette-study-20260723/` 审稿：宿主仍为原生 `736×96`，装饰限制在 0–7 px 与 89–96 px 的安全边缘，placeholder、plus、权限、模型、麦克风和发送键保持原位。用户未选择前，V13 runtime 和最小包不加载 V8 CSS。

### 开发期启动适配器（非最终交付）

现有稳定安装仍把最小包写入新的 `releases/<版本-时间>/app` 并保留 hash bridge，供临时调试实例回归。调试窗口不能在截图或指标采集后继续保留；关闭后必须核验 launcher、watcher、子进程和专用端口均已释放。`capture-live-playwright.mjs` 的普通模式只连接、截图而不擅自关闭任意窗口；只有显式提供临时 root PID、launcher PID、disable request 且 CDP browser PID 匹配时，`--close-debug-after-capture true` 才会先等待原生恢复，再关闭该一次性 browser，并验证 root、owner 与端口释放。该入口是开发期工具，不再宣称为“下载即用”的最终启动集成。按用户要求，最终随 Codex 启动而启动、随 Codex 关闭而关闭的宿主级方案必须等全部背景、新建页、composer 和 Hatch Pet 视觉工作完成后再单独设计与验证，且不能只依赖 PowerShell。

开发期 watcher 当前仍每 1700 ms 检查一次 loopback renderer，并在目标新建或主题状态缺失时重应用；真实采样中它的工作集约 51.8 MiB，launcher 约 115.1 MiB。这是临时审计链的已知成本，不与“renderer 页面没有常驻布局/动画轮询”混为一谈，也不满足最终最小资源启动合同。最终宿主方案必须消除 PowerShell launcher 与低频 CDP 轮询，而不是仅调整间隔后宣称完成。

该适配器只覆盖这两个经过验证的入口；Store AppX、AUMID、协议或第三方固定项可绕过它。已经运行且没有远程调试端口的普通 Codex renderer 不能被文件复制热附加，安装器因此不关闭或伪装修改当前控制窗口；V13 在下一次从受管入口启动时生效。

### 新录制的动作证据边界

`Replay 2026-07-24 00-30-17.mkv` 是用户为小天命人补录的动作参考。跑动可以提取步频、支撑脚、躯干起伏和持棍惯性；棍花只有背面视角，只能证明背部剪影、重心转移、脚步与棍路连续性。它不能单独证明正面握法、脸部、厌火套正面细节或被身体遮挡的神锋棍段。动作审计可以追加逐帧证据，但在完整基础角色通过前不得生成或写入 canonical atlas。

> **0.11.0 / V12 历史设计。** 以下章节继续保留；冲突处以 V13 为准。

## V12：背景正式化，组件先审后装

V12 把活动 runtime 收敛到一个职责：在不改变 Codex 原生 UI 的前提下提供战斗/风景双场景背景。`#wukong-forge-background` 内含两个 fixed layer；每层分为 image 与 veil，使用 `cover`、独立焦点和 820 ms opacity 交叉淡变。新建任务从索引 0–5 的战斗池轮换，对话从索引 6–10 的风景池轮换，两组 cursor 分开写入 sessionStorage。背景节点无语义、无交互并在强制高对比模式隐藏。

V11 的 sidebar、composer、Environment 卡、消息、按钮、滚动条和 motif 样式文件继续留在仓库，但 V12 plan 主动退役 V4–V11 runtime key，清除旧标记和旧 overlay，不再把这些视觉写进页面。

### composer 审稿合同

V1–V3 的共性失败是“主体仍为原生圆角框，只在外面贴古风边条或微缩道具”。V4 `夜叉护匣 · 神锋发令` 继续失败：把完整夜叉衣甲、护腕和神锋裁成极窄碎片后，装备结构与材质全部失真。V5 又退化为泛用棱角面板；V6 的 `厌火襟匣` 在 1× 下读成宝石徽章，`如意棍枕` 读成科幻状态条。V1–V6 全部冻结，不进入 runtime，不再沿用“装备切片贴边”或“把完整武器拉成输入框”的构成方法。

下一候选必须同时满足：

| 约束 | 设计合同 |
| --- | --- |
| 形状 | 在原生边界内改变 composer 的整体轮廓与层次，不围一圈泛古风边框，不把完整装备压成细条 |
| 元素分工 | 夜叉套与神锋由小天命人完整承担；金箍棒由战斗背景完整承担。composer 不再被要求同时塞入三件元素 |
| composer 语汇 | 只提取游戏 UI 的留白、墨迹断口、器物边缘、拓印层次与克制的信息层级；不能依赖标题才被读成《黑神话：悟空》 |
| 原生合同 | 保留 `736×96` / `560×96`、32×32 发送命中区、提示词、footer、键盘导航与可访问语义 |
| 审稿 | 必须提交真实 Codex 1× 全窗、4× 局部、浅/深背景、125% 缩放与强制高对比证据，用户批准后才可集成 |

候选所有装饰四向外扩为 0；不加标题、道具状态珠、新控件、emoji 或解释性文案。源图不足时停在素材审计，不通过 imagegen 猜画夜叉套或武器。

### Hatch Pet 动作一致性

宠物沿用官方 v2 8×11 映射。跑动和 hover 行必须与其余行保持同一角色、同一比例、同一装备与同一渲染风格。小八戒 repair-v2 已按“持耙捧腹前俯蓄势 → 更深前俯 → 后仰抬头大笑峰值 → 肩腹二次弹起 → 回落衔接”形成独立候选；一手始终持完整九齿钉耙，另一手捧腹。小天命人当前基础立绘不是有效 identity anchor：兽棍·神锋只画出棍首与前段，握持点后的后棍身和尾端缺失；角色右腿/右脚仍为普通布绑与裸足，没有厌火魔足。base、repair-v2 与其派生图集全部冻结。本地录像已由用户确认不符合要求，动作线暂停；等待用户后续录制后先重建完整基础角色，再建立 repair-v3，不使用现有抽帧凑动作。

冻结不通过删除实现。V12 在 `prepare-native-pets.mjs`、`package-runtime.mjs` 与 `install-native-pets.ps1` 三处使用同一显式发布白名单；旧悟空 spec、仓库包、图集、证明、候选和用户已有 discovery 目录全部保留，但不再被读取、复制、迁移、升级或记录。Codex 若已发现旧目录，仍可原样显示；新 V12 不修改用户当前宠物选择。

> **0.10.0 / V11 现行设计。** 下方 V10、V9 章节保留路线演变；冲突处以本节为准。

## V11 设计结论

V11 将“原生”定义为保留 Codex 的信息架构、槽位几何、文字、图标和交互，而不是冻结所有视觉轮廓。主题不得改变菜单栏、侧栏、内容列、composer、环境信息卡的坐标和宽高，也不得增加任何栏、控制器或文案；但可以在原节点上替换圆角、切角、边线、材质层和空内容伪元素，使其成为真正的《黑神话：悟空》样式，而非颜色主题。

### 组件造型语汇

| 原生组件 | V11 形状替换 | 黑神话语义 | 不变合同 |
| --- | --- | --- | --- |
| 侧栏操作项 | 2 px 主轮廓、经匣式切角底片、短朱砂签/青玉选中脊 | 经卷匣、朱砂批签、珍玩槽 | DOMRect、文字、图标、点击区域 |
| 输入器 | 7 px 收束轮廓、短漆木/青玉轨、角部压线 | 典籍匣与棍饰金属包角 | 原宽高、位置、padding、工具与提示文字 |
| 发送键 | 同尺寸八角朱砂印 | 丹丸、印信与火漆 | 按钮尺寸、图标、可访问名称 |
| 环境信息卡 | 5 px 匣角、题签短轨、行级细分隔 | 经匣目录、珍玩陈列格 | 卡片宽高、原行顺序、原按钮与文字 |
| 用户气泡 | 原尺寸材质替换 | 漆面与旧金薄边 | padding、文字、位置 |
| 助手回答 | 完全透明 | 不做“古风卡片” | 所有祖先无背景、无边框、无阴影 |

所有造型只使用 CSS 背景、边线与伪元素，不添加 emoji、武器贴图、标题牌或新按钮。兽棍、葫芦、珍玩、精魄与丹药只贡献比例、切角和材质语言，不把道具图片贴满组件。

### 背景与色板

背景仍只有一个 `body::before` 固定层，`inset:0`、`background-size:cover`。每张图同时输出 `--forge-scene-veil` 与 `--forge-scene-brightness`；页面状态只输出 `--forge-mode-veil`。`body::after` 将二者合成，所以切换 battle/scenery 不会覆盖场景自身的可读性修正。对话背景按路径与 hash 稳定选择，不再因标题流式更新而跳图。杨戬白场采用偏右焦点，使杨戬与天命人都留在常见裁切区。

### 原生 Hatch Pet

V11 删除活动页面里的静态悟空/八戒 DOM 覆盖层，只保留一个无交互湘妃葫芦 motif。两位角色通过 Codex 原生宠物目录加载：

- 小悟空：厌火夜叉套 + 兽棍·神锋，锁定游科官方天命人 1/12 手办与游戏装备图标。
- 小八戒：锁定 INART 官方 1/12 的灰黑猪脸、旧青衣、念珠、腰封，以及恰好九枚分离耙齿的九齿钉耙；可爱来自较短吻部、圆润脸颊和柔和眼神，不变成粉色幼猪。
- 两者均使用 v2 `1536×2288`、8×11、单格 `192×208` 的完整动画图集；未通过逐行、四向、16 向、连续性、透明边缘与三方盲审的候选不得进入安装包。

### V11 恢复边界

主题停用时移除 `forge-*` 标记、V11 样式、运行时状态和单一葫芦层；助手祖先链回到官方 computed style。宠物是 Codex 原生包，不以静态 CSS 假装“宠物”。官方扫描器会过滤顶层 junction，所以启动器创建真实发现目录，并在内部建立 `payload` junction 指向主题包；派生 manifest 只引用词法上仍位于发现目录内的 `payload/spritesheet.webp`。这既通过官方 `Dirent.isDirectory()` 与路径范围检查，又避免复制 atlas。主题载荷目录不存在后 payload 图集不可读，刷新宠物列表即不再加载。整个路径不修改 `ChatGPT.exe`、WindowsApps 或 `app.asar`，内容冲突时不覆盖；早期直接副本迁移前会把原 manifest 保存为 `source-pet.json`，旧 atlas 保留。

> **0.9.0 / V10 当前设计。** 后文 V9 伪元素与固定矿色描述保留作历史，不再代表活动实现。

## V10 设计结论

V10 的重点不是给原生界面统一蒙一层深色，而是让每张电影画面决定自身的“界面矿物”。`SCENE_TONES` 为 11 张背景分别定义 ink、paper、topbar、sidebar、composer、environment card、user bubble、code、menu 与 veil；白场杨戬使用冷墨青灰，夜叉王使用漆红与焦铜，山林场景使用松石、苔灰与岩绿。背景切换和 chrome 配色是同一个原子状态，避免“图换了、界面仍是上一张图的颜色”。

组件继续保留 Codex 原生几何与文字：只改已有表面的颜色、边线、阴影与背景透明度，不设宽高、外边距、网格或文案。助手回答祖先链保持透明无框；输入器仍使用官方 25 px 圆角和原始高度，不做武器形输入框、装备贴图或额外工具按钮。

## 独立同行者层

运行时只新增一个 body 直属容器：

```html
<div id="wukong-forge-pet-overlay" data-forge-owned="pet-overlay" aria-hidden="true" inert>
  <i data-forge-pet="little-wukong" hidden></i>
  <i data-forge-pet="little-bajie" hidden></i>
  <i data-forge-pet="xiangfei-gourd" hidden></i>
</div>
```

容器与三个子元素均 `position:fixed`、`pointer-events:none`，不属于 composer、sidebar 或环境卡的布局树。小悟空和小八戒分别以 `workspace-left-floor` 与 `workspace-right-floor` 站在工作区底边；landing 使用约 112 px 档，thread 使用约 92 px 档。湘妃葫芦依次尝试 `landing-hero-left`、`right-card-foot` 与 `workspace-upper-rail`。每次结构变化、视口变化或视觉视口滚动后，用真实 DOMRect 检查标题、正文、代码块、composer 和环境卡碰撞，不安全即隐藏；900 px 以下全部收敛隐藏。恢复时整个受管覆盖层移除。

两位同行者使用本轮重新生成的透明 WebP：小悟空保留可信猴脸、单根毛发、青玉旧甲、红绳与金棍；小八戒保留野猪面部、粗硬鬃毛、旧青袍、念珠与九枚清晰耙齿。它们只做低振幅呼吸/摇摆，`prefers-reduced-motion` 与 forced-colors 下禁用。完整提示词、参考图与编辑链见 [PET_GENERATION.md](PET_GENERATION.md)。

## 普通入口与回退

`start-theme.cmd` 先安装用户级普通 `ChatGPT.lnk` 适配器，再调用原有安全启动器。V10 不再把完整 PowerShell 代码塞进 `.lnk`：Windows 将其截断到 1023 字符。安装器把完整 ASCII-safe 脚本按内容 SHA-256 命名，写入 `%USERPROFILE%\.codex\themes\wukong-codex-forge\history\launcher-bridges`，快捷方式只保留 178 字符 `-File` 参数。桥接脚本存在但主题根缺失时，动态定位当前 Store 包并原生启动。所有旧快捷方式先复制到 `history\shortcut-backups`，不覆盖历史。

主题启动器使用隔离 profile 和随机 loopback 端口；端口文件出现后允许 20 秒有界连接重试，再允许 20 秒 renderer 生效重试。只有 `THEME_STATE` 确认为 V10 active 才进入 watcher。watcher 不安装服务或开机项，并在连续 8 个 1.7 秒周期没有 Codex renderer 后自行退出。官方 Windows 版关掉所有窗口后仍可保留主进程、renderer 与托盘，因此再次启动时，launcher 同时设置相同 `CODEX_ELECTRON_USER_DATA_PATH`、传入相同 `--user-data-dir` 和官方 `codex://launch`，命中该 profile 的 `second-instance`。验收不依赖可能失真的 DOM visibility，而只读取受管根 PID 的 `MainWindowHandle`；6 秒未复显会重试一次，仍失败则明确返回非零，不调用 Win32 窗口操控 API。

这一处理来自对官方 26.715.2305.0 `bootstrap`、`main` 和 `window-all-closed` 打包文件的只读审计：Windows 分支不会在 `window-all-closed` 中 `app.quit()`，`codex://launch` 会进入 `showPrimaryWindow({stealFocus:true})`，其他第二实例参数也由主窗口管理器执行 restore/show/focus。主题不修改这些文件，只适配它们公开表现出的生命周期。

## V10 真实几何

普通快捷方式启动的 2050 × 1106 生产窗口实测：landing 为 `battle/scene 0`，thread 为 `scenery/scene 8`；侧栏 275 px、composer 736 × 98 / 25 px 圆角，thread 环境卡 300 × 473。背景为单层 embedded JPEG、`background-size:cover`；助手回答 computed style 为透明背景、无阴影、0 px 圆角。覆盖层元素不接收鼠标，三项安全位均为 true。

## 设计结论

本轮不做“深色界面加金边”，也不用古风卡片、书法标签、emoji 或装饰按钮制造主题感。视觉核心是“真实电影画面 + 潇湘矿色 + 两位同行者”：杨戬、大圣、夜叉王和黑神话风景承担画面张力，湘妃葫芦提供石青识别，小悟空与小八戒提供角色温度。夜叉套、兽棍·神锋和武器条已按用户最终意见停用。

页面仍然是 Codex：定位、尺寸、文案、图标、事件和三栏结构均不改。主题仅在现有节点上增加 class / dataset，使用背景层和空内容伪元素替换表面。

## 双境状态

| Codex 页面 | 主题状态 | 用途 |
| --- | --- | --- |
| 新建任务 / landing | **战斗境** `data-forge-mode="battle"` | 任务开始前给出最强张力和角色识别 |
| 已进入对话 / thread | **风景境** `data-forge-mode="scenery"` | 长时间阅读时降低角色冲突，保留世界感 |

这一映射不提供开关按钮，由运行时根据可见页面语义自动判断。对话 data 属性、virtualized turn、assistant 包装和新建页原生标题是依据；`supportsNewChatMenu` 与 pathname 都不能单独判断页面状态。

## 场景系统

| 索引 | 文件 | 分组 | 视觉主体 |
| --- | --- | --- | --- |
| 0 | `erlang-ink-duel.jpg` | battle-primary | 水墨杨戬与大圣对决，战斗境首幕 |
| 1 | `great-sage-return.jpg` | battle-primary | 大圣归来剪影与残阳 |
| 2 | `great-sage-staff.jpg` | battle-primary | 金箍棒与大圣甲胄特写 |
| 3 | `yaksha-king-rift.jpg` | battle-secondary | 夜叉王红色裂焰 |
| 4 | `storm-bearer.jpg` | battle-secondary | 雷法、棍势与青蓝强光 |
| 5 | `shadow-confrontation.jpg` | battle-secondary | 蓝色光柱下的巨影对峙 |
| 6 | `ridge-gate.jpg` | scenery | 日色岭谷与山门 |
| 7 | `forest-shrine.jpg` | scenery | 雾林寺院 |
| 8 | `mountain-path.jpg` | scenery | 山道、石灯与天光 |
| 9 | `stone-buddhas.jpg` | scenery | 佛窟、造像与暗部烛火 |
| 10 | `sunset-ravine.jpg` | scenery | 晚霞山峡 |

战斗境第一次进入固定为索引 0；从 thread 返回 landing 后依次使用三张主场景，每第四次使用一张次场景。风景境使用 `location.pathname + document.title` 的 FNV-1a 稳定哈希，同一任务刷新后仍保持同图。两种状态都不使用计时轮播、视频解码或运行时网络请求。

## 伴随元素与组件映射

| 元素 | 设计特征 | 落点 |
| --- | --- | --- |
| 小悟空 | 以用户本地实机帧为主体依据，保留青色鳞甲、猴脸、尾巴与棍，透明背景 | landing 输入器左侧空白沟槽 88 × 98 px；thread 收敛为 62 × 70 px |
| 小八戒 | 以实机截图与影神图交叉核对，保留旧青袍、念珠、猪首与九齿钉耙，透明背景 | landing 输入器右侧空白沟槽 92 × 100 px；thread 收敛为 68 × 74 px |
| 湘妃葫芦 | 游戏图标中的青绿双节、银白泪痕、蓝绳与流苏 | 优先位于输入器左侧剩余沟槽，右侧回退；landing 42 × 64 px，thread 34 × 52 px |
| 侧栏 / 环境卡 | 墨铁底、石青窄边、旧金发丝线、漆褐暗纹 | 只换材质，不显示人物或装备 |

三件伴随元素均使用透明 WebP。人物静止，不做呼吸循环；全部 `pointer-events:none`。V9 在初始化、关键结构新增/移除、侧栏/提交动作和窗口尺寸变化时计算候选矩形；若与标题、用户气泡、助手回答、代码块或右侧环境卡相交则隐藏。宽度小于 900 px 隐藏葫芦，小于 780 px 隐藏两位同行者。原始 PNG 与被否决素材保留在仓库工作树或 Git 历史，但最小运行包不复制。

## 配色与明度

| 角色 | 色值 | 用法 |
| --- | --- | --- |
| 骨白 | `#e5dfd4` | 正文和关键标题 |
| 漆褐 | `#7c4438` / `#4f2e28` | 用户气泡右缘与小面积暗纹 |
| 潇湘石青 | `#4f7f7c` / `#82aaa4` | focus、选中边与次级信息 |
| 旧金 | `#a88755` / `#c6ad7d` | 链接、分隔发丝线与小面积热点 |
| 墨铁 | `#171917` / `#252825` | 基层、侧栏和稳定阅读表面 |

配色是画面的承托，不是主题本身。战斗境主体区遮罩较薄，确保杨戬、夜叉王和金箍棒可识别；风景境只在文字左右增加方向性 veil，不把图压成近黑。

## 原生几何和内容契约

- 不对顶部栏、侧栏、项目树、环境行、消息和输入槽位设置 `width`、`height`、`margin`、`padding`、`gap` 或 `transform`；只有 composer 保留 `position:relative` 作为同行者伪元素坐标系，DOMRect 必须保持一致。
- composer 只在实际组合框宽 360–960 px、高 58 px 至 `min(480 px, 48vh)` 且位于页面底部时标记；外层过宽 `form` 不再降级命中，长输入也不会突然失去样式。
- 环境栏只标记面积最大的一个候选容器，防止多层嵌套同时变成卡片。
- 从实际 `[data-local-conversation-final-assistant]` 开始，只清理到其所属 turn 的真实包装链，去除背景、边框、阴影、outline 和 filter；不越过 turn 污染工作区。代码块可保留独立黑铁表面。
- 用户气泡只更换不占布局的材质与轮廓。注入前后对话 `innerText` 必须逐字一致。
- 唯一新增节点是 `head` 内的受管 `<style>`；body 内不新增任何 UI。人物与葫芦分别使用 composer/workspace 的伪元素，不抢占 DOM 或点击命中。

## 恢复与兼容

恢复表达式会断开结构 `MutationObserver`，取消侧栏/提交复核定时器，移除 popstate、hashchange、resize、click、keydown listener、style、class、`data-forge-mark`、状态与三项碰撞属性，并清除葫芦定位变量。强制高对比模式下禁用所有图片伪元素，优先保证系统可访问性。

便携启动器使用解压目录内 `.wukong-runtime` 的隔离 web profile 和随机回环端口，不写官方程序文件。0.8.0 使用 Codex 自带 `cua_node` 与仅依赖 `http`、`crypto`、`zlib` 的回环协议客户端，不携带 npm 依赖树。11 张背景在变量载荷中各编码一次，`--forge-art-*` 只引用对应 `--forge-bg-*`；当前变量载荷 3,654,150 字符，完整样式 3,670,925 字符。停用必须验证 V4–V9 style/class/mark/runtime 全部消失后才成功；磁盘文件由脚本原样保留。关闭主题窗口后，用户自行删除整个解压目录即可回到普通 Codex。已经运行且没有 CDP 端口的普通 Codex 无法从外部热注入，这是 Chromium 运行边界。
