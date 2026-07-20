# 大圣归来 · 玄锋双境 — 设计与实现

## 设计结论

本轮不再做“深色界面加金边”，也不用古风卡片、书法标签、emoji 或装饰按钮制造主题感。视觉核心改为“真实画面 + 高保真兵甲实物”：杨戬、大圣、夜叉王和黑神话风景承担画面张力，厌火套装、兽棍·神锋和金箍棒承担组件辨识度。

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

## 装备与组件映射

| 元素 | 真实特征 | 落点 |
| --- | --- | --- |
| 厌火套装 | 暗红长角、鬼面、灰蓝绣衫、玫红骨肉纹与前臂骨刺 | 新建任务按钮、当前项目、环境信息外卡 |
| 兽棍·神锋 | 旧金兽首、青绿结晶核、象牙骨刺、灰白波纹棍身与暗红短穗 | 输入框底部右侧 112 × 24 px 短截武器头 |
| 金箍棒 | 暗褐红棍芯、分段旧金箍环和燃金棍势 | 输入框底部 168–224 × 20 px 实景嵌件 |

厌火套装与兽棍·神锋均使用透明 PNG，不再用通用 SVG 盾牌、直线或随机切角替代实际装备。原图、编辑方式和权利边界记录在 `ASSET_SOURCES.md`。

## 配色与明度

| 角色 | 色值 | 用法 |
| --- | --- | --- |
| 骨白 | `#e5dfd4` | 正文和关键标题 |
| 夜叉漆红 | `#8f2f3e` / `#b94655` | 厌火内甲、尾脊与小面积强调 |
| 神锋青钢 | `#527a75` / `#a8b5b3` | focus、接缝和次级信息 |
| 金箍旧金 | `#b79455` / `#d0b172` | 金环、链接和小面积热点 |
| 石青黑铁 | `#202420` / `#292e2b` | 基层、侧栏和稳定阅读表面 |

配色是画面的承托，不是主题本身。战斗境主体区遮罩较薄，确保杨戬、夜叉王和金箍棒可识别；风景境只在文字左右增加方向性 veil，不把图压成近黑。

## 原生几何和内容契约

- 不对顶部栏、侧栏、项目树、环境行、消息和输入槽位设置 `width`、`height`、`margin`、`padding`、`gap`、定位或 `transform`。
- composer 只在实际组合框宽 360–960 px、高 58–240 px 且位于页面底部时标记；外层过宽 `form` 不再降级命中，修复“输入框被拉长”的生产 DOM 风险。
- 环境栏只标记面积最大的一个候选容器，防止多层嵌套同时变成卡片。
- 只对实际 `[data-local-conversation-final-assistant]` 助手包装去除背景、边框、阴影、outline 和 filter；不再污染 turn 祖先链。代码块可保留独立黑铁表面。
- 用户气泡只更换不占布局的材质与轮廓。注入前后对话 `innerText` 必须逐字一致。
- 唯一新增节点是 `head` 内的受管 `<style>`；body 内不新增任何 UI。

## 恢复与兼容

恢复表达式会断开 observer，移除 listener、style、class、`data-forge-mark`、`data-forge-surface`、`data-forge-mode` 与 `data-forge-scene`。强制高对比模式下禁用所有图片伪元素，优先保证系统可访问性。

受管启动器使用主题目录内的隔离 web profile 和随机回环端口，不写官方程序文件。0.7.0 采用 append-only release：新包写入新目录，旧 app/state/素材与配置快照保留；停用只请求 renderer 恢复，不删除磁盘文件。已经运行且没有 CDP 端口的普通 Codex 无法从外部热注入；这是 Chromium 运行边界，不得在交付说明中写成“复制即对当前窗口生效”。
