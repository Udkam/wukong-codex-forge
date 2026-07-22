# V10 同行者生成谱系

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
