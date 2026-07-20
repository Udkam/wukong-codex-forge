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

const RUNTIME_KEY = '__wukongCodexForgeRuntimeV5';

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
  const composerSurface = editor => {
    const fitsComposer = element => {
      if (!visible(element)) return false;
      const rect = element.getBoundingClientRect();
      return (
        rect.width >= Math.min(360, innerWidth * .48) &&
        rect.width <= Math.min(960, innerWidth * .9) &&
        rect.height >= 58 &&
        rect.height <= 240 &&
        rect.bottom >= innerHeight * .68
      );
    };
    const exact = editor.closest('.composer-surface-chrome');
    if (exact && fitsComposer(exact)) return exact;
    const attributed = editor.closest('[data-codex-composer]');
    if (attributed && fitsComposer(attributed)) return attributed;
    return [...document.querySelectorAll('[data-thread-find-composer="true"] .composer-surface-chrome')]
      .filter(fitsComposer)
      .sort((left, right) => right.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom)[0] || null;
  };
  const textOf = element => (element?.textContent || '').replace(/\s+/g, ' ').trim();
  const stableHash = value => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };
  const newTaskLabels = [
    '新建任务', '新聊天', '新建对话', '新任务',
    'New task', 'New chat', 'Start a new chat'
  ];
  let battleCycle = 0;

  const refresh = () => {
    clearMarks();

    const previousSurface = root.dataset.forgeSurface || null;
    const threadEvidence = [...document.querySelectorAll([
      '[data-thread-find-target="conversation"]',
      '[data-virtualized-turn-content]',
      '[data-content-search-turn-key]',
      '[data-local-conversation-final-assistant]',
      '[data-message-author-role]',
      '[data-testid*="conversation" i]',
      '[data-testid*="assistant" i]',
      '[class*="conversation-turn" i]'
    ].join(','))].find(visible);
    const surfaceRoot = document.querySelector('[role="main"], main');
    const landingTitle = [...(surfaceRoot || document).querySelectorAll('h1, h2')].some(element => (
      /今天想处理什么|准备好就开始|从哪里开始|what(?:'s| is) on your mind|ready when you are|where should we begin|what (?:do you want|would you like) to (?:work on|do)|how can i help|新建任务/i.test(textOf(element))
    ));
    const landingMain = [...document.querySelectorAll('[data-vscode-context*="supportsNewChatMenu"] [role="main"]')].some(visible);
    const localComposer = [...document.querySelectorAll('[data-thread-find-composer="true"]')].some(visible);
    const surface = threadEvidence || (localComposer && !landingTitle && !landingMain) ? 'thread' : 'landing';
    root.dataset.forgeSurface = surface;
    const mode = surface === 'landing' ? 'battle' : 'scenery';
    root.dataset.forgeMode = mode;
    const rootStyle = getComputedStyle(root);
    const sceneCount = Math.max(1, Number.parseInt(rootStyle.getPropertyValue('--forge-scene-count'), 10) || 1);
    const sceneList = name => rootStyle.getPropertyValue(name)
      .trim()
      .split(/\s+/)
      .map(value => Number.parseInt(value, 10))
      .filter(value => Number.isInteger(value) && value >= 0 && value < sceneCount);
    const sceneryScenes = sceneList('--forge-scenery-scenes');
    const primaryBattleScenes = sceneList('--forge-battle-primary-scenes');
    const secondaryBattleScenes = sceneList('--forge-battle-secondary-scenes');
    let scene = 0;
    if (mode === 'battle') {
      if (previousSurface === 'thread') battleCycle += 1;
      const useSecondary = secondaryBattleScenes.length > 0 && battleCycle % 4 === 3;
      const choices = useSecondary ? secondaryBattleScenes : primaryBattleScenes;
      if (choices.length) scene = choices[battleCycle % choices.length];
    } else if (sceneryScenes.length) {
      const key = `${location.pathname}|${document.title || 'codex'}`;
      scene = sceneryScenes[stableHash(`${key}|scenery`) % sceneryScenes.length];
    }
    root.dataset.forgeScene = String(scene);

    let topbar = document.querySelector('body > header, #root > header, header');
    if (!topbar || topbar.getBoundingClientRect().top > 90) {
      topbar = largeAncestor(document.elementFromPoint(innerWidth * .5, 14), rect => (
        rect.top <= 8 && rect.height >= 24 && rect.height <= 86 && rect.width >= innerWidth * .52
      ));
    }
    mark(topbar, 'forge-topbar');

    let sidebar = document.querySelector('aside.app-shell-left-panel, aside[data-testid="app-shell-floating-left-panel"], [data-testid="app-shell-floating-left-panel"], nav[aria-label], aside[aria-label*="chat" i]');
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
    const composer = editor ? composerSurface(editor) : null;
    mark(editor, 'forge-input');
    mark(composer, 'forge-composer');
    composer?.querySelectorAll('button, [role="button"]').forEach(button => mark(button, 'forge-composer-button'));

    markAll('[data-virtualized-turn-content], [data-content-search-turn-key], [data-message-author-role], main article', 'forge-turn');
    markAll('[data-user-message-bubble]', 'forge-user-message');
    document.querySelectorAll('[data-message-author-role="user"]').forEach(turn => {
      mark(turn.querySelector('[data-user-message-bubble]') || turn, 'forge-user-message');
    });
    document.querySelectorAll([
      '[data-local-conversation-final-assistant]',
      '[data-message-author-role="assistant"]',
      '[data-testid*="assistant" i]',
      '[aria-label*="assistant" i]',
      '[aria-label*="回答"]',
      '[class*="assistant-message" i]'
    ].join(',')).forEach(element => {
      mark(element, 'forge-assistant-message');
    });
    markAll('pre, pre:has(code)', 'forge-code-block');

    let rightPanel = document.querySelector('[data-pip-obstacle="thread-summary-panel"], aside[data-app-shell-focus-area="right-panel"], [role="complementary"], aside[aria-label*="environment" i], aside[aria-label*="环境"]');
    if (!rightPanel || rightPanel === sidebar || !visible(rightPanel)) rightPanel = panelAt(innerWidth - 14, innerHeight * .52, 'right');
    mark(rightPanel, 'forge-right-panel');
    if (rightPanel) {
      const rightCards = [...rightPanel.querySelectorAll('div, section')].filter(element => {
        const rect = element.getBoundingClientRect();
        const panelRect = rightPanel.getBoundingClientRect();
        if (rect.width >= panelRect.width * .72 && rect.height >= 48 && rect.height <= innerHeight * .72) {
          const computed = getComputedStyle(element);
          return parseFloat(computed.borderRadius) >= 6 || computed.borderTopWidth !== '0px';
        }
        return false;
      }).sort((left, right) => {
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        return rightRect.width * rightRect.height - leftRect.width * leftRect.height;
      });
      mark(rightCards[0], 'forge-right-card');
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
  delete document.documentElement.dataset.forgeScene;
  delete document.documentElement.dataset.forgeMode;
})()`;
