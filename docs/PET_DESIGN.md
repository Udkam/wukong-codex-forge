# 原生宠物设计基线

## 小悟空 v4：厌火夜叉套 + 兽棍·神锋

### 目标

以《黑神话：悟空》游戏内大圣气质为基准，设计可在 Codex 原生宠物系统中长期使用的“小悟空：厌火夜叉套 + 兽棍·神锋”。它应当是缩小后的写实游戏角色，而不是贴纸、玩具、Q 版猴或儿童动画角色。

### 造型锁定

- 成年猕猴式面部：眼窝深、吻部短而有骨相、耳朵不过分外扩；神情沉着、警觉，不微笑卖萌。
- 深棕至黑棕毛发，面颊与下颌毛束清晰；厌火夜叉面必须保留两根细长红角、灰白鬃冠、赤红鬼面与可辨识的眼部开口，拒绝通用牛角头盔。
- 厌火绣衫按游戏实装还原：烟灰色不对称宽袖绣袍、暗色内衬、赤褐纹样前垂带和旧布料重量；不是黑红板甲，也不是骨甲。
- 厌火魔手必须是明显不对称的赤红妖臂：细长手指、黑爪、前臂骨刺和弯曲长角；厌火魔足保留赤红胫足与暗色另一侧的非对称关系。
- 兽棍·神锋按游戏图标锁定：核心是深色兽棍，端部为多层兽首/獠牙雕塑、旧金金属、骨白突起与青绿氧化甲片；禁止画成金箍棒、三尖两刃枪、普通长棍或通用龙头杖。
- 神锋长度接近角色身高的 1.15–1.30 倍，端部兽首结构必须在 192×208 缩小时仍可读；中性姿态近竖向或斜背收束，禁止横跨画面或越出安全区。
- 比例为紧凑写实：约 4–4.5 头身；允许手足略大以保证小尺寸可读性，但禁止 2–3 头身大头娃娃化。
- 中性站姿为三分之二正面，双脚完整落地，兽棍·神锋斜背或近竖向收束于身体轮廓内，四肢连接清楚。

### Hatch Pet 约束

- 原生 v2 图集：1536×2288、8×11、单格 192×208。
- 九个标准动作行全部由 canonical base 锁定身份；另含四个 cardinal anchor、16 个顺时针方向、连续 row 9/row 10。
- 所有动画帧保持同一厌火夜叉面、绣衫、妖臂、魔足、神锋端部结构和身体比例。
- 必须通过逐行动作审查、四向语义审查、透明边缘清理、三位隔离盲审、连续性审查与 `validate_atlas.py --require-v2`。

### 最终锁定与证据

- canonical：`docs/pets/little-wukong-yaksha-shenfeng/base-transparent.png`。
- 11 行动作表：`docs/pets/little-wukong-yaksha-shenfeng/contact-sheet.png`；16 向表：`docs/pets/little-wukong-yaksha-shenfeng/look-directions.png`。
- 发布 atlas SHA-256：`018c3447368c23f963335710ca09086efd634b2826b2913a920f3960e3d77d87`。
- `direction-blind-validation.json` 的硬四向门全部通过；中间方向只保留已在语义表中解释、且不跨象限/不反转的轻微歧义。最终视觉复核为 pass，无 blocker。

### 参考素材

- `E:\GameRecord\Black Myth Wukong\图片\全视图.jpg`：大圣体态与整体气质；只参考画面上方中央主角。
- `C:\Users\ALEXCH~1\AppData\Local\Temp\codex-clipboard-62ae5e68-bad0-4a3c-aa72-97d2d4d87aa2.png`：右侧大圣头肩甲胄、红绳和毛发细节。
- `artifacts/reference-library/yanhuo-yaksha-set-wiki.png`：厌火套四件在游戏内的全身结构、灰袍、鬼面、妖臂和魔足权威造型参考。
- `artifacts/reference-library/beast-staff-shenfeng-icon.png`：兽棍·神锋的兽首、獠牙、旧金和青绿氧化端部参考。
- `artifacts/reference-library/official-yaksha-figure-1-12.jpg`：游科官方授权天命人厌火夜叉套 1/12 收藏手办的面具、烟灰宽袍、妖臂与整体材质参考。

### 首轮否决条件

- 猴脸幼态、卡通笑脸、眼睛过大或五官像通用动画猴。
- 把厌火套改画成通用黑红甲、全身对称甲、厚重板甲或夜叉王 Boss 本体。
- 把兽棍·神锋画成金箍棒、枪、普通棍、龙头杖，或遗漏端部的兽首/獠牙/青绿氧化结构。
- 神锋过粗、过短、横跨画面或越出安全边缘。
- 白底、透明底、渐变底、可见文字、徽标、UI、投影地台或多角色。
- 手指、脚趾、尾巴、兵器与身体粘连或缺失。

## 小八戒 v3：INART 游戏复刻版

### 目标与造型锁定

- 以 INART 官方授权《黑神话：悟空》猪八戒 1/12 可动人偶为结构依据，复刻游戏中的“小八戒”：矮壮、圆润、可亲，但仍是有风霜感的成年猪妖；不是粉色幼猪、毛绒玩具或带塑料关节的手办翻拍。
- 黑灰至灰棕粗硬猪毛，楔形直立耳、黑色宽鼻、两枚短小上弯獠牙与小而有神的红棕眼必须稳定。可爱来自稍圆的脸颊、较短的吻部、柔和但机灵的眼神和紧凑体态；不得使用压眉凶相，也不靠超大眼、腮红或笑脸卖萌。
- 旧青绿外袍、赭金滚边、深炭围巾、黑珠串、多层黑褐绳结腰封和分片围裙按官方图保留，材质表现为旧布、绳、皮、骨和氧化金属。
- 唯一武器锁定九齿钉耙：深色缠柄、旧铜雕花耙首、恰好九枚独立且等距的象牙色耙齿；禁止普通花园耙、少齿、多齿或骨刺粘连。
- 比例保持约 4–4.25 头身；基础姿势使用近竖持构图，让完整耙首、横梁和九齿始终留在单格安全区，武器不得退化为叉、枪或普通农具。

### 官方参考

- `https://global.inart.studio/ja/products/bajie-twelfth-scale-figure`
- `artifacts/native-pets/source-references/inart-bajie-official-20260722/`

### Hatch Pet 锁定项

- 九个标准动作行、四个 cardinal anchors 和 16 个 look 方向必须使用同一 canonical base。
- 每行逐帧检查猪脸、旧青绿袍、腰封、四蹄与九齿；任何一帧出现齿数漂移、幼态大眼、衣袍换色或武器断裂即整行返工。
- 最终仅允许通过 `validate_atlas.py --require-v2`、三位隔离盲审和连续性审查的 1536×2288 WebP 进入 `%USERPROFILE%\.codex\pets`。

### 最终锁定与证据

- canonical：`docs/pets/little-bajie-v3-inart/base-transparent.png`。脸颊和吻部比否决稿更圆、更短，眼神柔和机灵；保留成年猪妖毛发和小獠牙，不做粉色幼猪。
- 11 行动作表：`docs/pets/little-bajie-v3-inart/contact-sheet.png`；16 向表：`docs/pets/little-bajie-v3-inart/look-directions.png`。
- 发布 atlas SHA-256：`511bc2b8ca7c197407ab8e3be194aaa5f2036428c05fdcb811400525005c2277`。
- 逐帧机器审计确认 16 个 look 帧全部为九枚独立耙齿；三位隔离盲审与最终语义复核通过，无 blocker。
