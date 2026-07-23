# Local work log

## 2026-07-23 — V12 背景收敛、输入框再设计与保留式升级

- 用户将正式活动范围收敛为背景替换；侧栏、顶部栏、环境信息、消息、按钮、滚动条与 composer 的 V11 样式全部退出活动 runtime，旧文件原样保留。
- 新增 V12 双固定背景层：6 张战斗图用于新建任务、5 张风景图用于对话，两池独立轮换、`cover` 全窗并以 820 ms 交叉淡变。
- 只读核对当前 `OpenAI.Codex 26.715.2305.0` app.asar，确认 composer 原生 surface、footer/测量节点和 Hatch Pet identity 由 discovery 目录名决定。
- 输入框 V1–V4 均被否决并原样保留：V4 把夜叉衣甲、护腕与神锋裁成极窄碎片后出现明显失真，不进入 runtime，停止“装备切片贴边”路线。
- 宠物首轮 row 1/2/4 候选通过图集验证但视觉不合格：小天命人跑动行换成不同 Q 版角色，小八戒持耙动作失真；候选保留且未写入 canonical。
- 小八戒 repair-v2 已形成独立候选：一手持完整九齿钉耙、一手捧腹，模仿“大笑奶龙”的前俯—后仰—肩腹弹起节奏；atlas SHA-256 为 `e553bf09e234bcaff67f43a2f3a2f6ae446a5abc70ddec322b7682edf0ca478a`，尚未写入 canonical。
- 小天命人 repair-v2 保持了同一角色身份，但跑动和棍花仍未达到游戏动作保真要求，继续否决；下一版改用用户本地录像连续帧和真实动作族名称建立相位图。
- `D:\SteamLibrary\steamapps\common\BlackMythWukong` 与 `E:\GameRecord\Black Myth Wukong` 纳入只读素材范围；允许索引、hash、复制式抽帧和项目内新增派生物，禁止删除、移动或覆盖任意原文件。
- 官方来源重新分栏：黑神话官方微博“天命人·夜叉王厌火套 1/12”是厌火套主锚点；INART `Yaksha King 1/12` 是夜叉王 Boss 本体，不能作为天命人衣甲依据。此前混用结论全部作废。
- 修复稳定/便携 disable 判定、停止/恢复入口、install-phase 宠物注册与开始菜单 bridge reparse 防护。
- 宠物升级改为稳定 discovery 目录 + hash 版本 payload；current metadata 写前复制到唯一 history，旧 payload 和 metadata 不删除。
- 定向生命周期、保留式安装与原生宠物合同 16/16 通过；视觉候选仍以人工审查为门槛。

## 2026-07-20 — 大圣归来深度主题重构

