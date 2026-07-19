# Wukong Codex Forge — design contract

The visual system is an engineering workbench in ink: layered stone surfaces, muted jade for state, and antique gold only for deliberate commands. It references the tension of a staff held before a crossing, cloud sea, wet temple stone, and restrained embers—not a generic orange/brown skin.

## Coverage checklist

The injected stylesheet targets application chrome, sidebar/project tree, active and pinned rows, conversation and code, composer/tool rail, inspector panel, menus/dialogs, buttons, scrollbar, hover/focus/pressed/disabled states, and compact sidebar mode. Selectors are deliberately additive: the runtime never replaces application markup.

## Primary command: 新建任务 / 启行

`新建任务` remains readable and native-clickable. The enhanced `forge-new-task` class gives it a staff-like left rule, a recessed ink field, a short jade command mark, and explicit hover/focus-visible/active/disabled/compact states. It is intentionally separate from project-tree rows, pinned items, installed items, and plugins.

## Companion boundary

Little Wayfarer is a project-managed optional overlay, not an OpenAI/ChatGPT pet feature. It is an original generated asset (`assets/little-wayfarer.png`), can be disabled, positioned at either edge, resized, and reduced to still mode. It never receives pointer events or overlaps the composer/menu safe zones.
