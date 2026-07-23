# 大圣归来 · 潇湘双境 — 设计与实现

> **0.11.0 / V12 现行设计。** V11 及更早章节保留为演变记录；冲突处以本节为准。

## V12：背景正式化，组件先审后装

V12 把活动 runtime 收敛到一个职责：在不改变 Codex 原生 UI 的前提下提供战斗/风景双场景背景。`#wukong-forge-background` 内含两个 fixed layer；每层分为 image 与 veil，使用 `cover`、独立焦点和 820 ms opacity 交叉淡变。新建任务从索引 0–5 的战斗池轮换，对话从索引 6–10 的风景池轮换，两组 cursor 分开写入 sessionStorage。背景节点无语义、无交互并在强制高对比模式隐藏。

V11 的 sidebar、composer、Environment 卡、消息、按钮、滚动条和 motif 样式文件继续留在仓库，但 V12 plan 主动退役 V4–V11 runtime key，清除旧标记和旧 overlay，不再把这些视觉写进页面。

### composer 审稿合同

V1–V3 的共性失败是“主体仍为原生圆角框，只在外面贴古风边条或微缩道具”。V4 `夜叉护匣 · 神锋发令` 继续失败：把完整夜叉衣甲、护腕和神锋裁成极窄碎片后，装备结构与材质全部失真，既不高保真，也无法在 1× 下辨认。因此 V4 永久冻结，不进入 runtime，不再沿用“装备切片贴边”的构成方法。

下一候选必须同时满足：

| 约束 | 设计合同 |
| --- | --- |
| 形状 | 在原生边界内改变 composer 的整体轮廓与层次，不围一圈泛古风边框，不把完整装备压成细条 |
| 夜叉套 | 只使用不拉伸的自然比例局部，并保留衣襟、甲片、绳结或面甲中至少一个完整、可识别的结构关系 |
| 神锋 / 金箍棒 | 武器只能作为真实结构节点，不得缩成看不清的发送键贴纸；端箍、棍身、棍首分别保持比例 |
| 原生合同 | 保留 `736×96` / `560×96`、32×32 发送命中区、提示词、footer、键盘导航与可访问语义 |
| 审稿 | 必须提交真实 Codex 1× 全窗、4× 局部、浅/深背景、125% 缩放与强制高对比证据，用户批准后才可集成 |

候选所有装饰四向外扩为 0；不加标题、道具状态珠、新控件、emoji 或解释性文案。源图不足时停在素材审计，不通过 imagegen 猜画夜叉套或武器。

### Hatch Pet 动作一致性

宠物沿用官方 v2 8×11 映射。跑动和 hover 行必须与其余行保持同一角色、同一比例、同一装备与同一渲染风格。小八戒 repair-v2 已按“持耙捧腹前俯蓄势 → 更深前俯 → 后仰抬头大笑峰值 → 肩腹二次弹起 → 回落衔接”形成独立候选；一手始终持完整九齿钉耙，另一手捧腹。小天命人 repair-v2 只解决了身份连续性，尚未正确复刻游戏跑动和棍花，必须基于连续实机帧另做 repair-v3。

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
