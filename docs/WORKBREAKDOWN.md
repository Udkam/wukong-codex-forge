# 多对话分工与交付边界

> **V15 当前分工。** 旧分工继续保留为历史。

| 工作流 | 本轮责任 | 当前结论 / 门槛 |
| --- | --- | --- |
| 主对话 · native geometry | 只读解析当前 `ChatGPT.exe/app.asar`，把官方 token、class 结构和响应式公式写入 fixture/漂移合同 | 已完成 composer/topbar/基础 sidebar baseline；除用户明确授权的主输入器外框外，任何尺寸改动必须先有本机源码证据 |
| `background_first_frame_audit` | 只读复核首屏探针、延迟挂载、背景解码与 overlay 自修复竞态 | 定位 120/420 ms 探针折叠、既有外壳内部挂载、透明旧 hero 路由优先级、首图 ready 和 overlay generation 风险；主对话已逐项修复并写入 10 项背景状态机门禁 |
| `background_contract_tests_audit` | 只读复核全窗、首帧、分类、过渡、恢复与静止期测试合同 | 确认旧 fixture 未覆盖真实 viewport DOMRect 与透明 hero/可见 thread 重叠；主对话已增加初始/resize 全视口、<300 ms 延迟挂载、内部挂载及路由重叠用例 |
| `background_resource_audit` | 只读量化 11 图、CDP 注入、双层纹理、观察器、watcher 与调试实例成本 | 11 图压缩 2.454 MiB；当前稳态/过渡持图策略合理。主对话已把单图/图库/双图过渡/UI 的解码像素门禁写入 payload 组装前；Blob/分批注册须先过 CSP 与逐像素等价验证，未贸然集成 |
| `composer_edge_audit_v11` | 只读补齐 sidebar 项目/对话 hierarchy、class 与状态锚点 | 已完成；确认生产 `data-app-action-sidebar-*` 锚点、Tasks/Projects 层级及 active/expanded/collapsed 状态，主对话已写入正式 fixture 与运行时 |
| `sidebar_state_audit` | 只读核对一级/二级/顶部入口的原生 current、disabled、unread、running 与内部控件边界 | 已完成；确认未读/运行由原生 trailing indicator 负责，内部 section/project 控件不能被误画成整行 |
| `topbar_menu_audit` | 只读核对四个应用菜单触发器和 Electron 下拉边界 | 已完成；触发器使用 `aria-haspopup=menu` / `aria-expanded`，下拉本体由主进程原生菜单绘制，不在 renderer DOM |
| `css_state_review` | 只读复核状态 selector、forced-colors specificity 与禁用传播风险 | 已完成；发现并修复尾部按钮误禁整行、expanded/collapsed focus 被吞和高对比回退优先级 |
| `asar_state_contract` | 为当前 ASAR 的 nav/task/status/spinner 增加漂移合同 | 已完成并定向通过；不绑定压缩变量名，不修改或覆盖应用包 |
| 主对话 · sidebar/topbar states | 实现完整 paint 状态、动态刷新、几何/热区/ARIA 门禁和状态截图 | headless 7/7、相关背景/原生主题/最小包 11/11 通过；独立状态截图已生成，用户实机视觉仍待验收 |
| 主对话 · V15 materials | 将用户最终输入器三图和游记目录素材裁成统一纸面/深墨/浅纸 nine-slice | 已把四类输入纸面统一暗化到目标中位色；活动 composer 已切回完整山水/云纹源，不再使用中央透明的错误 mask，真实 Codex 视觉仍待多轮验收 |
| `asar_composer_contract` | 只读核对正式注入链、当前 ASAR composer/stack/pill 拓扑、原生尺寸和命中区风险 | 确认正式链为 `forge-background-v13.css`；queue/goal 只有上角、progress 独立全圆；指出活体宿主 `clip-path` 会削减角部热区，主对话已迁到绘制层 |
| `composer_visual_mapping_audit` | 只读像素对照用户最新原生 home/guided 截图与 V18/V20 状态截图 | 证明 V18 宽度误差仅 0.22%，但 120px 主框高度偏高约 21%；当前目标为 `736×99–100px`。确认 joined stack 只允许整体两个上角、内部接缝与底边直线，progress 独立全圆 |
| 主对话 · V20 composer native proportion | 保持原生 DOM、底锚、控件坐标与命中区，把新建对话/运行态主卷页收敛到用户最新截图比例，并锁死 joined stack 角语义 | `184:25` 钳制为 `96–120px`，`736px` 宽时为 `100px`；editor wrapper 恢复原生横向内距，footer 恢复原生坐标。joined stack 只绘制两个上角且不生成下角；定向回归 9/9、相邻背景/包测试 18/18、V20 状态截图通过，等待用户实机视觉审计 |
| 主对话 · V19 first-frame/quiescence | 修复缓存背景 ready 竞态与稳定页面标记重贴造成的观察器自循环；不改变图库、遮罩、构图或输入器验收形状 | 同步 complete 仍等待 decode；标记按目标集合差量对账，相同题字 ARIA 不重复写入。背景/资源/包定向 24/24，稳定 2.2 秒无新增 refresh，未启动真实调试窗口 |
| 主对话 · transient review cleanup | 临时真实窗口截图后按归属关闭并证明无残留 | 普通 capture 不关窗；显式清理需 launcher + disable request + CDP browser PID 三重一致。Windows Electron 根进程超时仅允许精确 `/PID` 树兜底；真实复验后 root/owner/profile process/port 均为 0，生命周期定向测试 12/12 |
| `landing_composition_audit` | 只读审计官方“悟空”书法三倍版的垂直位置、标题比例与人物遮挡风险 | 有效约 141×96 px、题字 27 px / `.035em`；杨戬场景确认未遮挡头部、武器或动作，且两行原生说明不可见 |
| `landing_threefold_multiscene_audit` | 只读复核四张活动战斗背景上的三倍字标 | 检查 0/1/2/3 场景人物焦点、字标/题字间距、深浅版可读性与 56×56 host / 168×168 paint 合同 |
| 主对话 · landing mark | 撤下卡通/微缩器物，改用官方“悟空”书法与朱印；视觉隐藏原生 kicker/描述说明 | 深浅两张 336×336 WebP、56×56 原生锚点、168×168 三倍绘制层、四战斗场景 fixture、原文本/DOMRect/restore 与最小包门禁进入定向验收；仍待用户实机视觉通过 |
| 主对话 · decoded asset guard | 在不启动调试窗口的前提下阻断高压缩率超大位图造成的解码峰值 | 9 图总计 19,258,880 px、最坏双图 4,743,680 px；内存内超大 PNG 拒绝、实际 JPEG/WebP 头解析与最小包导入通过 |
| 主对话 · rejected background withdrawal | 按用户最新审稿撤下候选大圣图与原夜叉王裂焰图，同时保留源文件 | 活动图库收敛为 9 图、解码总量降至 19,258,880 px；active/default/native preview/最小包排除合同已通过，等待单一临时 Codex 实机截图 |
| 主对话 · pets | 使用 Hatch Pet v2 重做小天命人和小八戒 | 已新建 v5 小天命人和 v4 小八戒独立 run；base 候选通过本地完整武器、双足/九齿、透明边缘和 192×208 留白门，等待用户母版审计；未通过前不扩散动作 |
| 主对话 · startup | 最后实现非 PowerShell 的宿主生命周期绑定 | 视觉与宠物全部验收前不得开始或宣称完成 |