- 判定旧版只达到“背景可显示与可恢复”的技术线，不满足深度视觉设计。
- 审查本地主题参考目录、现有 Studio/运行时、真实 ChatGPT 进程与 OpenAI.Codex 包。
- 从用户素材目录比较多张 1080p/1440p 候选，最终保留用户点名的 `大圣归来.jpg`：构图更适合新建页，且只有 78 KB。
- 建立“残卷入梦”双态视觉：landing 高显影、thread 低显影。
- 实现 schema v2、主题即时开关、MutationObserver 重标记、生命周期 watcher、受管启动器与快捷方式。
- schema/素材 7/7、生命周期 3/3、运行时状态 2/2、Studio E2E 与受管导入均通过。
- 修复无来源 renderer 访问 localStorage 的降级、switch 点击命中和 Studio 画布纵横比。
- 复审 landing/thread/运行时四张真实浏览器截图；双态差异、小行者空间关系和恢复边界成立。
- 待完成：精确 diff、commit、push，以及安装最终受管副本与开始菜单入口。
- 首个里程碑已提交并推送为 476c3bd；安装前复核发现旧安装器会复制整个开发仓库。
- 将受管安装收窄到运行时必需目录和 ws；受管导入与生命周期测试再次通过。
- 首次真实快捷方式安装暴露 Windows PowerShell 5.1 对无 BOM 中文脚本源码的错误解码；已按 state marker 精确卸载 3.46 MB 管理目录和乱码快捷方式。
- 快捷方式叶名改为 ASCII `ChatGPT - Wukong Theme.lnk`，并确认 scripts 全部 ASCII-safe；生命周期和受管导入复测通过。
- 用户收紧验收边界为“原生 Codex 页面只换主题”：删除运行时主题按钮、landing 标题卡、宠物状态气泡和 Studio 底部素材栏；CSS 不再覆盖宿主几何属性。
- 新增原生三栏 Codex fixture，主题前后逐槽比较坐标与尺寸，并断言 companion 关闭时 body 不增加任何受管节点。
- 新增 `install-theme.cmd` / `remove-theme.cmd`；安装默认创建受管入口，卸载即回归原生。
- 根据第二次视觉反馈，隐藏 Studio 最左侧整块主题参数编辑栏，画布改为全窗口；README 与 E2E 均以无编辑栏的主题页面为准。
- 根据第三次反馈，删除预览中的“主题状态 / RUNTIME”内容，将右栏改回 Codex 原生“环境信息”；同时移除悟字顶栏、启字按钮、定制落地标题和主题状态文案。
- 新增本地 `capture-live.mjs`，用于主题重启后通过回环 CDP 捕获真实 Codex renderer 与 Forge DOM 摘要；真实对话截图只写入忽略目录。
- 首次真实启动复核发现 Codex 内置 Chromium 150 会忽略默认用户数据目录上的远程调试参数，导致主题 watcher 无法接管 renderer；启动器改用受管隔离 profile，并明确不复制或读取原 Codex 凭据。
- 用户明确正式交付模型为“放入 Codex 对应位置即可使用”，因此终止 CDP/独立实例路线；核对本机 Codex 原生 `desktop.appearance*ChromeTheme` schema 后，将 0.3.0 重构为 `~/.codex/themes/wukong-codex-forge` 原生主题包。
- 原生主题只管理 accent、contrast、ink、surface、opaqueWindows、fonts 与 semanticColors；背景图、双页面状态和宠物没有原生字段，保留为预览素材并停止伪装成运行时能力。
- 新增按 TOML 键记录/恢复的安装引擎；卸载保留安装后用户再次修改的值，不回滚整份配置。移除 launcher、watcher、9222、独立 profile、开始菜单入口及全部 CDP 运行时代码。
- 用户真实窗口截图确认外观没有变化；进一步只读核对 Codex 26.715.2305.0 主进程，确认桌面外观只在启动时初始化，外部 `config.toml` 写入没有文件监听或公开热加载深链。
- 排除 `codex://codex-app/apply-config`：该入口只处理 `~/.codex/codex-app/config.json` 的 SSH/远程连接 schema，与 `desktop.appearance*` 无关。
- 安装/恢复脚本改为检测已运行的 ChatGPT 进程并输出明确的延迟生效警告；需求、设计、分工和运行时调查文档撤销“磁盘写入即视觉生效”的错误结论。
- 用户将验收标准明确提升为“样式替换而非颜色主题”：背景、新对话页、侧栏按钮、输入框必须出现全新视觉，同时严格保留原生三栏布局且不增加侧栏、底栏或主题按钮。
- 新增 V4 运行时样式层和当前 Codex DOM 标记器；采用“玄铁古卷 + 火漆烬金”，新对话高显影、对话中低显影，侧栏切角金/青玉侧刃与玄铁卷轴输入框均已实渲染。
- 新增动态状态与视觉定向测试；修复样式层覆盖输入框原生定位的问题，最终 2/2 通过并逐槽验证原生几何不变、清理后无受管节点残留。
- 用户否决暗系视觉后，将 V4 样式层改为“日照宣纸 + 暖金朱砂”：全局切换 light color-scheme，侧栏/顶栏/右栏采用浅米宣纸，正文用深墨，保留夕照截图的暖色主视觉。
- 新增工作区原生任务栏识别与浅色样式；新对话标题改为朱砂书卷字，输入框改为米白卷轴面，消息块采用浅金与青玉分层，仅代码块保留深色以维持可读性。
- 视觉测试增加双状态亮度下限和亮度差断言；landing/thread 实渲染均超过 155 平均亮度，2/2 定向测试通过且所有原生槽位坐标、尺寸不变。
- 用户确认背景方向、否决其余“通用浅色卡片”后，保留夕照背景并重做全部组件母题：朱砂签印侧栏、金箍棒横卷输入框、命簿碑刻消息与环境卡。
- 侧栏取消通用圆角卡，改为墨刷渐层、菱形签印、朱砂/青玉侧脊；新建任务使用朱砂端条与鎏金折角，项目选中态使用朱砂刷痕和碑帖字体。
- 输入框取消圆角白框，改为双金线、朱砂端箍、切角八边工具钮与红漆发送印；工作区任务栏增加朱砂/鎏金短尺分隔，消息、代码和右栏卡均采用非对称碑刻切角。
- 更新针对性视觉断言，以 `clip-path` 和零圆角锁定金箍横卷造型；两张实渲染复核及动态/恢复测试仍为 2/2 通过，原生布局几何未变化。
- 将 0.4.0 交付链恢复为受管运行时：明亮原生基线、0.3 暗色 state 原位升级、随机 loopback 端口、隔离 web profile、同生命周期 watcher、实时 restore request 与最小包构建。
- 新增最小包独立导入测试和真实 renderer 回环截图工具；包中不含 Git、docs、Studio 或测试，正式安装 39 个文件，约 0.36 MiB。
- 定向验证通过：原生主题升级/恢复 4/4、生命周期 2/2、最小包 1/1、动态/视觉 2/2；未运行无关 Studio 全量 E2E。
- 已将本机旧 0.3 安装原位升级到 `C:\Users\Alex Chen\.codex\themes\wukong-codex-forge`，创建 `Codex - Wukong Theme.lnk`；当前普通 Codex 按约束未被关闭或重启，真实生产截图待受管启动。
- 两个设计提交 `95ba968`、`7b97d0b` 已创建；GitHub 443 暂时不可达，远端仍停在 `fb38867`，结束前继续重试且不得误报已推送。
- 用户否决浅宣纸版并明确四项红线：采用《黑神话：悟空》配色与元素、输入框不得拉长、所有原生尺寸不变、助手回答无框且对话文字不得改写。
- V5 收敛为“烟墨残阳”：烟墨/石褐中明度基底，旧金圆相、金箍图标环、朱砂签印与暗铜横卷；保留用户背景和原生三栏，不新增 UI。
- 修正 fixture 将输入框从工作区铺宽改为原生 736 px 居中基线；注入前后逐项比较 composer、用户气泡、回答和代码块 DOMRect，并新增整段 `innerText` 零改写断言。
- 移除 turn 与 assistant 的主题卡片，回答背景、边框和阴影均为透明/none；用户样式只落到实际气泡，不再污染外层 anchor。
- 第一次定向测试发现用户气泡实边框导致 2 px 几何回归；改为不占布局的 inset 描边后 runtime 动态/视觉测试 2/2、原生主题测试 4/4 通过。
- 用户指出“烟墨残阳”仍沿用上一版切角框和金线骨架，判定不是完全重构；该版不再作为交付方案。
- 重新审计本地 `11891心猿.jpg`、`金箍.jpg`、`封面.png`，以游戏战绩页的放射盘、六点印记、无框墨幕和细线信息层级建立 V6“六根墨幕”。三张参考图不进入运行包。
- 删除逐项卡片、双金边、切角卷轴、碑刻回答框；新对话使用放射六根盘，侧栏使用无框列表和六点选中印，输入框使用单线棍势与石符按钮，右栏改为信息墨幕。
- V6 首次测试捕获 composer `position` 覆盖导致底部输入框上移；将伪元素棍线改为背景层并删除定位覆盖后，输入框恢复原生 736 px 与底部坐标，runtime 2/2 通过。
- 完全重构作为 0.5.0 里程碑发布；最小包测试新增 active theme 名称、五色 palette 与 `--forge-paper` 变量断言，防止源码已改而正式包仍携带旧主题。
- 提交 `716978d` 已成功推送到 `origin/main`；此前积压的四个本地提交也随本次 push 一并同步，远端不再停留在 `fb38867`。

