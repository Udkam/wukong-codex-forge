# Wukong Codex Forge — verified design contract

## Configuration contract

shared/theme-model.mjs 是 Studio、导出和 Node 运行时共用的唯一 schema。它要求 name、五个调色板 token、完整背景对象、accessibility 和 companion；不完整的导出不可进入运行时。

Studio 将有效 JSON 保存到 localStorage，导入时重验 schema。图片只以当前浏览器会话的 data URL 预览，导出 JSON 不携带二进制。scripts/theme.ps1 才会把经验证的 JSON 和用户明确指定的本地图片复制到受控运行时目录，并将 themes/active.json 交给 injector。

## Visual system

墨色表面承载信息，玉色传达选择与焦点，古金色只标记明确行动。新建任务保留文本和原生行为，使用窄金边、启行标记、hover/focus/pressed/disabled 反馈，且与普通项目树行区别开来。

背景以 CSS 变量呈现：--forge-bg、--forge-position、--forge-backdrop-dim 与 --forge-art-intensity 均由活跃主题配置生成。运行时将本地图片作为 body 的第二层背景，在其上绘制由暗化和任务页强度生成的墨色遮罩；这避免负 z-index 背景被 body 根表面遮住，且不新增可拦截交互的覆盖层。高可读性和纯色模式明确移除图片背景，reduced-motion 生效。

## Runtime scope

注入器不会替换应用 markup，也不使用 button:not、class-name substring 或类似的无边界样式规则。它只标记明确定位到的目标：精确文本的新建任务、header、nav、role=tree 和活动行、main article、pre code、编辑器容器、role=toolbar、role=complementary、role=menu 与 dialog。对应 CSS 覆盖主工作区、消息、代码、输入/工具栏、右侧面板、菜单/弹窗、项目树活动项和这些受管区域的滚动条。所有标记都有 data-forge-mark，恢复会完整移除。

Little Wayfarer 是由 injector 创建的、pointer-events none 的受管覆盖层，显示静态“静候下一段行程”状态；它没有 hover 交互，因此不会覆盖 Codex 的点击和输入路径。它支持关闭、左右、尺寸和低动效。

mock DOM fixture 覆盖全部上述语义节点、调色板变量注入和恢复清理。另有浏览器像素测试把强红/金的抽象 SVG 写入 body 背景，确认可见工作区像素带有预期图片色，恢复后回到无图背景。它们不是每个生产 Codex 版本的视觉认证；未知 DOM 仅不会获得对应标记。

## Gallery boundary

画廊卡片只保存官方页面链接、来源名称和用户选择。用户需在来源许可范围内自行下载图片，再通过本地导入送入受管目录；仓库不会提交或下载这些第三方二进制。
