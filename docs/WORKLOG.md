# 工作日志

## 2026-08-01

### V27 V23/V24 完整页证据归档与文档真值

- 复核用户指出的排队/目标上方黑带，确认生产修复已在 `1ee5256`：运行时只对当前 ASAR 的原生进度渐隐层撤下背景与透明度绘制，保留 DOM、宿主、相对位置、`28px` 高度和命中区。修复后的 V22 完整页已证明黑带消失，本检查点没有重复修改运行时代码。
- 将 V23 环境卡完整 guided 页面、V24 新建战斗稳态/转入对话/风景稳态/返回战斗四张完整页面和两份 JSON 作为不可变证据纳入 Git。PNG 均为 `2000×1125` 物理像素；V24 JSON 记录的 CSS 视口为 `1600×900`，overlay/active/image/veil 逐边全覆盖，持图为 `1 → 2 → 1 → 1`，预取始终为 `0`。
- 证据自身继续明确声明 `headless native-structure fixture; not real Codex acceptance`；README、便携说明、需求、分工与当前目标同步区分现行 V15、历史 V12/V11、待审批双宠物和最终生命周期未开始，禁止把技术门写成用户视觉通过。
- 本轮不改运行时、主题资产或宠物候选，不启动浏览器、开发服务器、调试窗口、watcher 或常驻工具；只运行证据/便携说明定向合同、diff 检查和精确暂存前安全扫描。
- `node --check` 覆盖两份定向测试；证据归档合同 2/2、最小包与便携说明合同 1/1 通过。收尾资源采样为 CPU `23%`、可用内存 `18.99 GB`、磁盘队列 `0`，项目归属进程与监听端口均为 `0`。

### V26 待审批宠物身份隔离

- 继续 Hatch Pet 母版门前复核时发现，两个新 run 的 `pet_request.json` 仍分别沿用旧冻结包 id；即使发布集合为空，这也会让后续“批准新母版”与“解冻旧失败包”无法被策略可靠区分。
- 为两个新候选改用独立 id：`little-wukong-v5-yaksha-shenfeng` 与 `little-bajie-v4-inart-game-motion`。`pets/release-policy.json` 新增 `pendingPetIds`，Node loader 与 PowerShell 安装器均强制 `released / pending / frozen` 三态两两互斥；旧包、旧 atlas、既有 Codex 用户目录和历史证据均未改写。
- 小天命人 row 4 按用户要求取消跳跃，保留 Hatch Pet v2 schema 行位但锁定为双足落地、身体高度稳定的原地移步反应；母版未获明确通过前仍不生成任何动作行。
- 本检查点只修复审批身份与动作语义合同，不把本地 base 门冒充用户视觉通过，也不启动浏览器、开发服务器、调试窗口或常驻工具。语法/PowerShell 解析 6/6 通过；`native-pets-contract` 与 `managed-package` 合计 5 pass / 2 historical skip，证明三态互斥、候选 id/row 4 语义、空批准集合安装无写入及最小包排除均成立。
- 收尾资源采样为 CPU `27.2%`、可用内存 `18.26 GB`、磁盘队列 `0`；项目归属进程与监听端口均为 `0`，没有保留调试窗口或测试子进程。

### V25 未批准宠物发布门收口

- 只读对账发现现行目标已冻结旧小天命人和旧小八戒，但 `prepare-native-pets.mjs`、`package-runtime.mjs` 与 `install-native-pets.ps1` 仍各自保留旧小八戒 v3 白名单，正式包和启动链因此仍可能携带并安装用户已否决的旧宠物。
- 新增单一 `pets/release-policy.json` 与只读 Node 校验器。当前批准集合为空，两个历史包均冻结；准备脚本只输出冻结状态，不读取候选 atlas 或改写历史包。
- 最小包继续携带安装器与策略文件，但不携带任何旧宠物 manifest、atlas、validation 或 proof。安装器先验证策略，在解析到空批准集合后立即返回，早于 CodexHome、`pets` 和 `.wukong-runtime` 的创建或事件追加。
- 定向验证：Node 语法 5/5；`native-pets-contract` 3 pass / 2 historical skip；`managed-package` 1/1。隔离证据保留在测试输出所列临时目录；未启动浏览器、开发服务器、监听端口或常驻工具。

## 2026-07-31

