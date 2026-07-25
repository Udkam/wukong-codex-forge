# 小天命人 base 候选门禁

状态：`INTERNAL_PASS / USER_PENDING`

候选：

- 保留原图：`history/base-candidate-01-green.png`
- 透明候选：`decoded/base-candidate-01-edge-contract-1.png`
- 原生单元：`qa/base-candidate-01-native-cell-v2.png`
- 4× 审计图：`qa/base-candidate-01-native-cell-v2-4x-dark.png`
- 机器指标：`qa/base-candidate-01-metrics.json`

## 白名单审计

- 厌火夜叉面、双长角、灰白鬃冠、烟灰旧袍、赤红妖臂均可辨认。
- 近侧腿为赤红胫甲、骨脊与爪趾；远侧脚为独立暗赤魔足，没有退化成灰布脚或裸人脚。
- 全图只有一柄神锋；兽首前端、连接箍、前棍身、握持段、手后后棍身和尾端连续完整，未被衣袍吞没或裁切。
- 192×208 原生单元实际 alpha 留白为左 29、上 17、右 29、下 16 px，全部达到 18×16 安全边距。
- 可见像素中绿键残留计数为 0。

## 追溯

- 透明候选 SHA-256：`6DA6A645A81DD75593A0D44F56C807A876BB9F673662FCE4A6FE8E4B6D5A5644`
- 原生单元 SHA-256：`8950E268070DC57096689E0BC38BFD115C4E59BE46009FB9019BE2CDE8742FFA`

本地门只证明“允许交给用户审计”，不等于用户接受。用户明确通过前，不复制为 `references/canonical-base.png`，不生成动作行、不组 atlas、不安装。
