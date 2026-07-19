# Wukong Codex Forge — verified design contract

## Configuration contract

shared/theme-model.mjs 是 Studio、导出和 Node 运行时共用的唯一 schema。它要求 name、五个调色板 token、完整背景对象、accessibility 和 companion；不完整的导出不可进入运行时。

Studio 将有效 JSON 保存到 localStorage，导入时重验 schema。图片只以当前浏览器会话的 data URL 预览，导出 JSON 不携带二进制。scripts/theme.ps1 才会把经验证的 JSON 和用户明确指定的本地图片复制到受控运行时目录，并将 themes/active.json 交给 injector。

## Visual system

墨色表面承载信息，玉色传达选择与焦点，古金色只标记明确行动。新建任务保留文本和原生行为，使用窄金边、启行标记、hover/focus/pressed/disabled 反馈，且与普通项目树行区别开来。

背景以 CSS 变量呈现：--forge-bg、--forge-position、--forge-backdrop-dim 与 --forge-art-intensity 均由活跃主题配置生成。高可读性预设没有背景且 reduced-motion 生效。

## Runtime scope

注入器不会替换应用 markup，也不使用 button:not、class-name substring 或类似的无边界样式规则。它只标记明确定位到的目标：精确文本的新建任务、首个 header、导航容器、编辑器容器与 dialog。无法定位的节点不会被猜测性覆写。

Little Wayfarer 是由 injector 创建的、pointer-events none 的受管覆盖层，显示静态“静候下一段行程”状态；它没有 hover 交互，因此不会覆盖 Codex 的点击和输入路径。它支持关闭、左右、尺寸和低动效。

## Gallery boundary

画廊卡片只保存官方页面链接、来源名称和用户选择。用户需在来源许可范围内自行下载图片，再通过本地导入送入受管目录；仓库不会提交或下载这些第三方二进制。