### V24 背景四阶段覆盖与资源门

- 新增单页四阶段定向捕获器，连续记录新建页战斗稳态、进入对话交叉淡化、对话风景稳态和返回新建页战斗稳态；四张完整 `1600×900` 页面位于 `artifacts/test-runs/v24-background-transition-2026-07-31T23-55-59-699Z/`，没有只截输入框。
- 捕获合同逐帧断言 overlay、活动层、图片层与 veil 完整覆盖视口并使用 `cover`；稳态加载数为 `1`，过渡为 `2`，预取始终为 `0`，没有全屏 filter、永久 `will-change` 或第三张纹理。返回新建页后题字和印记无需 resize 即出现，restore 后本项目 overlay/标记归零。
- 背景运行时定向测试首次出现 1 项失败，原因是旧测试仍假定 V23 已合法加入的官方环境卡不得存在；只校正该过时断言为“环境面板/卡片/标题/四行必须各自准确映射”，没有放宽原生几何或命中区合同。修正后背景状态机 8/8、像素预算与场景色板 6/6 通过。
- 捕获器只启动一个临时 headless Chromium/page，并在 `finally` 关闭；证据是原生结构 fixture，不冒充真实 Codex 安装窗口验收。本检查点只关闭背景技术门，不标记输入区实机视觉、双宠物或最终生命周期完成。

### V23 环境信息原生卡片经卷化

- 只读复核本机 `OpenAI.Codex 26.715.2305.0` 的 `thread-summary-panel-components-t019TZYb.js`，锁定 `data-pip-obstacle="thread-summary-panel"`、官方固定 `300px` 宽度、内容宿主 class token 和 `thread-summary-panel-*` 稳定 slot；生产映射不再按“环境信息”文本或截图猜祖先。
- 新增 `forge-right-panel / card / title / row` 标记。卡片宿主自身保持透明、`clip-path:none` 和原生矩形热区；暖褐纸纤维、8px 角饰、双层内沿及标题轨只画在 `pointer-events:none` 的伪元素，四行、加号、折叠箭头、链接、ARIA、滚动和原生宽高不变。
- 定向 ASAR 合同 1/1 与 `V23 maps the official 300px environment panel as paint-only scripture paper` Playwright 合同 1/1 通过；后者覆盖面板、卡片、标题、四行和加号九点命中几何、hover/focus、forced-colors 与 restore。
- 完整页面证据位于 `artifacts/test-runs/v23-environment-panel-2026-07-31T23-14-14-461Z/01-full-multi-guided.png`：侧栏、顶部栏、杨戬/悟空背景、进度 pill、两条排队消息、进行中目标、短卷输入器与环境卡同屏，队列上方黑色渐隐未回归。该图为无头原生结构 fixture，不冒充真实 Codex 窗口验收。
- 捕获器仅启动一个临时无头 browser/page，并在 `finally` 关闭；第一次因仍要求输入器高度完全等于官方 84px 而按预期 fail closed，随后把守卫修正为用户已批准的 96–120px 短卷例外，同时继续锁定宽度、底部锚点及排队/目标等量上移。失败证据原位保留，没有删除文件。
- 收尾前资源采样为 CPU `33.7%`、可用内存 `15.17 GB`、磁盘队列 `0`；进程核对只命中执行检查本身的 PowerShell，没有项目浏览器、Node helper、调试窗口或监听端口残留。本检查点不标记完整主题、双宠物或最终生命周期完成。

### V22 原生 queue 内层消息连续纸面

