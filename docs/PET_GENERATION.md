# V10 同行者生成谱系

> **V12 动作修复进行中。** V11 canonical 继续保留，未被覆盖。2026-07-23 首轮 row 1/2/4 修复候选保存在 `artifacts/native-pets/hover-running-repair-20260723T120000+0800/`，但未进入 `pets/`：小天命人的跑动/hover 行变成了不同比例和风格的 Q 版大圣，与其余夜叉套行断裂；小八戒的钉耙持法也未满足游戏动作。两者均作为失败历史保留。

repair-v2 位于 `artifacts/native-pets/hover-running-repair-v2-20260723T214520+0800/`，仍然没有改写 canonical：

- 小八戒已形成可独立审查的完整 v2 atlas：一手持九齿钉耙、一手捧腹，row 4 完成前俯—后仰—肩腹弹起的大笑节奏；最终图集 SHA-256 为 `e553bf09e234bcaff67f43a2f3a2f6ae446a5abc70ddec322b7682edf0ca478a`。
- 小天命人 repair-v2 虽保持了同一夜叉套角色，但跑动与棍花仍未达到游戏动作保真要求，继续作为被否决候选保留。repair-v3 必须以用户本地录像的连续帧相位图为依据，不凭单帧或文字猜动作。

V12 新候选必须遵守：

- 小天命人 row 1、2 与其余行使用同一夜叉套角色、真人/手办比例、脸、材质和兽棍·神锋；不得用另一只卡通猴拼接。棍花只写入与 Hatch 语义相容的可见动作行，不覆写“挥手”等无关语义。
- 小八戒 row 4 模仿“大笑奶龙”的捧腹节奏，但只借表演，不改变八戒造型。一手始终拿正确完整九齿钉耙，一手捧腹，动作在五帧内完成前俯、后仰抬头、肩腹弹起和回落；钉耙只被动随重心轻摆。
- 所有旧行逐像素保留的说法只在角色风格连续时成立；若替换行破坏角色身份，即使 atlas/alpha/几何测试通过也必须否决。

> **V11 现行路线。** 本文其余内容记录 V10 静态同行者素材的历史生成链，不代表当前安装包。V11 页面运行时不再加载静态悟空/八戒 WebP；两位角色改用 Hatch Pet v2，现行造型与验收锁定见 [PET_DESIGN.md](PET_DESIGN.md)，运行目录位于 `artifacts/native-pets/little-wukong-v4-yaksha-shenfeng/` 与 `artifacts/native-pets/little-bajie-v3-inart/`。所有被否决的基准和动画行继续保留，但不得进入 `pet.json`。

## V11 最终生成账本

| 宠物 | canonical / final | 发布文件 | 验证结果 |
| --- | --- | --- | --- |
| 小悟空·厌火夜叉 | `base-selected-b-transparent.png` → `spritesheet-extended-v7.webp` | `pets/little-wukong-yaksha-shenfeng/` | 1536×2288 RGBA、8×11、9 标准动作、16 方向、透明 RGB residue 0；atlas SHA-256 `018c3447368c23f963335710ca09086efd634b2826b2913a920f3960e3d77d87` |
| 小八戒 | `base-c-friendly-transparent.png` → `spritesheet-extended-candidate-c-v1.webp` | `pets/little-bajie-v3-inart/` | 1536×2288 RGBA、8×11、9 标准动作、16 方向、16 look 帧恰好九齿、透明 RGB residue 0；atlas SHA-256 `511bc2b8ca7c197407ab8e3be194aaa5f2036428c05fdcb811400525005c2277` |

Hatch Pet 第 7 行 `running` 按现行技能合同表达 active task work / processing / focused effort，而不是强制角色在画面中位移奔跑；最终复核已按该语义重新判定。每个包用 `package-proof.json` 绑定 exact versioned atlas、validation 与 QA run summary，拒绝任何未版本化旧图集。可提交的 canonical、contact sheet、16 向表、盲审合并结果和最终复核位于 `docs/pets/`；完整中间件继续只增不删地保留在 `artifacts/native-pets/`。