### V15 小步推送门禁

1. 原生尺寸与 fixture 基线，以及主输入器外框的唯一授权例外。
2. composer 暗色纸面与相邻条统一色阶。
3. 新建页 56×56 印记。
4. sidebar hierarchy 与完整状态矩阵。
5. composer 卷页比例、受限高度、1:1 材质与相邻条层级。
6. 真实 Codex 单窗口截图、差异修正与资源核验。

每一项只精确暂存自身路径，跑覆盖本项风险的测试后立即 commit/push；用户未验收的项继续标记为进行中，禁止合并成“整体完成”。

> **0.12.3 / V13.3 历史分工。** 以下内容继续保留；冲突处以 V15 为准。

| 工作流 | 本轮责任 | 当前结论 / 门槛 |
| --- | --- | --- |
| `background_runtime_audit` | 只读核对 6+5 素材、V12 实际安装状态和场景状态机 | 证明源码 11 张素材 SHA 均不同，但本机仍是旧 0.8；定位 ResizeObserver 循环、白场 veil 覆盖、误判、任意点击换图、坏游标与未解码切换等缺陷 |
| `startup_chain_audit_v2` | 只读核对当前进程、普通/AppX 入口、旧 bridge 和受管 release | 证明当前控制窗口由 AppX 原生入口启动且无 CDP/watcher；指出旧 shortcut 仍锁定 Temp 0.9，要求 retained release + 唯一名称入口 + 安装后 verifier |
| `v7_composer_audit` | 独立审查 V7 原生尺寸输入框 | 否决两案：footer 横线、控件遮挡、透明可读性和伪 4× 证据不合格；未改 runtime |
| 主对话 · V8 | 在 736×96 fixture 内制作零外扩预览 | 形成残卷墨界、石印绳契、丹炉铜契三案，但后续证明 fixture 改变 overflow、产生 1–2 px 几何漂移并使用伪图标；整体冻结，未集成 |
| `composer_art_direction` | 只读提出不依赖贴图的黑神话结构方向 | 给出章回残墨、金箍锁锋与大圣翎影的核心锚点；要求凝墨留白、残纸/朱点、器物断口优先于古风金框 |
| `composer_geometry_audit` | 只读对照真实 composer 与 V8 fixture | 证明生产实测为 736×98，V8 固定 96 px 不可信；制定主题前后 DOMRect/文字/ARIA/五点命中区全等与零重资源门槛 |
| `composer_critic` | 隐名复核 V1–V8 的黑神话识别度 | 严格否决八轮泛古风、器物切片和暗色锯齿方案；要求下一轮隐藏标题后仍能靠结构辨识 |
| 主对话 · composer V9 | 合并美术、几何与资源审计，制作三案双宽度预览和浏览器证据 | 章回残墨 / 金箍锁锋 / 大圣翎影已通过 736/560、98/154、DOMRect、ARIA、命中区和零重资源合同；仅供用户选择，未改 runtime |
| `recorded_motion_audit` | 只读审计用户新录制的跑动与背面棍花 | 只允许追加逐帧证据；背面视角不得外推正面握法、脸部、厌火套正面或被遮挡武器段 |
| 主对话 · V13.1 | 只读核对官方 renderer 源、修复主表面覆盖、原位替换 landing 题字/图案、定向测试、临时调试窗口实审、文档与 Git | 源码定位 `main.main-surface` / top fade / 56×56 icon / headline；全窗覆盖实机证据已完成，旧调试窗口已回收 |
| `resource_runtime_audit` | 只读核对背景运行时、GPU 图层和取消路径 | 定位全量预载、双层常驻、不可取消解码、永久 `will-change`、全屏滤镜/缩放与 base64 行内复制 |
| `asset_budget_audit` | 只读统计 11 张活动背景的压缩与 RGBA 成本 | 压缩 2.45 MiB、全量展开 84.76 MiB；制定稳态 1 张、过渡最多 2 张且不预取的预算 |
| 主对话 · V13.2 | 清理会话资源、实现单请求按需解码、旧层释放、过渡期合成提示和资源遥测 | 已释放 98 个重复工具后代；资源定向测试 4/4；稳态 1 图层、0 解码请求的真实 renderer 证据已完成 |
| 主对话 · V13.3 | 修复新建页只在 resize 后替换、消除原生横线、重绘 56×56 候选图案、采集一次实机首帧与资源证据后立即回收调试实例 | 探针、内部挂载、双向重叠、首图 decode-ready、overlay generation 和初始/resize 全视口 DOMRect 已通过背景 10/10、原生表面 7/7 与最小包/保留式安装 4/4；实机视觉仍保持待验收 |
| 最终启动集成 | 全部视觉与宠物完成后再设计宿主级随启随停 | 当前 PowerShell bridge 仅为开发入口；本阶段不得把它包装成最终“下载即用”方案 |