- 用户指出 V21 虽能按消息数分层，但每层没有衔接，视觉上仍像互不相干的卡片；同时要求以后以解包后的 Codex 原生数据为替换依据。只读复核当前 `OpenAI.Codex 26.715.2305.0` 的 `above-composer-panel-row-DClLFgUZ.js`、`queued-message-list-BofaaHos.js` 与 `codex-composer-adapter-DId2iEtu.js`，确认 V21 fixture 把每条 queued message 错误提升成了 outer panel。
- 生产拓扑现改为一个 queue outer panel 内含 N 个 `overflow-visible` message wrapper，再接一个 goal outer panel。运行时通过完整 queue list / message row class token 标记内部叶片，不猜本地化文字；fixture 同步改成同一结构，multi-guided 只产生两个 outer panel 和两个 internal queue item。
- 绘制改为连续叠页：外层面板共同承接实心暖灰黄赭底，只有首个外层面板拥有两个外部上角和固定 29px 顶饰；每条内部消息拥有独立 `paper-tile.webp`，以官方 `gap-px` 留出 1px 接缝，不使用独立外角、裁切或卡片阴影。后续 goal panel 以直边连续承接，主输入器与独立全圆 progress pill 不受该拓扑补丁影响。
- `node --check` 覆盖注入器、fixture、定向测试和捕获脚本；`tests/ui-materials-v17.test.py` 4/4 通过；只运行了 `V16 maps the native guided stack once and remaps context without a resize trigger` 一项 Playwright 定向测试并通过。新增三状态短捕获器只采 default / guided / multi-guided，证据位于 `artifacts/test-runs/v22-native-composer-stack-2026-07-31T00-40-21-809Z/`。
- multi-guided 证据中 queue outer panel 为 `710×62px`、goal outer panel 为 `710×32px`、两条内部消息均为 `684×25px` 且接缝为 1px；guided/multi-guided 的原生控件尺寸和主题前后 DOMRect 全等。截图后浏览器、项目 helper 与监听端口均为 `0`。该证据只证明无头原生结构和绘制连续性，不等于用户实机视觉验收，也不标记输入区、宠物或最终生命周期完成。
- 本轮继续遵守资源黄档串行策略；恢复后复核为 CPU `70%`、可用内存 `17.31 GB`、磁盘队列 `0`，不再启动调试窗口或追加全量测试。
- 应用户追加验收要求，捕获器为 multi-guided 状态新增 `1600×900` 完整视口。`artifacts/test-runs/v22-native-composer-stack-2026-07-31T20-58-29-782Z/14-full-multi-guided.png` 明确保留为修复前问题证据：Codex 原生 `from-token-main-surface-primary → transparent` 进度渐隐在图片工作区上形成了队列上方黑带，不标记通过。
- 生产映射新增精确的 `forge-composer-progress-fade` 标记，只接受当前 ASAR 对应的八个原生 class token，并仅清除该渐隐的背景绘制；DOM、宿主、相对位置、`28px` 高度和命中区保持不变。识别改用 layout-present 而非 opacity-visible，避免透明后观察器反复撤销/重加标记。
- 修复后完整页面证据为 `artifacts/test-runs/v22-native-composer-stack-2026-07-31T21-35-40-482Z/14-full-multi-guided.png`：黑带已消失，进度胶囊、两条排队消息、进行中目标与主输入器仍连续堆叠。捕获合同同时断言 guided / multi-guided 各有一个渐隐节点且 `background-image: none`、`opacity: 0`；定向 Playwright 1/1 通过。截图后项目归属浏览器/Node 进程为 `0`，CPU `27.6%`、可用内存 `15.68 GB`、磁盘队列 `0`。两张完整页面均为无头原生结构 fixture，不冒充真实 Codex 窗口验收。

### V21 最小包清单去除退役主题定义

- 只读审计发现页面运行时始终读取 `themes/active.json`，但 `scripts/package-runtime.mjs` 仍把历史 `themes/ink-mountain.json` 写入发布白名单；该旧定义包含已取消的葫芦、旧静态宠物、旧 companion 和过期构图参数，而且其引用资产并不由当前活动清单复制，既违背当前目标也会形成不可用的发布清单。
- 按“不删除任何文件”要求保留 `themes/ink-mountain.json` 原件，仅从最小包白名单移除。测试同时锁定 `themes/active.json` 与 `themes/native-wukong.json` 必须存在，并反向断言历史定义不得进入包。
- `tests/managed-package.test.mjs` 1/1、`tests/native-theme.test.mjs` 与 `tests/asset-pixel-budget.test.mjs` 8/8 通过；最终保留式 package proof 为 `C:\Users\ALEXCH~1\AppData\Local\Temp\wukong-runtime-sKBdii\app`，其中 active/native 为 true，legacy 与三种葫芦路径均为 false。本轮前置背景状态机/场景色板测试 15/15 亦通过。
- 未启动真实 Codex 调试窗口、浏览器服务、watcher 或常驻索引；收尾采样为 CPU `79.5%`、可用内存 `17.23 GB`、磁盘队列 `0`，本项目 helper 与监听端口均为 `0`。CPU 瞬时处于琥珀档，因此本轮不再追加重型测试或调试。本检查点只收紧正式包清单并校正文档，不标记输入区视觉、宠物或最终生命周期完成。

