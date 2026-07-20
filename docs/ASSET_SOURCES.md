# 素材来源与发布边界

## 0.7.0 运行时画廊

| 文件 | 像素 / 字节 | 来源与用途 |
| --- | --- | --- |
| `themes/assets/great-sage-return.jpg` | 1256 × 707 / 78,423 | 用户本地 `E:\\GameRecord\\Black Myth Wukong\\图片\\大圣归来.jpg`；战斗境主场景之一。 |
| `themes/assets/erlang-ink-duel.jpg` | 2560 × 1043 / 309,953 | 用户提供的白场水墨杨戬对决图 `codex-clipboard-62ae5e68-bad0-4a3c-aa72-97d2d4d87aa2.png`；替换被否决的旧杨戬背景。 |
| `themes/assets/great-sage-staff.jpg` | 1920 × 1080 / 341,165 | 用户本地 `E:\\GameRecord\\Black Myth Wukong\\图片\\金箍.jpg`；战斗境与输入器金箍棒嵌件。 |
| `themes/assets/yaksha-king-rift.jpg` | 1920 × 1080 / 267,415 | 用户提供 `codex-clipboard-92ab9198-6da0-49fc-9afe-590acee89f9c.jpg`；夜叉王次级战斗场景。 |
| `themes/assets/storm-bearer.jpg` | 1920 × 1080 / 293,694 | 用户提供 `codex-clipboard-f90c91b3-0b8a-40a6-a288-578fcf8fac7e.jpg`；低频次级战斗场景。 |
| `themes/assets/shadow-confrontation.jpg` | 1920 × 1080 / 98,466 | 用户提供 `codex-clipboard-b49f0747-316a-461e-8ae9-0e838dd764b5.jpg`；低频次级战斗场景。 |
| `themes/assets/ridge-gate.jpg` | 1920 × 1080 / 127,753 | 用户提供 `codex-clipboard-9feb2815-c0fa-4ee5-a6d8-6a020bb3c2db.jpg`；风景境。 |
| `themes/assets/forest-shrine.jpg` | 1920 × 1080 / 256,950 | 用户提供 `codex-clipboard-75e29de6-e24c-4526-9b42-c917c108f022.png`；风景境。 |
| `themes/assets/mountain-path.jpg` | 1920 × 1080 / 391,525 | 用户提供 `codex-clipboard-44b19127-01d2-4e94-a2d1-477b5c2e4bbe.jpg`；风景境。 |
| `themes/assets/stone-buddhas.jpg` | 1920 × 1080 / 239,739 | 用户提供 `codex-clipboard-6aa1d89a-3e8d-4193-aca1-0d9e1a2a0e1b.jpg`；风景境。 |
| `themes/assets/sunset-ravine.jpg` | 1920 × 1080 / 167,847 | 用户提供 `codex-clipboard-d1f8f588-0972-4ccb-8bf8-2e1eb5a57520.png`；风景境。 |

新建任务页只从三张主战斗图（大圣、杨戬、金箍棒）选择；夜叉王与另外两张高张力画面为低频战斗补充。已进入对话只从五张纯风景图稳定选择。所有背景使用一个 fixed `cover` 平面，不并排、不留黑边、不重复叠图。

## 0.7.0 装备嵌件

| 文件 | 像素 / 字节 | 设计边界 |
| --- | --- | --- |
| `themes/motifs/yaksha-set.png` | 852 × 1343 / 1,541,837 | 参考 [Yaksha Armor Set](https://blackmythwukong.fandom.com/wiki/Yaksha_Armor_Set) 的实机造型做透明化编辑；只裁取长角、鬼面与甲片纹理，不在 UI 中展示整个人物。 |
| `themes/motifs/fanged-cyan-staff.png` | 1500 × 403 / 578,241 | 参考 [兽棍·神锋装备画面](https://www.9game.cn/news/10695528.html) 做透明化造型嵌件；只在输入器底部显示短截武器头，不拉伸为整条装饰。 |

两张透明嵌件不是 Game Science 官方模型导出，不应作为装备设定图再次分发或宣称官方素材。用户提供与本地原始文件均未被移动或删除。0.7.0 运行包共 11 张 JPEG 与 2 张 PNG，合计 4,693,008 bytes；无运行时网络请求、视频、HUD 战绩页或普通战斗录屏。`tmp/research/` 保留联网核对副本，不进入正式运行包。

## 历史素材记录（0.2.0）

| 文件 | 来源 | 技术信息 | 用途与权利说明 |
| --- | --- | --- | --- |
| `themes/assets/great-sage-return.jpg` | 用户提供的本地《黑神话：悟空》游戏截图，原路径 `E:\GameRecord\Black Myth Wukong\图片\大圣归来.jpg` | 1256 × 707，78,423 bytes | 用户明确授权本项目使用；游戏画面相关权利仍归原权利人。本项目不主张该截图或游戏角色权利。 |
| `assets/little-wayfarer.png` | 为本项目生成的原创通用小猴行者插画 | 透明 PNG | 不是游戏截图、模型提取或官方角色素材；仅用于 Studio 概念预览，0.3.0 原生主题不安装该文件。 |

选择 `大圣归来.jpg` 的原因不是分辨率最高，而是它在最低文件体积下提供了最强的前后景关系：左侧黑色近景自然形成内容留白，右侧大圣剪影与夕照形成明确焦点。主题用 CSS 遮罩将同一图复用为新建页和对话页，避免第二张大图的解码与内存成本。

## 本地视觉参考（不打包）

| 文件 | 提炼内容 | 发布边界 |
| --- | --- | --- |
| `E:\GameRecord\Black Myth Wukong\图片\11891心猿.jpg` | 战绩页的无框墨幕、放射圆盘、六点印记、细线信息层级 | 仅用于设计观察，不复制进运行包 |
| `E:\GameRecord\Black Myth Wukong\图片\金箍.jpg` | 熔金焦点、暗绿黑环境与棍势亮线 | 仅用于配色观察，不复制进运行包 |
| `E:\GameRecord\Black Myth Wukong\图片\封面.png` | 黑底金绘与朱砂小印的比例关系 | 仅用于配色观察，不复制进运行包 |

## 仅作来源指引

Studio 保留以下官方入口，但不会自动下载、缓存或再分发页面图片：

| 来源 | 入口 | 边界 |
| --- | --- | --- |
| Game Science | [黑神话：悟空官网](https://www.heishenhua.com/) | 官方素材权利仍归 Game Science。 |
| Steam | [Black Myth: Wukong 商店页](https://store.steampowered.com/app/2358720/Black_Myth_Wukong/) | 商店截图不因链接而获得再许可。 |
| PlayStation | [Black Myth: Wukong](https://www.playstation.com/en-us/games/black-myth-wukong/) | 平台与发行方素材不在本仓库二次分发。 |
| Xbox | [Black Myth: Wukong](https://www.xbox.com/en-us/games/store/black-myth-wukong/9p51d1h0t7cw) | 平台与发行方素材不在本仓库二次分发。 |

如未来替换为网络 1080p 以上素材，必须先记录直达来源、许可边界、像素尺寸和压缩后体积，再进入主题资产目录。
