export const MARK_CLASSES = [
  'forge-new-task',
  'forge-topbar',
  'forge-sidebar',
  'forge-project-tree',
  'forge-project-active',
  'forge-workspace',
  'forge-message',
  'forge-code-block',
  'forge-composer-anchor',
  'forge-tool-rail',
  'forge-right-panel',
  'forge-menu',
  'forge-dialog',
  'forge-button',
  'forge-icon-button',
  'forge-input'
];

const RUNTIME_KEY = '__wukongCodexForgeRuntimeV2';

function applyRuntime(payload) {
  const root = document.documentElement;
  const markClasses = payload.markClasses;
  const runtimeKey = payload.runtimeKey;
  const textForNewTask = new Set(['新建任务', '新聊天', '新建对话', 'New task', 'New chat']);

  const previous = window[runtimeKey];
  previous?.observer?.disconnect();
  if (previous?.timer) clearTimeout(previous.timer);

  let style = document.getElementById('wukong-forge-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wukong-forge-style';
    style.dataset.forgeOwned = '1';
    document.head.append(style);
  }
  style.textContent = payload.styleSheet + '\n' + payload.variables;

  const clearMarks = () => {
    document.querySelectorAll('[data-forge-mark]').forEach(element => {
      element.classList.remove(...markClasses);
      delete element.dataset.forgeMark;
    });
  };

  const mark = (element, name) => {
    if (!element) return;
    element.classList.add(name);
    element.dataset.forgeMark = '1';
  };

  const markAll = (selector, name, scope = document) => {
    scope.querySelectorAll(selector).forEach(element => mark(element, name));
  };

  const getOrCreate = (className, build) => {
    let element = document.querySelector('.' + className + '[data-forge-owned="1"]');
    if (!element) {
      element = build();
      element.classList.add(className);
      element.dataset.forgeOwned = '1';
      document.body.append(element);
    }
    return element;
  };

  let companion = document.querySelector('.forge-wayfarer[data-forge-owned="1"]');
  if (!payload.companion?.enabled) {
    companion?.remove();
    companion = null;
  } else {
    companion = getOrCreate('forge-wayfarer', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      image.alt = '';
      element.append(image);
      return element;
    });
    companion.dataset.side = payload.companion.side;
    companion.dataset.motion = payload.companion.motion;
    companion.style.setProperty('--forge-companion-size', payload.companion.size + 'px');
    companion.querySelector('img').src = payload.companion.image;
  }

  root.classList.add('forge-ink-mountain');

  const refresh = () => {
    clearMarks();
    mark(document.querySelector('header'), 'forge-topbar');
    mark(document.querySelector('aside[role="navigation"], nav'), 'forge-sidebar');
    mark(document.querySelector('[role="tree"]'), 'forge-project-tree');
    markAll('[role="tree"] [aria-selected="true"], [role="treeitem"][aria-selected="true"]', 'forge-project-active');
    const workspace = document.querySelector('main');
    mark(workspace, 'forge-workspace');
    markAll('main article, main [role="article"], main [data-message-author-role]', 'forge-message');
    markAll('main pre:has(code)', 'forge-code-block');
    markAll('[role="toolbar"]', 'forge-tool-rail');
    markAll('[role="complementary"]', 'forge-right-panel');
    markAll('[role="menu"]', 'forge-menu');
    markAll('[role="dialog"]', 'forge-dialog');
    markAll('textarea, [contenteditable="true"]', 'forge-input');

    const editor = document.querySelector('textarea, [contenteditable="true"]');
    const composer = editor?.closest('form') || editor?.parentElement?.parentElement || editor?.parentElement;
    mark(composer, 'forge-composer-anchor');

    document.querySelectorAll('button').forEach(button => {
      mark(button, 'forge-button');
      const text = button.textContent.trim();
      if (!text || text.length <= 2) mark(button, 'forge-icon-button');
      if (textForNewTask.has(text)) mark(button, 'forge-new-task');
    });

    const messageCount = document.querySelectorAll(
      'main article, main [role="article"], main [data-message-author-role]'
    ).length;
    const surface = messageCount > 0 ? 'thread' : 'landing';
    root.dataset.forgeSurface = surface;
    if (companion) {
      companion.dataset.surface = surface;
    }
  };

  const state = { observer: null, timer: 0, refresh };
  const scheduleRefresh = () => {
    if (state.timer) return;
    state.timer = window.setTimeout(() => {
      state.timer = 0;
      refresh();
    }, 120);
  };
  const observer = new MutationObserver(scheduleRefresh);
  state.observer = observer;
  observer.observe(document.body, { childList: true, subtree: true });
  refresh();
  window[runtimeKey] = state;
}

export function makeApplyExpression({ styleSheet, variables, companion }) {
  const payload = JSON.stringify({
    styleSheet,
    variables,
    companion,
    markClasses: MARK_CLASSES,
    runtimeKey: RUNTIME_KEY
  });
  return `(${applyRuntime.toString()})(${payload})`;
}

export const RESTORE_EXPRESSION = `(() => {
  const runtime = window.${RUNTIME_KEY};
  runtime?.observer?.disconnect();
  if (runtime?.timer) clearTimeout(runtime.timer);
  delete window.${RUNTIME_KEY};
  document.getElementById('wukong-forge-style')?.remove();
  document.querySelectorAll('[data-forge-owned="1"]').forEach(element => element.remove());
  document.querySelectorAll('[data-forge-mark]').forEach(element => {
    element.classList.remove(${MARK_CLASSES.map(name => `'${name}'`).join(',')});
    delete element.dataset.forgeMark;
  });
  document.documentElement.classList.remove('forge-ink-mountain');
  delete document.documentElement.dataset.forgeSurface;
})()`;