### V20 原生状态比例与 joined stack 角语义修正

- 用户用两张当前 Codex 原生截图再次纠正状态对应关系：排队消息与进行中目标不是各自四角卡片，而是同一个 joined stack，只允许外层左上、右上两个角；内部接缝与最下边必须为直线。新建对话主输入区也明显短于 V18 的 120px 主题版本。
- 只读像素审计测得两张原生主输入区均约 `922×124px` 物理像素；在 125% renderer 下对应约 `736×99–100px` CSS。V18 宽度误差仅约 0.22%，但 120px 高度偏高约 21%，因此保持 `184:25` 比例并把钳制范围从 `120–168px` 收到 `96–120px`，最大原生列宽处精确为 `100px`。
- editor wrapper 改为 8px 顶部安全区与原生 12px 横向内距；footer 移除主题额外内缩/上移，恢复原生 8px 横向内距和 8px 底距。五类按钮现在由完整 DOMRect 等值门禁约束，不再只比较宽高。
- joined stack 的宿主继续保持 `clip-path:none`；唯一 `pointer-events:none` 纸面层使用 `polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%, 0 8px)`，并只绘制四角源图的上半区。回归测试同时检查 `background-position` 从源图上沿开始，防止下角回流；独立 progress pill 保持全圆。
- 定向运行 `tests/native-surfaces-runtime-v14.test.mjs` 9/9 通过；背景状态机、最小运行包与原生主题相邻风险测试 18/18 通过。无头状态截图位于 `artifacts/test-runs/v20-composer-native-proportion-20260730-2/`；其中 home/guided 主纸面均为 `736×100px`，没有启动真实 Codex 调试窗口。
- 首次截图因捕获器仍保存旧 120px 守卫而按预期 fail closed；失败目录 `artifacts/test-runs/v20-composer-native-proportion-20260730-1/` 原样保留，守卫更新为当前公式后第二次截图成功。本检查点仍待用户实机视觉验收，不标记输入区或整套主题完成。
- 收尾采样为 CPU `29.71%`、可用内存 `9.97 GB`、磁盘队列 `0`，处于内存琥珀档；除当前一次性 PowerShell 检查进程外，本项目 helper 与监听端口均为 `0`。因此本轮不再启动额外 agent、浏览器或全量测试。

## 2026-07-30

### V19 首帧缓存解码与稳定刷新收口

- 定向审计发现缓存/data URL 图片可能在设置 `src` 后同步报告 `complete=true`；旧分支会绕过 `decode()` 直接公开背景 ready。现在同步 complete 与普通 onload 共用唯一解码收口，首帧像素真正可绘制前继续保留 Codex 原生 main/fade paint。
- 复跑背景合同暴露 V17 卷页接入后的观察器自循环：每轮 refresh 全量移除/重加 composer class，会让主框在 84px 与 120px 间抖动；相同“此去，欲破何局？” ARIA 的重复写入也持续唤醒 MutationObserver。运行时改为按本轮目标集合差量对账 class，并只在题字 ARIA 值变化时写入。
- 背景测试同步修正到当前授权几何：非输入区 DOMRect 仍全等；主输入器只允许高度变化，宽度与底部锚点保持；五类原生按钮的命中宽高保持不变。该修正没有撤掉布局断言。
- 定向执行 `background-runtime-v13`、解码像素、9 图场景色板、原生定义和最小运行包共 24/24 通过；其中稳定布局连续 2.2 秒 `refreshCount` 不再增长，同步 complete + 悬挂 decode 期间 ready 仍为 false。
- 本轮没有启动真实 Codex 调试窗口、浏览器服务或常驻 watcher；测试使用的无头 browser server 随测试进程退出。本检查点只完成背景首帧/稳定性修复，不标记输入区视觉、宠物或最终生命周期完成。

### V18 composer 纸面裁角与原生命中区解耦