所有子工作流均不得删除、移动、覆盖源录像、游戏目录、旧候选或既有证据。共享正式目录、机器安装、精确暂存、commit 和 push 只由主对话执行。常态只保留控制窗口；实机调试窗口由主对话临时启动，截图/采样后立即关闭并完成资源核验。

> **0.11.0 / V12 历史分工。** 下表继续保留；冲突处以 V13 为准。

| 工作流 | 本轮责任 | 当前结论 / 门槛 |
| --- | --- | --- |
| `startup_release_audit` | 只读核对普通启动失效、release、快捷方式桥接与官方宠物 identity | 发现开始菜单仍指向旧 Temp bridge；官方 identity 来自顶层 discovery 目录名，必须稳定；审计未改文件 |
| `composer_concepts` | 以真实 Codex 几何产出并盲审候选 | V1–V6 全部失败并冻结；V5 为泛用棱角面板，V6 为宝石徽章/科幻武器条，均未改 runtime |
| `composer_art_direction_critic` | 独立只读美术审计 | 确认 V3 是贴图套壳；给出 1× 可识别、神锋三层结构和零外扩验收门槛 |
| `pet_hover_repair` | 只改 v2 row 1、2、4 动作候选 | 小八戒 repair-v2 已形成独立候选；小天命人 repair-v2 因真实跑动/棍花不足继续否决 |
| `wukong_motion_reference` | 只读审计用户录像与游戏动作族 | 用户确认本地视频均不符合要求，已停止扫描；既有 contact 仅为失败/辅助证据，等待用户新录制 |
| `yaksha_local_resource_audit` | 只读核对本地夜叉套模组纹理族和安全提取边界 | 仅验证 UE Pak v11 索引与纹理族；无可信解包器，未解包、未预览、不绕过加密或 DRM |
| `black_myth_ui_shape_audit` | 只读筛选 TipsImg/图片中的原生 UI 形状参考 | 仅追加 contact sheet 与报告；不扫视频，不改 runtime/pets/tests/docs |
| `yaksha_official_reference` | 核对游科/官方授权手办的夜叉套、神锋与金箍棒结构 | 只给出结构参考与来源，不直接写入运行包 |
| `invalid_pet_release_gate` | 只读审计错误小天命人进入发行/安装链的路径 | 已落地三重白名单；旧包与已有 discovery 保留，新 V12 不读取、不复制、不迁移、不升级 |
| 主对话 | V12 背景、保留式安装、候选视觉否决/集成、真实窗口审计、文档与 Git | 未通过 contact sheet / 真实 1× 视觉审查的候选不得进入 canonical 或 runtime |

