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

const ENABLED_KEY = 'wukong-codex-forge.enabled.v2';
const RUNTIME_KEY = '__wukongCodexForgeRuntimeV2';

function applyRuntime(payload) {
  const root = document.documentElement;
  const markClasses = payload.markClasses;
  const enabledKey = payload.enabledKey;
  const runtimeKey = payload.runtimeKey;
  const textForNewTask = new Set(['新建任务', '新聊天', '新建对话', 'New task', 'New chat']);
  const readPreference = () => {
    try { return localStorage.getItem(enabledKey); }
    catch { return null; }
  };
  const writePreference = enabled => {
    try { localStorage.setItem(enabledKey, enabled ? '1' : '0'); }
    catch {}
  };

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

  const landingMark = getOrCreate('forge-landing-mark', () => {
    const element = document.createElement('section');
    element.setAttribute('aria-hidden', 'true');
    const kicker = document.createElement('span');
    kicker.textContent = '齐天 · 入梦';
    const title = document.createElement('b');
    title.append('心有所向', document.createElement('br'), '万行自明');
    const note = document.createElement('i');
    note.textContent = 'WUKONG × CODEX';
    element.append(kicker, title, note);
    return element;
  });

  const toggle = getOrCreate('forge-theme-toggle', () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', '切换悟空主题与 Codex 原生主题');
    const dot = document.createElement('span');
    dot.className = 'forge-toggle-dot';
    dot.textContent = '悟';
    const label = document.createElement('span');
    label.className = 'forge-toggle-label';
    button.append(dot, label);
    return button;
  });

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
      const status = document.createElement('span');
      element.append(image, status);
      return element;
    });
    companion.dataset.side = payload.companion.side;
    companion.dataset.motion = payload.companion.motion;
    companion.style.setProperty('--forge-companion-size', payload.companion.size + 'px');
    companion.querySelector('img').src = payload.companion.image;
  }

  const updateToggle = enabled => {
    root.classList.toggle('forge-ink-mountain', enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.title = enabled ? '关闭主题，恢复 Codex 原生外观' : '开启悟空主题';
    toggle.querySelector('.forge-toggle-label').textContent = enabled ? '主题' : '原生';
  };

  const setEnabled = enabled => {
    writePreference(enabled);
    updateToggle(enabled);
  };

  toggle.onclick = () => setEnabled(!root.classList.contains('forge-ink-mountain'));
  updateToggle(readPreference() !== '0');

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
      if (button === toggle) return;
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
    landingMark.dataset.surface = surface;
    if (companion) {
      companion.dataset.surface = surface;
      companion.querySelector('span').textContent = surface === 'landing' ? '候你启程' : '静候下一段行程';
    }
  };

  const state = { observer: null, timer: 0, refresh, setEnabled };
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
    enabledKey: ENABLED_KEY,
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
  try { localStorage.removeItem('${ENABLED_KEY}'); } catch {}
})()`;