- 按用户最新纠正继续锁定三种形状：新建对话主输入器使用受限高度四角短卷页；排队消息/进行中目标共用的 joined stack 只有左上、右上两个角且底边为直线；独立进度 pill 才是四周圆角。没有把高大审稿概念图误作真实新建页尺寸。
- 主输入器与 joined stack 的切角从原生宿主迁到 `pointer-events:none` 的 `::before` 静态纸面层。宿主自身现在为 `clip-path:none`，因此视觉轮廓不再削减原生矩形点击区域；纸面比例、宽度、底部锚点、原生 DOM、文字、按钮、ARIA 与状态关系未改变。
- Windows forced-colors 会撤下新增纸面层并继续使用系统色。无头定向回归 `tests/native-surfaces-runtime-v14.test.mjs` 9/9 通过，覆盖短卷页比例、两上角 joined stack、全圆 pill、只读/编辑器签名漂移、响应式、延迟挂载与高对比模式。
- 独立只读视觉审计没有发现 P0：三张截图中的类别、尺寸与叠层关系均符合最新结构。唯一 P1 是绘制层建立 stacking context；定向合同因此增加主卷角部宿主命中与主卷/stack 原生按钮中心命中探针，证明静态纸面层不覆盖交互控件。
- 第一轮截图因旧视觉守卫把绘制层的定位上下文误报为拓扑变化而停止，失败目录原样保留；守卫只对已识别的三个纸面宿主放行 `position/z-index/isolation`，其他坐标、尺寸、父子关系、文字、控件和语义比较保持不变。第二轮证据位于 `artifacts/test-runs/v18-paint-only-corners-20260730-qa2/`。
- 截图后资源采样为 CPU `15%`、可用内存 `18.6 GB`、磁盘队列 `0`；本项目 helper 与监听端口均为 `0`。本检查点仍待用户多轮视觉验收，不标记输入区或整套主题完成。

### V17 真实 composer 映射与上角结构收口

- 用户明确纠正：原生截图只用于说明真实 topology；排队消息与进行中目标共用的 joined stack 只有左上、右上两个角，不能使用四角条；新建对话输入框也不能照高大概念稿实现。
- 撤回 V16 的 `256:63 / 168–256px` 候选，主输入器改为 `184:25 / 120–168px`。真实 Codex `2050×1106 @ 125%` 窗口中，官方 `.composer-surface-chrome` 实测宽 `736px`，主题后主卷页约 `120px`，原生宽度、底部锚点、控件尺寸、文本和命中区不变。
- 排队与目标继续保留两个原生 row，但只在它们共同的 above-composer stack 外层绘制一次纸面。stack 的精确裁切路径为 `polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%, 0 8px)`；四角源图按 `100% 200%` 只显示上半区，因此没有下方两个角。独立进度 pill 继续保持完整圆角。
- 真实 DOM 审计定位到输入框曾漏替换的直接原因：当前 Codex 的 editor 不再稳定命中 `.ProseMirror[role=textbox]`，旧映射在标记官方 composer surface 前提前退出。运行时已改为以 `.composer-surface-chrome` 为主身份，editor class/role 只作可选辅助；新增 editor 签名漂移回归测试。
- 一次临时真实 Codex 证据位于 `artifacts/test-runs/v17-live-composer-fixed-20260730-150832/live-new-task.png`；捕获脚本在 20 秒回收检查中超时，随后只按已核验的 profile、根 PID 和专用端口停止该调试实例，并确认根进程、全部后代和端口均释放。没有按进程名批量结束任何进程；捕获脚本也已改为在回收超时时先落盘诊断报告，避免异常路径丢失 PID/端口证据。
- joined stack / progress pill / 短卷页八状态证据位于 `artifacts/test-runs/v17-composer-top-corners-20260730-1513/`。本检查点只证明当前结构与映射已修正，仍待用户多轮视觉验收，不标记输入区或整套主题完成。
- 实现检查点已精确提交并推送：`aaa5308 style: bind short scroll composer to native topology`；未暂存历史素材、截图或其他未跟踪目录。
- 再次只读核对当前安装包生产源码：composer component 是 `data-codex-composer-root` 下包含 `.composer-surface-chrome`、且排除直属 above-composer portal 的直属子节点；compact queue/goal row 使用 `border-x border-t first:rounded-t-2xl`，源码没有下角 token；独立 progress pill 使用 `rounded-3xl`。
- fixture 已删除测试专用的 `data-native-composer-component` 身份，改用生产 class 签名与直属拓扑推导；新增 component/portal 互斥、home utility 归属、上角 token 及无下角 token 断言。`tests/native-surfaces-runtime-v14.test.mjs` 定向执行 9/9 通过，结束后本项目进程与监听端口均为 0。
- 两个既有只读审计 agent 在资源与时间上限内未返回结论，本轮已中断，不把它们记作独立 PASS；主对话只记录可复现的源码、测试与进程证据。
- 生产拓扑门禁已精确提交并推送：`0483459 test: anchor composer topology to native source`；未暂存历史素材、截图或其他未跟踪目录。
- 再次以一个便携真实 Codex 实例采集新建对话：`2050×1106 @ 125%` 下 composer root 为 `736×163px`、官方 paper surface 为 `736×120px`，证据保留在 `artifacts/test-runs/v17-live-native-sizing-20260730-1708/`。便携 profile 中没有可见的排队/目标运行态，因此没有把 fixture 冒充真实运行截图；joined stack 继续由当前 ASAR 源码和无头状态夹具共同证明。
- 本轮暴露 `Browser.close` 偶发只关 renderer、不关 portable browser root 的资源泄漏。捕获器新增三重归属后的精确 `/PID` 树兜底；真实复验实际触发后 root、launcher、便携 profile 进程与专属端口均为 0。`tests/lifecycle-contract.test.mjs` 12/12、`tests/native-surfaces-runtime-v14.test.mjs` 9/9 定向通过。
- 精确调试树兜底已单独提交并推送：`9e57eeb test: close verified transient Codex tree`；该提交不含文档、历史素材或未跟踪证据。