## 2026-07-21 — 原生 UI 对齐、双模式重构与真实应用验收

- 按用户要求停止使用 Computer Use；只读解包 Codex 26.715.2305.0 的 `app.asar`，逐项建立菜单栏、侧栏、工具栏、composer、回答与环境卡的官方 DOM/CSS 基线。
- 将 fixture 重建为当前原生布局：36 px 菜单栏、275 px 左栏、46 px 任务工具栏、768/736 px 内容与输入框、300 px 浮动环境卡；移除伪造的固定第三栏。
- 重做 V5 注入边界：只装饰 `.composer-surface-chrome`，回答只命中真实 assistant 节点且保持无框；所有文字、宽高、定位和交互结构均由 Codex 原生 DOM 负责。
- 形成双模式：新建任务为战斗模式，主画面按杨戬与大圣优先轮换；进入线程后为风景模式，使用山门、古刹、峡谷、佛窟和夕照场景。
- 用户指定的新杨戬对决图替换旧杨戬背景；夜叉王、大圣与金箍棒进入战斗场景；夜叉套、神锋、金箍棒只作为侧栏、环境卡和 composer 的小尺寸高保真材质嵌片，不再手绘大图。
- 安装链改为 append-only release：每次创建新的 `releases/<version-timestamp>`，旧 app、state、配置备份、素材、研究副本和快捷方式全部保留；公开禁用入口只发恢复请求，不删除文件。
- 修正正式 renderer 地址：当前窗口为 `app://-/index.html`，旧白名单漏掉它是此前“安装却无变化”的关键原因。
- 定向测试通过：runtime states 3/3、preserving contract 2/2、managed package 1/1、native theme 4/4；PowerShell 三个公开脚本 AST 解析通过。
- 真实 ChatGPT.exe 热应用通过：landing 为 battle 场景 0；thread 为 scenery 场景 8；全窗 cover、侧栏 275 px、composer 736 × 98 px、环境卡 300 px、回答透明无框均从生产 DOM 实测确认。
- 真实截图与 JSON 摘要保留在 `docs/logs/live-codex-theme-0.7.0.*` 和 `docs/logs/live-codex-theme-thread-0.7.0.*`；不删除任何历史证据。