所有子工作流只能创建追加式候选与证据；共享正式目录、安装、精确暂存、commit 和 push 只由主对话执行。任何被否决文件原位保留。

> **0.10.0 / V11 当前分工。** V10、V9 分工继续保留为历史。

## V11 并行工作流

| 工作流 | 当前责任 | 交付门槛 |
| --- | --- | --- |
| `bajie_v2_finish` | 以 INART 1/12 重做更可爱的小八戒；锁定灰黑猪脸、旧青衣、念珠、腰封和九齿钉耙 | canonical 先审；每帧恰好九枚分离齿；再扩展九行与 16 向 |
| `wukong_v4_yaksha` | 以游科天命人夜叉套 1/12 和游戏装备图标制作小悟空 | 厌火面、灰袍、妖臂/魔足不对称、兽棍·神锋端部结构逐帧一致 |
| `theme_native_style_audit` | 只读审计 sidebar、composer、环境卡、assistant 与原生槽位 | 结论由主对话落地：允许轮廓替换、禁止尺寸/文字/结构变化 |
| 主对话 | 统一主题代码、文档、Hatch Pet 验证、原生包集成、真实窗口审计、Git 发布 | 三方盲审、定向测试、真实 PNG+JSON、精确 commit/push |

两只宠物必须先冻结 canonical，才能并行动画。任何对角色脸、套装或武器的否决都会停止该角色的动画扩散，失败稿继续保留但不进入 manifest。共享工作树中的最终整合、安装和暂存只由主对话执行。