### V16 受限高度卷页输入器

- 按用户最新确认，主输入器不再完全套用原生高度和圆角外框；宽度与底部锚点仍由 Codex 原生布局负责，外框按 `256:63` 比例响应，并限制在 `168–256px`。
- 只读复核本机 `ChatGPT.exe 26.715.2305.0` 的 composer 源码，确认多行 editor wrapper、footer grid、submit button 和上下文/目标相邻层级；运行时只给原生 surface、editor wrapper 和 footer 增加主题标记，没有创建替代输入框或控件。
- 外框使用 8 px 静态切角轮廓并取消原生圆角；editor wrapper 与 footer 获得卷页安全留白，编辑器节点本身、按钮宽高、文字、ARIA、状态拓扑和命中区继续保持原生。
- 第一版曾尝试把 `composer-main.webp` 的 alpha 直接用作 mask；自审截图暴露中央透明源会造成大面积黑洞，立即否决并改为低成本切角。失败证据保留在 `artifacts/test-runs/v16-expanded-composer-20260730-131834/`，未删除。
- 定向结果：`tests/native-surfaces-runtime-v14.test.mjs` 8/8 通过，覆盖默认、项目上下文、只读切换、排队/目标、展开、360/400/560/736/1600 响应宽度和 forced-colors；最终六状态证据位于 `artifacts/test-runs/v16-expanded-composer-20260730-132359/`。
- 调试仅使用临时无头实例，截图后核验 `PROJECT_HELPERS=0`、`PROJECT_LISTENERS=0`。期间一次采样出现 CPU 97% / 磁盘队列 4.0，未启动下一轮测试；短采样确认无本项目常驻 helper 后等待资源恢复至绿档再继续。
- 本检查点仍待用户视觉审计，不标记输入区或整套主题完成。

## 2026-07-28

### V16 新建页中心构图收敛

- 撤下已被否决的卡通短棍/微缩武器方向；新建页改用 Steam 官方《黑神话：悟空》透明 logo 中的“悟空”书法与朱印，不生成或猜画器物。
- 用户实机截图确认旧字标过小后，原生 `[data-testid="home-icon"]` 继续保持 `56×56`，但绘制伪元素扩为 `168×168`；336×336 双倍资产的可见边界为 `282×191`，映射约 `141×96`，是旧版约三倍。绘制层绝对定位，不改变 host DOMRect、布局或热区，也不使用 filter、动画或持续合成提示。
- 题字伪元素从原生 30 px 光学收至 `27px`（`.9em`），字距收至 `.035em`，只在原题字矩形内上移 2 px；父节点 DOMRect、原文字节点和命中区不变。
- 按用户要求，“新建任务”和“描述目标，Codex 会在当前项目中开始工作。”仅在主题激活时视觉透明；原文本、布局占位和停用恢复均保留。
- 场景 0 / 4 / 8 使用深墨字标，其余场景使用骨色字标；没有运行时滤镜、动画、额外 DOM、定时器或网络请求。三倍版四张活动战斗背景证据位于 `artifacts/test-runs/v16-landing-threefold-20260728T3/`；独立审计确认杨戬场景未遮挡头部、三尖两刃刀或跃起动作。
- 当前仍是可回退的无头实现检查点；没有启动真实 Codex 调试窗口，也不据此标记整个主题完成。

