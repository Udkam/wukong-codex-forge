# 小八戒 base 候选门禁

状态：`INTERNAL_PASS / USER_PENDING`

候选：

- 首轮失败稿：`history/base-candidate-01-rejected-wolf-face.png`
- 成年猪妖修复稿：`history/base-candidate-02-pig-face-nine-tooth-rake.png`
- 当前笑脸原图：`history/base-candidate-03-smiling-game-bajie-nine-tooth-rake.png`
- 当前透明候选：`decoded/base-candidate-03-edge-contract-1.png`
- 原生单元：`qa/base-candidate-03-native-cell.png`
- 4× 审计图：`qa/base-candidate-03-native-cell-4x-dark.png`
- 机器指标：`qa/base-candidate-03-metrics.json`

## 白名单审计

- 成年、矮壮、低重心的游戏式小八戒；灰棕粗硬毛、宽黑鼻、两枚短獠牙、正常大小红棕眼和机灵笑容均可辨认。
- 旧青绿袍、深炭围巾、黑珠串、黑褐腰封、骨扣与深色分片围裙保持一致，没有退化成亮青通用和尚服。
- 全图只有一柄钉耙；长柄、尾鐏、旧铜横梁全部完整。
- 九枚弯曲象牙齿从左到右可独立计数为 1–9，无粘连、缺齿、第二耙首或武器裁切。
- 192×208 原生单元实际 alpha 留白为左 18、上 32、右 18、下 32 px，全部达到 18×16 安全边距。
- 可见像素中洋红键残留计数为 0。

## 追溯

- 透明候选 SHA-256：`2D3A477885A86849E17A1314AD53AE57B17B28FEDF5B7066CDA83C0B72E5ABD6`
- 原生单元 SHA-256：`96385286E560B0A9056B853904045E8EAFD0A4B040C45E74AE59FB8F9D0984D1`

本地门只证明“允许交给用户审计”，不等于用户接受。用户明确通过前，不复制为 `references/canonical-base.png`，不生成动作行、不组 atlas、不安装。