## 2026-07-21 — 0.8.0 潇湘双境、双同行者与便携闭环

- 用户最终否决夜叉套、兽棍·神锋和武器条作为组件元素；保留夜叉王战斗背景，停用两张装备 motif，原文件不删除。
- 三个并行只读审计分别复核素材质量、原生落点和下载/删除生命周期；确认首轮宠物候选成年感过重、八戒武器错误，且开始菜单快捷方式和全局 Node/`ws` 破坏“删目录即原生”。
- 使用图像生成工作流重绘小悟空 V2 与持九齿钉耙的小八戒 V2，去绿幕并编码成 512 × 512 透明 WebP；湘妃葫芦继续使用青绿双节透明 WebP。
- 视觉结构改为：侧栏与环境卡只换潇湘矿色材质；小悟空和小八戒只站在 composer 上沿外侧；葫芦只放 composer 旁空白沟槽，不在任何卡片内贴人物。
- 注入器升级到 V7；新增三项碰撞安全属性、正文/标题交叠检测、窄屏隐藏、resize/scroll/focus 合并刷新和完整恢复清理。
- 输入器仍为原生 736 × 98 px / 25 px 圆角，用户气泡只换不占布局的材质，助手回答所有祖先保持无框，提示词/回答文本不改。
- 新增 `start-theme.cmd` / `stop-theme.cmd`：profile、请求、事件和日志全部位于解压目录 `.wukong-runtime`；使用 Codex 包内 Node 24 与原生 WebSocket，不需要 npm 或全局 Node。
- 最小包只复制活动主题引用的 11 张 JPEG 和 3 张 WebP，不复制源 PNG、首轮候选、夜叉套、神锋、开发依赖或外部快捷方式；活动素材总计 2,728,584 bytes。
- 保留旧 `install.ps1` / `restore.ps1` 文件名，但它们先委托零删除入口并返回；破坏性旧实现作为不可执行块注释留存，满足历史内容保留与误执行防护。
- 定向夹具首轮暴露环境卡选择器和旧断言；修正后 runtime 5/5、便携/生命周期/主题 15/15 通过。完整生产窗口热应用、便携 ZIP、最终 commit/push 尚待本节后续记录。
- 否决 V2 泛化贴纸后，活动 motif 改为 `little-wukong-gameplay-v3.webp`、`little-bajie-gameplay-v3.webp` 与紧裁的 `xiangfei-gourd-icon.webp`；旧 PNG/WebP、中间绿幕和研究副本全部保留但不打包。
- 读取真实 26.715.2305.0 landing DOM 后加入 `[data-feature="game-source"]` / “我们该构建什么？”识别，并为侧栏路由增加两次有界延迟复核；新建任务与对话切换无需重新注入。
- 背景 data URL 从 `--forge-bg-*` / `--forge-art-*` 双份嵌入改为单份嵌入加变量别名；变量载荷从约 7.65M 字符降至 4,203,478 字符，真实窗口热应用实测约 1.03 秒。
- 真实 0.8.0 审计完成：landing `battle/scene 0`、thread `scenery/scene 8`；侧栏 275 px、composer 736 × 98 px、环境卡 300 px、助手无框，双同行者与湘妃葫芦位于 composer 外侧安全沟槽。

