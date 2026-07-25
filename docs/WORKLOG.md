# 工作日志

## 2026-07-25

### V15 输入纸面暗化

- 将 composer main、strip、pill 与 paper tile 从同一透明源统一暗化到暖灰褐综合色阶；四张产物中位色为 `RGB(125,109,92)` 至 `RGB(126,113,97)`。
- 移除运行时常驻暗化 filter，保留原生文字、按钮、ARIA、几何与命中区。
- 定向像素、材质、原生表面、forced-colors 与最小包门禁通过。
- 提交并推送：`afd2c1f style: darken V15 composer paper palette`。
- 用户实机视觉验收仍未完成，不标记整套输入区完成。

### V13 首帧与全窗竞态修复

- 修复 120/420 ms 启动探针被合并成约 520 ms 单次刷新的调度缺陷。
- `childList` 现在识别既有主题外壳内部后补内容；零尺寸标题、图标和新建页 main 进入 ResizeObserver。
- 可见对话优先于 `opacity:0` 的残留新建页，避免 thread 被错误归类为 landing。
- 新增首次提交与 resize 后 overlay/layer/image/veil 等于 viewport 的 DOMRect 合同，以及 `<300 ms` 延迟挂载、内部挂载和双页面重叠用例。
- 定向结果：`background-runtime-v13` 8/8，`native-surfaces-runtime-v14` delayed shell 1/1。
- 本里程碑不启动第二个 Codex 窗口；首图 ready/overlay generation 竞态留给下一独立提交。