### V15 多背景表面适配

- 输入框继续严格使用本机 Codex 原生 `736×84` 几何：恢复完整四边和角饰，把边框绘制宽度收为上下 `14px`、左右 `18px`，并仅在原生 `44px` 编辑区内部增加 `6px` 顶部安全区；根框、编辑器与五类按钮的 DOMRect 和命中区均未变化。
- 纸面综合色阶统一调整为暖灰黄赭色，四类素材中位色约为 `RGB(122–125,105–110,85–90)`；不用 GPU filter，使输入框在杨戬白墨、金箍棒暖金、幽蓝战斗及五张风景背景上保持同一材质关系。
- 侧栏不再声称复刻完整《游记》页面；保留一级暗墨纸、二级文字与当前项浅纸的对应关系，同时改为透明底加 `.76 → .62` 低成本暗幕，让同一全窗背景连续贯穿侧栏，且不启用 `backdrop-filter`。
- 新建页金箍棒继续使用真实模型截取素材；将杆身压到深赭、旧金纹提亮，并加入约半个原生像素的深褐轮廓，保证明亮背景由暗杆身辨识、暗背景由金纹辨识，不加卡通光晕或运行时滤镜。
- 定向结果：纸面/素材像素合同 4/4，原生几何、状态、命中区与金箍棒锚点 9/9，背景首帧、全窗覆盖与图库状态机 11/11。无头截图位于 `artifacts/test-runs/v15-composer-sidebar-mark-20260728T-review5/`；两个独立只读视觉审计均未发现阻断差异。
- 当前只形成可回退的实现检查点；尚未打开真实 Codex 调试窗口，也不据此标记整套主题或最终生命周期验收完成。

### V15 侧栏《游记》状态关系修复

- 重新核对一级目录条、二级对话条与三态素材：默认/展开态继续使用深墨纸浅字，真正的 `aria-current` 入口、项目或对话才使用浅纸深墨字。
- 移除顶部入口、项目、对话在展开、悬停、焦点与选中状态中的朱砂左缘；保留原生未读点、运行圈及其语义，不用装饰红线冒充状态。
- 当前项目容器也可按原生 `aria-current` 获得浅纸材质；单纯展开项目不再被误判为当前项。
- 对浅纸当前项的可见文字、图标和按钮统一施加深墨色，同时避开原生状态提示节点。
- 第一轮独立截图审计发现键盘焦点仍像现代圆角细框；第二轮已移除 CSS 描边，改由墨纸本身的轻微明暗变化表达悬停和焦点，同时保留可辨识的键盘状态。
- 第二轮无头状态矩阵确认一级/二级对应关系、白底黑字选中态与无轮廓焦点；定向 ASAR、侧栏/composer 与背景状态机测试 20/20 通过。真实 Codex 窗口验收仍留在本轮最终单窗口检查，不据此标记整套主题完成。

### V15 composer 只读态真实锚点修复

- 只读核对本机 `ChatGPT.exe 26.715.2305.0` ASAR：composer 身份由 `data-thread-find-composer`、`composer-surface-chrome` 与 `ProseMirror[role=textbox]` 共同确定；`contenteditable` 仅是原生交互状态。
- 生产映射不再要求 `contenteditable="true"`，因此编辑器暂时只读、发送按钮禁用或 React 动态切换编辑状态时，纸面材质仍挂在唯一可见原生 composer 上。
- apply/state/probe 增加可见原生 composer 与已主题化 composer 的覆盖率门禁，不再允许“背景成功但输入区静默漏替换”被报告为成功。
- 新增只读态与 `false → true → false → true` 动态切换合同；原生 DOMRect、`contenteditable`、`aria-readonly`、`disabled` 与 `aria-disabled` 保持不变。
- 定向结果：当前 ASAR 1/1、composer/侧栏/forced-colors 9/9、背景状态机 10/10；未启动 Codex 调试窗口。该段将独立提交并推送，便于回退。