## 2026-07-21 — V9 正式发布闭环

- 将活动伴随素材最终锁定为小悟空 V6（76,266 bytes）、小八戒 V6（78,038 bytes）与湘妃葫芦 icon（10,650 bytes）；11 张背景与 3 张 WebP 总计 2,737,884 bytes。V2–V5、PNG 编辑源、夜叉套、神锋与旧葫芦全部保留但不打包。
- V9 组件改为无玻璃模糊的墨铁、石青、旧金与漆褐哑光材质；侧栏、输入器、环境卡保持 Codex 原生宽高、位置和圆角，assistant 继续透明无框，正文不改写。
- 页面运行时只观察关键 `childList` 新增/移除节点，排除 attribute、characterData、scroll、逐字 input 与 focus 监听；刷新以 650 ms 合并，watcher 以 1.7 s 廉价 probe 维持生命周期。
- 便携入口在独立 profile 上完成 start → V9 active → stop → V4–V9 全空原生闭环：测试根进程 17748、端口 45580；普通 Codex 根进程 9896 未被触碰。
- 启动器补充首次生效验证门控：随机端口可用后以 350 ms 间隔、最多 20 秒等待 renderer 接受完整主题，只有 `--apply` 回读成功后才记录 `watching`。
- append-only 正式 release `0.8.0-20260721-110648` 复用同一受管 Codex 根进程 40840、端口 41310 完成 native → V9 热切换；最终 thread 为 scenery/scene 8、landing 为 battle/scene 2。
- 最终可提交生产证据为 `docs/screenshots/live-codex-v9-final-thread.*` 与 `docs/screenshots/live-codex-v9-final-landing.*`；前者实测 assistant 透明背景、无阴影、0 px 圆角，二者均为 275 px 侧栏、736 × 98 px composer 与单层 cover 背景。带时间戳审计件继续保留在本地 `docs/logs/`。
- 定向验证：运行时/生命周期/打包/保留合同 17/17，原生主题与恢复 6/6，首次生效验证生命周期 7/7，最终最小包与保留式入口 4/4；未重跑无关 Studio 全量测试。
- 最终便携 ZIP：`release/wukong-codex-forge-0.8.0-portable-20260721-110324.zip`，33 个条目、2,735,754 bytes、SHA-256 `DE7C2F4D51D3E672C07120C4F554B3AE8242A01D694A52258F24FC0E868E67E3`；无 `node_modules`、docs、tmp、源 PNG、旧装备或停用候选。
- 本轮所有旧 release、失败启动日志、研究副本、截图和运行记录均原位保留，没有删除或移动任何文件。
- 最终活动素材收敛为 V6：`little-wukong-gameplay-v6.webp` 76,266 bytes、`little-bajie-gameplay-v6.webp` 78,038 bytes、`xiangfei-gourd-icon.webp` 10,650 bytes；11 张背景与三件伴随元素合计 2,737,884 bytes。夜叉套、兽棍·神锋与所有中间候选仍保留在仓库历史中，但活动定义和发布包零引用。
- V9 组件改为平涂墨铁、石青、旧金与漆褐，不再使用玻璃模糊、通用三色渐变或武器贴图；背景固定单层 `cover`，原生槽位、圆角、提示词和回答文本不变，助手回答保持无框。
- 页面监听收敛为 selector-filtered `childList` 结构变化，排除 attribute、characterData、scroll、input 与 focus 高频信号；刷新以 650 ms 合并节流。文档同步纠正此前“不安装 MutationObserver”的过度表述。
- 可移植真实生命周期闭环：独立 profile 根进程 17748 / 端口 45580 从 V9 `battle/landing` 生效，经 `stop-theme.cmd` 等价入口恢复到 style/class/mark/runtime 全零，再关闭精确 profile；普通 Codex 根进程 9896 未受影响。
- 正式启动器新增首次生效验证门控：随机端口可用后最多等待 20 秒、每 350 ms 复核一次，只有 `--apply` 已确认 V9 renderer state 才记录 `watching`。定向 lifecycle 契约 7/7 通过。
- append-only 最终本机发布为 `C:\Users\Alex Chen\.codex\themes\wukong-codex-forge\releases\0.8.0-20260721-110648\app`；复用同一受管 Codex 根进程 40840 / 端口 41310 完成“主题→原生→新发布主题”热切换，窗口保留供用户审计。
- 最终安装版实机证据为 `docs/screenshots/live-codex-v9-final-landing.png/.json` 与 `docs/screenshots/live-codex-v9-final-thread.png/.json`：2050 × 1106 视口、275 px 侧栏、736 × 98 px / 25 px composer、全窗 cover；战斗境 scene 2 与风景境 scene 8 均为 V9 active，三项安全位全部为 true。
- 定向自动验证：组合 fixture/视觉/生命周期/最小包/保留安装 17/17；原生主题与恢复 6/6；首次生效验证修改后 lifecycle 7/7。未重复运行无关 Studio 全量套件。
- 最终便携包为 `release\wukong-codex-forge-0.8.0-portable-20260721-110324.zip`，33 项、2,735,754 bytes、SHA-256 `DE7C2F4D51D3E672C07120C4F554B3AE8242A01D694A52258F24FC0E868E67E3`；禁用素材、PNG 源、V2–V5、`node_modules`、ws 候选、docs 与 tmp 均未打包。所有旧目录、旧 ZIP、旧发布、日志与素材原样保留，没有删除文件。

