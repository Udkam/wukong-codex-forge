# 大圣归来 · 潇湘双境 — 设计与实现

## 设计结论

本轮不做“深色界面加金边”，也不用古风卡片、书法标签、emoji 或装饰按钮制造主题感。视觉核心是“真实电影画面 + 潇湘矿色 + 两位同行者”：杨戬、大圣、夜叉王和黑神话风景承担画面张力，湘妃葫芦提供石青识别，小悟空与小八戒提供角色温度。夜叉套、兽棍·神锋和武器条已按用户最终意见停用。

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

## 伴随元素与组件映射

| 元素 | 设计特征 | 落点 |
| --- | --- | --- |
| 小悟空 | 以用户本地实机帧为主体依据，保留青色鳞甲、猴脸、尾巴与棍，透明背景 | landing 输入器左侧空白沟槽 88 × 98 px；thread 收敛为 62 × 70 px |
| 小八戒 | 以实机截图与影神图交叉核对，保留旧青袍、念珠、猪首与九齿钉耙，透明背景 | landing 输入器右侧空白沟槽 92 × 100 px；thread 收敛为 68 × 74 px |
| 湘妃葫芦 | 游戏图标中的青绿双节、银白泪痕、蓝绳与流苏 | 优先位于输入器左侧剩余沟槽，右侧回退；landing 42 × 64 px，thread 34 × 52 px |
| 侧栏 / 环境卡 | 墨铁底、石青窄边、旧金发丝线、漆褐暗纹 | 只换材质，不显示人物或装备 |

三件伴随元素均使用透明 WebP。人物静止，不做呼吸循环；全部 `pointer-events:none`。V9 在初始化、关键结构新增/移除、侧栏/提交动作和窗口尺寸变化时计算候选矩形；若与标题、用户气泡、助手回答、代码块或右侧环境卡相交则隐藏。宽度小于 900 px 隐藏葫芦，小于 780 px 隐藏两位同行者。原始 PNG 与被否决素材保留在仓库工作树或 Git 历史，但最小运行包不复制。

## 配色与明度

| 角色 | 色值 | 用法 |
| --- | --- | --- |
| 骨白 | `#e5dfd4` | 正文和关键标题 |
| 漆褐 | `#7c4438` / `#4f2e28` | 用户气泡右缘与小面积暗纹 |
| 潇湘石青 | `#4f7f7c` / `#82aaa4` | focus、选中边与次级信息 |
| 旧金 | `#a88755` / `#c6ad7d` | 链接、分隔发丝线与小面积热点 |
| 墨铁 | `#171917` / `#252825` | 基层、侧栏和稳定阅读表面 |

配色是画面的承托，不是主题本身。战斗境主体区遮罩较薄，确保杨戬、夜叉王和金箍棒可识别；风景境只在文字左右增加方向性 veil，不把图压成近黑。

## 原生几何和内容契约

- 不对顶部栏、侧栏、项目树、环境行、消息和输入槽位设置 `width`、`height`、`margin`、`padding`、`gap` 或 `transform`；只有 composer 保留 `position:relative` 作为同行者伪元素坐标系，DOMRect 必须保持一致。
- composer 只在实际组合框宽 360–960 px、高 58 px 至 `min(480 px, 48vh)` 且位于页面底部时标记；外层过宽 `form` 不再降级命中，长输入也不会突然失去样式。
- 环境栏只标记面积最大的一个候选容器，防止多层嵌套同时变成卡片。
- 从实际 `[data-local-conversation-final-assistant]` 开始，只清理到其所属 turn 的真实包装链，去除背景、边框、阴影、outline 和 filter；不越过 turn 污染工作区。代码块可保留独立黑铁表面。
- 用户气泡只更换不占布局的材质与轮廓。注入前后对话 `innerText` 必须逐字一致。
- 唯一新增节点是 `head` 内的受管 `<style>`；body 内不新增任何 UI。人物与葫芦分别使用 composer/workspace 的伪元素，不抢占 DOM 或点击命中。

## 恢复与兼容

恢复表达式会断开结构 `MutationObserver`，取消侧栏/提交复核定时器，移除 popstate、hashchange、resize、click、keydown listener、style、class、`data-forge-mark`、状态与三项碰撞属性，并清除葫芦定位变量。强制高对比模式下禁用所有图片伪元素，优先保证系统可访问性。

便携启动器使用解压目录内 `.wukong-runtime` 的隔离 web profile 和随机回环端口，不写官方程序文件。0.8.0 使用 Codex 自带 `cua_node` 与仅依赖 `http`、`crypto`、`zlib` 的回环协议客户端，不携带 npm 依赖树。11 张背景在变量载荷中各编码一次，`--forge-art-*` 只引用对应 `--forge-bg-*`；当前变量载荷 3,654,150 字符，完整样式 3,670,925 字符。停用必须验证 V4–V9 style/class/mark/runtime 全部消失后才成功；磁盘文件由脚本原样保留。关闭主题窗口后，用户自行删除整个解压目录即可回到普通 Codex。已经运行且没有 CDP 端口的普通 Codex 无法从外部热注入，这是 Chromium 运行边界。