V11 并行工作流已闭环：`bajie_v2_finish` 交付 INART 结构的小八戒 candidate C；三位隔离盲审分别完成方向识别与标准动作语义复核；主对话完成小悟空锁定、官方加载器只读核验、payload-junction 安装、真实窗口切换、定向测试和发布整合。子对话未改写最终发布目录。

> **0.9.0 / V10 追加分工。** 下方 0.8.0 分工原样保留。

## V10 并行审计

| 只读子对话 | 职责 | 主对话采用的结论 |
| --- | --- | --- |
| 启动生命周期审计 | 复核重启后失效、普通快捷方式、官方入口与安全边界 | 证明普通 `ChatGPT.exe` 没有调试参数、watcher 或启动项；否决修改 WindowsApps/IFEO/DLL，改为用户普通快捷方式 + 缺根原生回退。 |
| 宠物与色板架构审计 | 复核小悟空、小八戒、湘妃葫芦落点和多背景配色 | 宠物迁出 composer 伪元素，统一进入无交互 fixed overlay；为每张背景建立独立 surface tokens。 |
| 测试合同审计 | 复核 V9 测试是否只证明源码正则与伪装饰 | 新增独立覆盖层、场景色板、短入口、启动竞态与真实普通入口验收；要求截图同时保留 DOM 状态 JSON。 |

子对话只做只读分析，没有并行写仓库。主对话负责全部图片生成、色键处理、代码修改、快捷方式安装、真实窗口审计、测试、文档、打包和发布，避免共享工作树冲突。

## V10 交付拆分

1. 用高保真参考重新生成小悟空与持九齿钉耙的小八戒，保留 chroma、透明 PNG、WebP 三层版本化资产。
2. 把三件伴随元素迁移为 body 直属独立覆盖层，增加碰撞、窄屏、forced-colors 与 reduced-motion 合同。
3. 为 11 张背景配置 11 组自适应 chrome tone，覆盖 topbar/sidebar/composer/environment/user/code/menu。
4. 将运行时升级为 V10，并保持回答无框、原生几何、文字零改写和完整 restore。
5. 安装普通 ChatGPT 快捷方式适配器；保留官方原件与失败版本，修复 1023 字符截断和 DevTools 端口发布竞态。
6. 用普通快捷方式启动真实生产窗口，采集 landing/thread PNG + JSON；保留窗口供用户现场审计。
7. 运行覆盖当前风险的 24 项定向测试，随后制作 append-only 0.9.0 便携包、精确暂存、提交与推送。

本轮按用户要求启用三个并行子对话做只读审计，由主对话统一决策、修改、测试、安装与发布。子对话不直接写仓库，避免并行覆盖。

## 并行审计

| 对话 | 模型 / 推理 | 职责 | 对主实现的影响 |
| --- | --- | --- | --- |
| `asset_research` | `gpt-5.6-sol` / `xhigh` | 审计湘妃葫芦、小悟空、小八戒候选与旧素材残留 | 否决首轮及 V2 的泛化贴纸感；转向用户实机悟空帧、八戒实机/影神图和游戏湘妃葫芦图标，形成 V6 紧裁透明素材；夜叉套/神锋仅保留历史文件 |
| `visual_architecture` | `gpt-5.6-sol` / `high` | 审计三件装饰落点、碰撞与原生几何风险 | 否决把宠物贴进侧栏、环境卡或输入框；确定输入器左右空白沟槽、湘妃葫芦回退位置、landing/thread 两档尺寸及窄屏隐藏规则 |
| `runtime_qa` | `gpt-5.6-terra` / `high` | 审计下载即用、删除回原生、依赖与停用证明 | 发现外部开始菜单快捷方式和全局 Node/依赖树破坏便携性；收敛为官方 Codex Node + 无第三方依赖的回环协议客户端 + 包内 profile 的闭环 |

