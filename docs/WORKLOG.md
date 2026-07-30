# 工作日志

## 2026-07-30

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