## 2026-07-21 — 0.8.0 最终安全门与发布更正

- `.gitignore` 增加 `.wukong-runtime/`、`tmp/` 与 `release/`，避免独立 profile、调试端口、研究中间件和本地 ZIP 被误提交；现有目录及其全部内容均原位保留。
- 启动器的重解析点拒绝范围增加主题包根目录；生命周期、最小包与保留安装定向测试 11/11 通过，Studio 脚本语法通过。Studio 下载测试改为唯一临时目录且不再删除导出文件。
- V6 来源说明明确为“实机画面作造型参考→图像生成绿幕中间件→本地色键去背、清边、紧裁与 WebP 压缩”，不再暗示来自官方模型导出。
- append-only 最终 release `0.8.0-20260721-113129` 复用根进程 40840 / 端口 41310，先验证 V4–V9 原生全空，再进入 V9 `battle/scene 0`、130 个标记；三件伴随元素安全位均为 true。视觉载荷与真实截图版 SHA-256 完全一致。
- 最终便携包更正为 `release\wukong-codex-forge-0.8.0-portable-20260721-113129.zip`，33 项、2,735,793 bytes、SHA-256 `BA38996C318521EC519C5B4686167AA65A2B4CD4F029E6DAE0AB9CD5DF5BB4DC`，禁用项 0。旧 ZIP、旧 release、失败日志与所有素材继续保留，没有覆盖、移动或删除文件。
- 本轮 23/23 项定向测试通过；提交 `9b5747c`（`feat: ship portable Wukong dual-scene theme`）已确认位于 `origin/main`。提交含 50 个精确路径、删除项为 0；本地未跟踪的历史截图、WebSocket 调研件和 V2–V5 素材继续原位保留。
- 精确提交 `9b5747c62911bde7e7e75d36e124e998f3c23029`（`feat: ship portable Wukong dual-scene theme`）已成功推送到 `origin/main`；本地工作日志继续按仓库约定忽略，不进入提交。

