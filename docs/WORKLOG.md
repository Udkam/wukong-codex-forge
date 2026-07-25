# 工作日志

## 2026-07-25

### 解码像素硬预算

- 在既有压缩字节上限之外，为 JPEG、PNG、WebP 增加无需完整解码的尺寸头检查。
- 单背景上限 12,000,000 px；图库唯一文件总计 32,000,000 px；最大两张过渡图合计 16,000,000 px；单 UI/装饰图 4,194,304 px。
- 活动 11 图实测总计 22,220,472 px，最大两张合计 4,743,680 px；8 张 UI WebP 单张最大 580,608 px。
- 内存内构造的 100,000×100,000 PNG 会在 payload 组装前被拒绝；无需生成或保留超大测试文件。
- `great-sage-return.jpg` 仍为 1256×707，明确保留为低于 1080p 的视觉质量待办。
- 定向结果：像素预算/最小包 4/4，原生主题定义验证通过；未启动第二个 Codex 窗口。

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

### V13 首图 ready 与 overlay generation

- 首张背景改为单请求解码后提交；`data-forge-background-ready` 之前保留 Codex 原生 main/fade paint。
- CDP `Runtime.evaluate` 显式等待 apply Promise，安装器与 watcher 不会在首图尚未解码时提前宣称成功。
- 覆盖层在交叉淡化中被删除或损坏时立即撤销 ready、取消旧 generation 的 timer/预载并恢复原生 paint；新层完成解码后以单活动层重新公开。
- `ACTIVE_PROBE` 与主题状态合同同时要求 root ready、overlay ready、两层结构和真实活动图。
- 定向结果：背景状态机 10/10、V15 原生表面 7/7、生命周期关键合同 2/2、最小包/保留式安装 4/4。
- 未启动第二个 Codex 窗口；真实 Codex 视觉验收仍待后续单窗口里程碑。

### V13 快速导航 timer 上限

- 每次新的路由/提交复核先取消上一组 route timer，再登记最新 3 个有界探针。
- 100 次连续 history 变化时 `routeTimers.size <= 3`，最后一组期限结束后回到 0。
- 定向结果：快速导航与刷新合同 2/2；无窗口、服务或端口残留。