## 2026-07-25

### V15 否决背景撤下

- 按用户最新审稿从 active/default/native preview 和最小运行包撤下 `destined-afterimage.jpg` 与 `yaksha-king-rift.jpg`；两个文件均未删除、移动或覆盖。
- 活动图库从 11 张收敛为 9 张：2 张主战斗、2 张次级战斗、5 张风景；默认回退改为 1920×1080 `great-sage-staff.jpg`。
- 解码总量从 22,220,472 px 降至 19,258,880 px，最坏双图过渡仍为 4,743,680 px。
- 定向结果：资源/最小包/原生定义/场景色板 12/12，背景状态机与原生表面 18/18；真实 Codex 截图与调试资源回收仍待本轮后续执行。

### 解码像素硬预算

- 在既有压缩字节上限之外，为 JPEG、PNG、WebP 增加无需完整解码的尺寸头检查。
- 单背景上限 12,000,000 px；图库唯一文件总计 32,000,000 px；最大两张过渡图合计 16,000,000 px；单 UI/装饰图 4,194,304 px。
- 活动 11 图实测总计 22,220,472 px，最大两张合计 4,743,680 px；8 张 UI WebP 单张最大 580,608 px。
- 内存内构造的 100,000×100,000 PNG 会在 payload 组装前被拒绝；无需生成或保留超大测试文件。
- `great-sage-return.jpg` 仍为 1256×707，明确保留为低于 1080p 的视觉质量待办。
- 定向结果：像素预算/最小包 4/4，原生主题定义验证通过；未启动第二个 Codex 窗口。

### V15 输入纸面暗化

- 将 composer main、strip、pill 与 paper tile 从同一透明源统一暗化到暖灰褐综合色阶；四张产物中位色为 `RGB(125,109,92)` 至 `RGB(126,113,97)`。
- 移除运行时常驻暗化 filter，保留原生文字、按钮、ARIA、几何与命中区。
- 定向像素、材质、原生表面、forced-colors 与最小包门禁通过。
- 提交并推送：`afd2c1f style: darken V15 composer paper palette`。
- 用户实机视觉验收仍未完成，不标记整套输入区完成。

### V13 首帧与全窗竞态修复

- 修复 120/420 ms 启动探针被合并成约 520 ms 单次刷新的调度缺陷。
- `childList` 现在识别既有主题外壳内部后补内容；零尺寸标题、图标和新建页 main 进入 ResizeObserver。
- 可见对话优先于 `opacity:0` 的残留新建页，避免 thread 被错误归类为 landing。
- 新增首次提交与 resize 后 overlay/layer/image/veil 等于 viewport 的 DOMRect 合同，以及 `<300 ms` 延迟挂载、内部挂载和双页面重叠用例。
- 定向结果：`background-runtime-v13` 8/8，`native-surfaces-runtime-v14` delayed shell 1/1。
- 本里程碑不启动第二个 Codex 窗口；首图 ready/overlay generation 竞态留给下一独立提交。

### V13 首图 ready 与 overlay generation

- 首张背景改为单请求解码后提交；`data-forge-background-ready` 之前保留 Codex 原生 main/fade paint。
- CDP `Runtime.evaluate` 显式等待 apply Promise，安装器与 watcher 不会在首图尚未解码时提前宣称成功。
- 覆盖层在交叉淡化中被删除或损坏时立即撤销 ready、取消旧 generation 的 timer/预载并恢复原生 paint；新层完成解码后以单活动层重新公开。
- `ACTIVE_PROBE` 与主题状态合同同时要求 root ready、overlay ready、两层结构和真实活动图。
- 定向结果：背景状态机 10/10、V15 原生表面 7/7、生命周期关键合同 2/2、最小包/保留式安装 4/4。
- 未启动第二个 Codex 窗口；真实 Codex 视觉验收仍待后续单窗口里程碑。

### V13 快速导航 timer 上限

- 每次新的路由/提交复核先取消上一组 route timer，再登记最新 3 个有界探针。
- 100 次连续 history 变化时 `routeTimers.size <= 3`，最后一组期限结束后回到 0。
- 定向结果：快速导航与刷新合同 2/2；无窗口、服务或端口残留。