本文件记录 0.9.0 活动小悟空与小八戒的生成输入、提示词、中间件和透明化参数。两张角色图是主题专用生成资产，不是 Game Science 模型导出或官方立绘。

## 小悟空

参考图：

- 仓库旧 V6 小悟空活动图。
- 用户本地 `E:\GameRecord\Black Myth Wukong\TipsImg\Img_LoadTips_200003_B.png`。

原始生成结果保留于 Codex 生成目录：

`C:\Users\Alex Chen\.codex\generated_images\019f7e3d-c80b-7370-95e1-8f374ed257a5\exec-adf3f69e-74e6-449c-8446-e463e55258b6.png`

完整提示词：

> Use case: premium desktop companion asset for a Codex theme. Create one compact full-body little Wukong pet, visually grounded in the supplied high-fidelity game references. Preserve believable monkey facial anatomy, individual fur strands, worn jade-turquoise and dark engraved metal armor, red cord accents, and a correctly proportioned golden staff. Pose: calm alert crouch, facing three-quarters toward the viewer, staff resting diagonally behind one shoulder; readable silhouette at 100 px, slightly compact proportions but not chibi, not toy-like, not cartoon, no oversized head. Mood: intelligent, restrained, mythic. Lighting: soft warm rim light with controlled mineral-jade highlights, detailed but uncluttered. Isolated character only, centered with generous padding, absolutely no text, logo, watermark, UI, pedestal, ground, shadow, smoke, sparks, or scenery. Background must be a perfectly flat uniform chroma magenta #FF00FF from edge to edge, with no gradient, texture, vignette, antialias halo, reflection, or cast shadow. Asset should be suitable for chroma-key removal.

版本链：

- `themes/motifs/pets/little-wukong-pet-v1-chroma.png`
- `themes/motifs/pets/little-wukong-pet-v1.png`
- `themes/motifs/pets/little-wukong-pet-v1.webp`

## 小八戒

参考图：仓库旧 V6 小八戒活动图。

原始生成结果保留于同一 Codex 生成目录：

`C:\Users\Alex Chen\.codex\generated_images\019f7e3d-c80b-7370-95e1-8f374ed257a5\exec-f0e23390-9632-4bdc-882f-0dad65059d58.png`

完整提示词：

> Use case: premium desktop companion asset for a Codex theme. Create one compact full-body little Bajie pet, visually grounded in the supplied high-fidelity game reference. Preserve believable boar facial anatomy, coarse individual bristles, small tusks, expressive amber eyes, worn blue-green robe, prayer beads, layered weathered cloth and leather. He must carry a correctly shaped traditional nine-tooth rake: a long dark wooden/metal shaft with a clearly readable row of nine separate metal tines, resting diagonally behind his shoulders. Pose: relaxed sturdy squat or seated crouch, three-quarters toward the viewer; warm, shrewd, loyal expression. Readable silhouette at 100 px, slightly compact proportions but not chibi, not toy-like, not cartoon, no oversized head. Lighting: soft warm rim light with subdued jade and bronze accents, detailed but uncluttered. Isolated character only, centered with generous padding, absolutely no text, logo, watermark, UI, pedestal, ground, shadow, smoke, sparks, or scenery. Background must be a perfectly flat uniform chroma magenta #FF00FF from edge to edge, with no gradient, texture, vignette, antialias halo, reflection, or cast shadow. Asset should be suitable for chroma-key removal.

版本链：

- `themes/motifs/pets/little-bajie-pet-v1-chroma.png`
- `themes/motifs/pets/little-bajie-pet-v1.png`
- `themes/motifs/pets/little-bajie-pet-v1.webp`

## 透明化与发布

使用 `C:\Users\Alex Chen\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py`，以边缘自动取键色、soft matte、内阈值 18、外阈值 82 和 spill cleanup 去除 `#FF00FF`。透明 PNG 保留作编辑证据，WebP 作为运行包活动素材。运行时只从本地 data URL 读取 WebP，不发出素材网络请求。

小悟空最终 WebP 为 142,866 bytes，小八戒最终 WebP 为 202,024 bytes；两者在 92–112 px 显示档保持清晰轮廓，并由独立无交互覆盖层承载。