## 主对话责任

| 责任域 | 交付 | 证据 |
| --- | --- | --- |
| 产品边界 | 新建页战斗境、对话页风景境；无额外 UI、无文字改写、无尺寸修改 | `REQUIREMENTS.md` |
| 素材筛选 | 整理 11 张用户提供画面，用新的水墨杨戬替换旧杨戬图，统一压缩 | `themes/assets/` 和 `ASSET_SOURCES.md` |
| 高保真伴随元素 | 从实机与游戏图标依据制作小悟空 V6、小八戒 V6、湘妃葫芦紧裁 WebP；被否决候选不进入运行包但原文件保留 | `themes/motifs/` |
| DOM 适配 | 双境状态、稳定风景哈希、战斗场景循环、composer 尺寸筛选、助手祖先链透明化 | 动态 fixture |
| 视觉实现 | 潇湘矿色侧栏、输入器左右沟槽双同行者、旁侧湘妃葫芦、无人物环境卡、多背景 | 原生基线 + 定向实渲染与真实窗口截图 |
| Windows 生命周期 | 包内 profile/state、Codex 内置 Node、同启停 watcher、renderer 验证停用与 append-only 保留 | 便携包 / 零删除合同 |
| 发布 | 精确 diff、只暂存本轮文件、commit、push | Git 本地与远端 SHA |

## 0.8.0 里程碑

1. 素材仓扩展为 11 张电影画面，按 battle-primary、battle-secondary 和 scenery 分组。
2. 用户指定的白场水墨杨戬图替换旧梅山杨戬背景。
3. 新建任务页和对话页按用户最后指令反转为“战斗 / 风景”。
4. 停用夜叉套、兽棍·神锋与武器条；引入湘妃葫芦、小悟空实机 V6、小八戒实机 V6，并实现碰撞避让。
5. 修复输入框拉长、thread 判定、助手外壳、环境卡嵌套及装饰遮挡五类风险。
6. 直接读取 `app.asar` 的 UI 文件后，把 fixture 收敛到 275 px 侧栏、46 px 工具栏、736 px composer 和 300 px 浮动环境卡。
7. 运行包不含全局依赖、外部快捷方式、源 PNG 或停用素材；解压目录之外不留主题状态。
8. V9 将 DOM 监听收敛为仅处理关键新增/移除节点的 `childList` 结构观察器，排除属性、文字、滚动、逐字输入和焦点监听；同 PID 原生/主题稳态采样未测得常驻增量。
9. 首次生效验证门控要求 `--apply` 回读 V9 成功后才记录 watcher；最终 release `0.8.0-20260721-113129` 已在同一受管 Codex 进程内完成原生→主题热切换。其 V9 CSS、注入计划与活动主题和真实截图版逐字节一致，启动器另增主题根目录重解析点拒绝。
10. 定向回归、真实生产窗口审计、append-only 本地安装和单轮推送是本里程碑的完成条件。

## 交接规则

- fixture 截图不得称为真实 Codex 生产截图。
- 不修改 `app.asar`、WindowsApps、`ChatGPT.exe` 或官方快捷方式。
- 不强关 Codex；已打开普通 Codex 无端口时，明确报告无法原窗口热注入。
- 主对话及公共安装/停用入口不删除或移动任何文件；失败中间物与旧 release 原位保留。
- 不增加主题侧栏、底栏、状态卡或 in-app 开关。
- 不用整份 `config.toml` 备份覆盖用户后续设置。
- 每轮只运行覆盖当前变更风险的测试，并精确暂存路径。