## 2026-07-21 — 0.9.0 V10 普通入口、独立同行者与场景色板

- 三个并行只读子对话审计启动生命周期、宠物/色板架构与测试缺口；主对话统一修改共享工作树。
- 使用 imagegen 按高保真游戏参考重新生成小悟空与持九齿钉耙的小八戒，保留品红色键源、透明 PNG 与活动 WebP 三层资产；旧 V2–V6 和所有失败候选继续原位保留。
- schema 升级到 v3、运行时升级到 V10；11 张背景分别携带完整 chrome tone，切换场景同步更新正文、topbar、sidebar、composer、环境卡、用户气泡、代码块、菜单与 veil。
- 将小悟空、小八戒和湘妃葫芦迁移到 body 直属的 inert / aria-hidden / pointer-events-none 固定覆盖层；宠物站工作区底边两侧，葫芦可位于 landing 主视觉、环境卡脚部或工作区上缘，不改变任何原生槽位。
- 真实发现旧快捷方式 Arguments 被截断到 1023 字符；失败版哈希和官方原版均备份。V10 改为内容哈希命名的 append-only 桥接脚本，快捷方式参数降到 178 字符，主题根缺失时动态回退官方原生启动。
- 普通 `ChatGPT.lnk` 成功启动独立主题进程 PID 26812 / CDP 38625；首启又暴露 DevTools 端口先写文件、端点稍后监听的竞态，事件 `not-running` 原样保留。为 `--verify` 增加 20 秒有界重试后，同一进程安全重连，watcher PID 18296 进入 `watching`。
- 真实 landing 审计为 V10 battle/scene 0，thread 为 scenery/scene 8；两页均是 2050 × 1106、侧栏 275 px、composer 736 × 98、背景 cover。thread 环境卡 300 × 473，assistant 透明无框；三项伴随元素安全位为 true。
- 生产证据新增 `docs/screenshots/live-codex-v10-autostart-landing.*` 与 `live-codex-v10-autostart-thread.*`。运行时、视觉、场景色板、生命周期、保留合同和最小包定向回归 24/24 通过。
- 推送前完整验证通过：原生定义 valid、全部测试 25/25；打包目录的四个 PowerShell 入口 AST 解析 0 错误，独立 V10 载荷导入成功。
- 第一次 `Compress-Archive -LiteralPath <stage>\*` 因参数语义失败，没有生成 ZIP；stage 保留。最终 0.9.0 包为 `release\wukong-codex-forge-0.9.0-portable-20260721-183530-7655056.zip`，35 项、2,931,727 bytes、SHA-256 `E0A1F1E25184CC50DCC1003B4D3D3C022154DADE128738DF612594F0BD8274D3`；禁用项与缺失项均为 0。
- 发布后 fresh-profile 实启暴露 PowerShell 5.1 native stderr 终止语义：renderer 未就绪的正常重试错误被 `ErrorActionPreference=Stop` 提前终止。失败 stage、profile、stdout/stderr 和首个 ZIP 全部保留；launch 的 verify/apply loop 改为单次 native 调用期间临时 `Continue`、捕获 exit code 后恢复 `Stop`，等待与超时边界不变。
- 第二个唯一包的隐藏 PowerShell 5.1 子进程未自动加载 `Get-FileHash` 模块，入口在写快捷方式事件时终止；该包、stage、profile 和日志全部保留。hook 改为 `[IO.File]::OpenRead` + `.NET SHA256` 的自包含只读哈希函数，移除模块自动加载依赖。
- 第三个唯一包 `release\wukong-codex-forge-0.9.0-portable-20260721-185413-8390691.zip` 完成 fresh-profile 真启动：35 项、2,932,159 bytes、SHA-256 `BCF9F9E7C7F9B8C7490ED3ECFFF576966A76AE5FC46BC7A8C8AF6F53A07FC697`；根 PID 45072、端口 34661、watcher PID 46940，事件 `starting → watching`，隐藏启动 stderr 0 bytes。
- 最终包生产 renderer 为 V10 battle/scene 0、128 个受管标记、三项安全位 true；2050 × 1106、sidebar 275 px、composer 736 × 98、背景 cover。证据为 `docs/screenshots/live-codex-v10-release-fresh-profile-landing.*`，窗口保留供用户审计。
- 继续只读审计官方 26.715.2305.0 主进程：Windows `window-all-closed` 不退出应用，二次激活通过 `requestSingleInstanceLock` / `second-instance` 和 `CODEX_ELECTRON_USER_DATA_PATH` 路由。V10 watcher 因此改为无 Codex renderer 连续约 13.6 秒后自行停止；隐藏窗口仍保留 renderer 时复用原 watcher，renderer 已消失时才由 launcher 重建，不强制结束进程。
- 真机正常关窗证明隐藏原生窗口可继续持有 renderer，且 DOM visibility 会误报 visible。启动桥接改为同一 `CODEX_ELECTRON_USER_DATA_PATH` + 同一 `--user-data-dir` + `codex://launch`，并以受管根 PID 的 `MainWindowHandle` 验收；6 秒未复显重试一次，仍失败返回非零。Win32 操控候选未进入正式包，文件按零删除约束保留。

