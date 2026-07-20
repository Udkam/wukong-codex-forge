export const MARK_CLASSES = [
  'forge-topbar',
  'forge-sidebar',
  'forge-sidebar-action',
  'forge-new-task',
  'forge-project-active',
  'forge-workspace',
  'forge-taskbar',
  'forge-landing-hero',
  'forge-landing-title',
  'forge-composer',
  'forge-composer-button',
  'forge-input',
  'forge-turn',
  'forge-user-message',
  'forge-assistant-message',
  'forge-code-block',
  'forge-right-panel',
  'forge-right-card',
  'forge-menu',
  'forge-dialog',
  'forge-button'
];

const RUNTIME_KEY = '__wukongCodexForgeRuntimeV4';

function applyRuntime(payload) {
  const root = document.documentElement;
  const runtimeKey = payload.runtimeKey;
  const markClasses = payload.markClasses;
  const previous = window[runtimeKey];
  previous?.observer?.disconnect();
  previous?.dispose?.();
  if (previous?.timer) clearTimeout(previous.timer);

  let style = document.getElementById('wukong-forge-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wukong-forge-style';
    style.dataset.forgeOwned = '1';
    document.head.append(style);
  }
  style.textContent = payload.styleSheet + '\n' + payload.variables;
  root.classList.add('forge-ink-mountain');

  const clearMarks = () => {
    document.querySelectorAll('[data-forge-mark]').forEach(element => {
      element.classList.remove(...markClasses);
      delete element.dataset.forgeMark;
    });
  };
  const mark = (element, name) => {
    if (!(element instanceof Element)) return null;
    element.classList.add(name);
    element.dataset.forgeMark = '1';
    return element;
  };
  const markAll = (selector, name, scope = document) => {
    scope.querySelectorAll(selector).forEach(element => mark(element, name));
  };
  const visible = element => {
    if (!(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 1 && rect.height > 1 && style.display !== 'none' && style.visibility !== 'hidden';
  };
  const largeAncestor = (start, predicate) => {
    let element = start;
    let match = null;
    while (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      if (predicate(rect, element)) match = element;
      element = element.parentElement;
    }
    return match;
  };
  const panelAt = (x, y, side) => {
    const start = document.elementFromPoint(x, y);
    if (!start) return null;
    let element = start;
    while (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      const tall = rect.height >= innerHeight * .62;
      const panelWidth = rect.width >= 150 && rect.width <= Math.min(440, innerWidth * .42);
      const aligned = side === 'left' ? rect.left <= 8 : rect.right >= innerWidth - 8;
      if (tall && panelWidth && aligned) return element;
      element = element.parentElement;
    }
    return null;
  };
  const composerAncestor = editor => {
    const direct = editor.closest('[data-thread-find-composer="true"], form');
    if (direct && visible(direct)) return direct;
    let element = editor;
    let match = null;
    while (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      if (
        rect.width >= Math.min(360, innerWidth * .48) &&
        rect.width <= innerWidth * .88 &&
        rect.height >= 58 &&
        rect.height <= 240 &&
        rect.bottom >= innerHeight * .68
      ) match = element;
      if (rect.height > 260) break;
      element = element.parentElement;
    }
    return match || editor.parentElement;
  };
  const textOf = element => (element?.textContent || '').replace(/\s+/g, ' ').trim();
  const newTaskLabels = [
    '新建任务', '新聊天', '新建对话', '新任务',
    'New task', 'New chat', 'Start a new chat'
  ];

  const refresh = () => {
    clearMarks();

    const threadEvidence = document.querySelector([
      '[data-thread-find-target="conversation"]',
      '[data-virtualized-turn-content]',
      '[data-content-search-turn-key]',
      '[data-local-conversation-final-assistant]',
      '[data-message-author-role]'
    ].join(','));
    const threadRoute = /^\/(?:local|remote|thread|c)\//i.test(location.pathname);
    const surface = threadEvidence || threadRoute ? 'thread' : 'landing';
    root.dataset.forgeSurface = surface;

    let topbar = document.querySelector('body > header, #root > header, header');
    if (!topbar || topbar.getBoundingClientRect().top > 90) {
      topbar = largeAncestor(document.elementFromPoint(innerWidth * .5, 14), rect => (
        rect.top <= 8 && rect.height >= 24 && rect.height <= 86 && rect.width >= innerWidth * .52
      ));
    }
    mark(topbar, 'forge-topbar');

    let sidebar = document.querySelector('[data-testid="app-shell-floating-left-panel"], nav[aria-label], aside[aria-label*="chat" i]');
    if (!sidebar || !visible(sidebar)) sidebar = panelAt(14, innerHeight * .52, 'left');
    mark(sidebar, 'forge-sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('button, [role="button"], [role="treeitem"], a').forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width >= Math.min(110, sidebar.getBoundingClientRect().width * .48)) mark(element, 'forge-sidebar-action');
        const label = `${element.getAttribute('aria-label') || ''} ${textOf(element)}`;
        if (newTaskLabels.some(value => label.toLocaleLowerCase().includes(value.toLocaleLowerCase()))) {
          mark(element, 'forge-new-task');
        }
      });
      sidebar.querySelectorAll('[aria-selected="true"], [aria-current="page"], [data-state="active"]').forEach(element => {
        mark(element.closest('button, [role="button"], [role="treeitem"], a') || element, 'forge-project-active');
      });
    }

    let workspace = document.querySelector('[role="main"], main');
    if (!workspace || !visible(workspace)) {
      const anchor = document.querySelector('[data-thread-find-target="conversation"], [data-vscode-context*="supportsNewChatMenu"]');
      workspace = largeAncestor(anchor, rect => rect.width >= innerWidth * .42 && rect.height >= innerHeight * .58);
    }
    if (!workspace || !visible(workspace)) {
      workspace = largeAncestor(document.elementFromPoint(innerWidth * .52, innerHeight * .5), rect => (
        rect.width >= innerWidth * .42 && rect.height >= innerHeight * .58 && rect.width < innerWidth * .92
      ));
    }
    mark(workspace, 'forge-workspace');
    if (workspace) {
      const workspaceRect = workspace.getBoundingClientRect();
      const taskbar = [...workspace.querySelectorAll('header, [role="toolbar"], div')]
        .filter(element => {
          if (!visible(element)) return false;
          const rect = element.getBoundingClientRect();
          return (
            Math.abs(rect.top - workspaceRect.top) <= 4 &&
            rect.width >= workspaceRect.width * .68 &&
            rect.height >= 28 &&
            rect.height <= 72
          );
        })
        .sort((left, right) => left.getBoundingClientRect().height - right.getBoundingClientRect().height)[0];
      mark(taskbar, 'forge-taskbar');
    }

    if (surface === 'landing') {
      const title = workspace?.querySelector('h1, h2') || document.querySelector('h1, h2');
      mark(title, 'forge-landing-title');
      if (title) {
        const hero = largeAncestor(title, rect => rect.width >= 260 && rect.width <= 960 && rect.height >= 44 && rect.height <= 320);
        mark(hero || title.parentElement, 'forge-landing-hero');
      }
    }

    const editors = [...document.querySelectorAll([
      'textarea',
      '[contenteditable="true"][role="textbox"]',
      '[contenteditable="true"][data-lexical-editor="true"]',
      '[contenteditable="true"]'
    ].join(','))].filter(visible);
    const editor = editors.sort((left, right) => right.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom)[0];
    const composer = editor ? composerAncestor(editor) : null;
    mark(editor, 'forge-input');
    mark(composer, 'forge-composer');
    composer?.querySelectorAll('button, [role="button"]').forEach(button => mark(button, 'forge-composer-button'));

    markAll('[data-virtualized-turn-content], [data-content-search-turn-key], [data-message-author-role], main article', 'forge-turn');
    markAll('[data-user-message-bubble], [data-local-conversation-user-anchor], [data-message-author-role="user"]', 'forge-user-message');
    markAll('[data-local-conversation-final-assistant], [data-message-author-role="assistant"]', 'forge-assistant-message');
    markAll('pre, pre:has(code)', 'forge-code-block');

    let rightPanel = document.querySelector('[role="complementary"], aside[aria-label*="environment" i], aside[aria-label*="环境"]');
    if (!rightPanel || rightPanel === sidebar || !visible(rightPanel)) rightPanel = panelAt(innerWidth - 14, innerHeight * .52, 'right');
    mark(rightPanel, 'forge-right-panel');
    if (rightPanel) {
      [...rightPanel.querySelectorAll('div, section')].forEach(element => {
        const rect = element.getBoundingClientRect();
        const panelRect = rightPanel.getBoundingClientRect();
        if (rect.width >= panelRect.width * .72 && rect.height >= 48 && rect.height <= innerHeight * .72) {
          const computed = getComputedStyle(element);
          if (parseFloat(computed.borderRadius) >= 6 || computed.borderTopWidth !== '0px') mark(element, 'forge-right-card');
        }
      });
    }

    markAll('[role="menu"]', 'forge-menu');
    markAll('[role="dialog"]', 'forge-dialog');
    document.querySelectorAll('button').forEach(button => mark(button, 'forge-button'));
  };

  const state = { observer: null, timer: 0, refresh, dispose: null };
  const scheduleRefresh = () => {
    if (state.timer) return;
    state.timer = window.setTimeout(() => {
      state.timer = 0;
      refresh();
    }, 110);
  };
  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'aria-current', 'data-state']
  });
  window.addEventListener('popstate', scheduleRefresh);
  state.observer = observer;
  state.dispose = () => window.removeEventListener('popstate', scheduleRefresh);
  window[runtimeKey] = state;
  refresh();
}

export function makeApplyExpression({ styleSheet, variables }) {
  const payload = JSON.stringify({
    styleSheet,
    variables,
    markClasses: MARK_CLASSES,
    runtimeKey: RUNTIME_KEY
  });
  return `(${applyRuntime.toString()})(${payload})`;
}

export const RESTORE_EXPRESSION = `(() => {
  const runtime = window.${RUNTIME_KEY};
  runtime?.observer?.disconnect();
  runtime?.dispose?.();
  if (runtime?.timer) clearTimeout(runtime.timer);
  delete window.${RUNTIME_KEY};
  document.getElementById('wukong-forge-style')?.remove();
  document.querySelectorAll('[data-forge-mark]').forEach(element => {
    element.classList.remove(${MARK_CLASSES.map(name => `'${name}'`).join(',')});
    delete element.dataset.forgeMark;
  });
  document.documentElement.classList.remove('forge-ink-mountain');
  delete document.documentElement.dataset.forgeSurface;
})()`;
