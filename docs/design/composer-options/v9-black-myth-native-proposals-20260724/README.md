# V9 黑神话原生输入器结构提案

状态：`PREVIEW_ONLY_AWAITING_USER_SELECTION`

本目录仅用于审稿。三案尚未接入 `runtime/forge-background-v13.css`，也不会在用户选择前影响本机 Codex。

## 为什么重做

V1–V8 的共同问题不是颜色，而是结构：闭合金框、器物贴片、武器缩略图、全幅断线或几乎不可见的暗色锯齿都无法在隐藏方案名后指向《黑神话：悟空》。V8 的 fixture 还固定为 736×96、把 `overflow` 改成 `auto`，并通过 1 px 边框使 editor/footer 相对原生发生位移，不能作为运行时基线。

V9 改用当前实机常见的 736×98，同时覆盖 560×98 与 154 px 多行增长态。真正的运行时验收标准不是锁死高度，而是主题注入前后 host/editor/footer/五个按钮的 DOMRect、文字、ARIA 与命中区完全一致。

## 三案

### A｜章回残墨

- 识别锚点：单向凝墨、游戏菜单式短残纸选中带、朱点与破边朱批。
- 不是卷轴，也不是全幅金线；中央约 70% 保持安静。
- 适合希望“样式变化最明显，但仍克制”的方向。

### B｜金箍锁锋

- 识别锚点：只在原 32 px 发送座内出现暗红漆芯与两道磨损金箍。
- 不横画整根金箍棒，不改原向上箭头，不创建第二个按钮。
- IP 识别最直接，也最需要用户确认“够不够巧妙”。

### C｜大圣翎影

- 识别锚点：烟褐旧纸断口与大圣双翎负形。
- 不放人物或装备贴图；双翎只在发送侧构成结构性负形。
- 与杨戬/大圣主背景的角色重点直接呼应。

## 硬合同

- 审稿尺寸：736×98、560×98；多行验证高度：154 px。
- host/editor/footer/五个按钮在主题前后 DOMRect 全等。
- “随心输入”、权限、模型文字、ARIA、原发送箭头与所有命中区不变。
- `overflow: hidden` 保持原样；候选不写死生产高度。
- 每案最多一个全尺寸静态 surface pseudo 与一个细节 pseudo。
- 无外部请求、无候选位图、无图片解码、无 JS timer、无动画、无 filter、无 `will-change`。
- `prefers-reduced-motion` 下零过渡；`forced-colors` 下隐藏装饰并回退原生可读面。
- 用户选定前不接入运行时。

## 审稿产物

- `v9-composer-proposals-1x-20260724.png`：三案 736×98 / 560×98 原尺寸对比。
- `v9-composer-contexts-1x-20260724.png`：杨戬白场战斗与林寺暗景对比。
- `v9-composer-blind-1x-20260724.png`：隐藏名称的盲审图。
- `v9-*-focus-1x-20260724.png`：每案双宽度独立裁图。
- `v9-composer-geometry-and-resource-proof-20260724.json`：几何、命中区、无障碍与资源合同证据。

## 运行审稿

```powershell
node .\docs\design\composer-options\v9-black-myth-native-proposals-20260724\capture-and-verify-v9-20260724.mjs
```

该脚本只启动无头浏览器，生成截图后立即关闭，不启动第二个 Codex 调试窗口，也不保留监听端口。