## 2026-07-22 — 0.10.0 V11 原生 Hatch Pet 与组件深度重构

- 按用户最终参考重做两个原生 Codex v2 Hatch Pet：小八戒使用 INART 1/12 的幼态脸、旧青衣、念珠与完整九齿钉耙；小悟空使用游科官方天命人厌火夜叉套 1/12 造型与兽棍·神锋。两者均为 1536 × 2288、8 × 11、RGBA WebP，覆盖 9 个标准动作行和 16 个顺时针方向。
- 小八戒最终图集 SHA-256 为 `511BC2B8CA7C197407AB8E3BE194AAA5F2036428C05FDCB811400525005C2277`；小悟空最终图集 SHA-256 为 `018C3447368C23F963335710CA09086EFD634B2826B2913A920F3960E3D77D87`。两套图集均通过透明残留、动作、方向盲审和武器结构审计；小八戒全部方向的钉耙均为九齿。
- 主题进入 V11：移除页面小悟空/小八戒静态 overlay，只保留无交互湘妃葫芦；侧栏按钮、输入器、发送键和环境卡改用经匣、朱砂签、短轨与典籍匣角造型。原生三栏、槽位坐标、736 × 98 px 输入器、文案和助手无框合同不变。
- 11 张背景继续使用唯一固定 `cover` 层；每张画面独立适配正文、侧栏、顶栏、输入器、用户气泡、代码块、环境卡和遮罩。新建任务为杨戬/大圣优先的战斗境，进入对话为风景境。
- 只读复核官方宠物 loader 后修正发现链：顶层使用可被 `Dirent.isDirectory()` 识别的真实目录，内部 `payload` junction 指向保留的主题宠物包，派生 manifest 指向 `payload/spritesheet.webp`。首次安装不复制图集、不需要管理员；早期直接副本只迁移活动 manifest，原 manifest 与 atlas 全部原位保留。
- 真实 Codex “宠物”设置页识别两个自定义包；小八戒与小悟空均在官方 `avatar-overlay` 窗口完成实际加载。主题实机仍为单层全窗背景、275 px 侧栏、736 × 98 px 输入器与无框回答。
- 最终定向回归 32/32 通过，覆盖宠物包、官方发现链接器、注入、视觉、11 场景色板、生命周期、保留式安装、最小包与原生恢复。
- 最终便携 ZIP 为 `release\wukong-codex-forge-0.10.0-portable-20260722-123609-0afe4b0.zip`，42 项、6,790,345 bytes、SHA-256 `25196E65C39AC2176AB63FC856C643ACAEF201736157931801FE8BBBAB6F4513`；开发目录、测试、调研件与运行状态均未打包。唯一 stage、所有候选、失败证据、旧版本和已安装旧副本全部保留，未删除或移动文件。
