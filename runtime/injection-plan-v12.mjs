/*
 * V12 is intentionally a new runtime module instead of rewriting V11 in place.
 * The former implementation remains in the repository as an auditable history
 * of the retired surface styling.
 */
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
  'forge-assistant-turn',
  'forge-code-block',
  'forge-right-panel',
  'forge-right-card',
  'forge-right-title',
  'forge-right-row',
  'forge-menu',
  'forge-dialog',
  'forge-button'
];

const RUNTIME_KEY = '__wukongCodexForgeRuntimeV12';
const RETIRED_RUNTIME_KEYS = [
  '__wukongCodexForgeRuntimeV4',
  '__wukongCodexForgeRuntimeV5',
  '__wukongCodexForgeRuntimeV6',
  '__wukongCodexForgeRuntimeV7',
  '__wukongCodexForgeRuntimeV8',
  '__wukongCodexForgeRuntimeV9',
  '__wukongCodexForgeRuntimeV10',
  '__wukongCodexForgeRuntimeV11'
];

function applyRuntime(payload) {
  const root = document.documentElement;
  const runtimeKey = payload.runtimeKey;
  const markClasses = payload.markClasses;
  for (const retiredKey of payload.retiredRuntimeKeys) {
    const retired = window[retiredKey];
    retired?.observer?.disconnect();
    retired?.dispose?.();
    if (retired?.timer) clearTimeout(retired.timer);
    delete window[retiredKey];
  }
  const previous = window[runtimeKey];
  previous?.observer?.disconnect();
  previous?.dispose?.();
  if (previous?.timer) clearTimeout(previous.timer);

  document.getElementById('wukong-forge-pet-overlay')?.remove();
  document.getElementById('wukong-forge-motif-overlay')?.remove();
  document.getElementById('wukong-forge-background')?.remove();

  let style = document.getElementById('wukong-forge-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'wukong-forge-style';
    style.dataset.forgeOwned = 'style';
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
  const visible = element => {
    if (!(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    const computed = getComputedStyle(element);
    return rect.width > 1 && rect.height > 1 && computed.display !== 'none' && computed.visibility !== 'hidden';
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
  const composerSurface = editor => {
    const fitsComposer = element => {
      if (!visible(element)) return false;
      const rect = element.getBoundingClientRect();
      return (
        rect.width >= Math.min(360, innerWidth * .48) &&
        rect.width <= innerWidth * .94 &&
        rect.height >= 58 &&
        rect.height <= Math.min(480, innerHeight * .48) &&
        rect.bottom >= innerHeight * .68
      );
    };
    const exact = editor.closest('.composer-surface-chrome');
    if (exact && fitsComposer(exact)) return exact;
    const attributed = editor.closest('[data-codex-composer]');
    if (attributed && fitsComposer(attributed)) return attributed;
    const semanticShell = editor.closest('[data-thread-find-composer="true"]');
    if (!semanticShell) return null;
    return [...semanticShell.querySelectorAll('.composer-surface-chrome')]
      .filter(fitsComposer)
      .sort((left, right) => right.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom)[0] || null;
  };
  const textOf = element => (element?.textContent || '').replace(/\s+/g, ' ').trim();
  const newTaskLabels = [
    '新建任务', '新聊天', '新建对话', '新任务',
    'New task', 'New chat', 'Start a new chat'
  ];
  const landingTitlePattern = /我们该构建什么|今天想处理什么|准备好就开始|从哪里开始|what should we build|what(?:'s| is) on your mind|ready when you are|where should we begin|what (?:do you want|would you like) to (?:work on|do)|how can i help|新建任务/i;

  const ensureBackground = () => {
    let overlay = document.getElementById('wukong-forge-background');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'wukong-forge-background';
    overlay.dataset.forgeOwned = 'background';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    overlay.inert = true;
    for (let index = 0; index < 2; index += 1) {
      const layer = document.createElement('div');
      layer.dataset.forgeBackgroundLayer = String(index);
      layer.dataset.forgeActive = 'false';
      const image = document.createElement('i');
      image.dataset.forgeBackgroundImage = '';
      const veil = document.createElement('i');
      veil.dataset.forgeBackgroundVeil = '';
      layer.append(image, veil);
      overlay.append(layer);
    }
    document.body.append(overlay);
    return overlay;
  };

  const readCursorState = () => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem('wukong-forge-scene-cursors-v12') || '{}');
      return {
        battle: Number.isInteger(parsed.battle) ? parsed.battle : -1,
        scenery: Number.isInteger(parsed.scenery) ? parsed.scenery : -1
      };
    } catch {
      return { battle: -1, scenery: -1 };
    }
  };
  const writeCursorState = cursors => {
    try {
      sessionStorage.setItem('wukong-forge-scene-cursors-v12', JSON.stringify(cursors));
    } catch {
      // Sandboxed fixture pages may disable storage. Runtime behavior remains valid.
    }
  };
  const sceneList = (computed, name, sceneCount) => computed.getPropertyValue(name)
    .trim()
    .split(/\s+/)
    .map(value => Number.parseInt(value, 10))
    .filter(value => Number.isInteger(value) && value >= 0 && value < sceneCount);

  const renderScene = (scene, mode) => {
    const overlay = ensureBackground();
    root.dataset.forgeScene = String(scene);
    const computed = getComputedStyle(root);
    const backgroundImage = computed.getPropertyValue(`--forge-bg-${scene}`).trim() || 'none';
    const backgroundPosition = computed.getPropertyValue(`--forge-position-${scene}`).trim() || 'center center';
    const brightness = computed.getPropertyValue('--forge-scene-brightness').trim() || '1';
    const modeVeil = computed.getPropertyValue('--forge-mode-veil').trim();
    const sceneVeil = computed.getPropertyValue('--forge-scene-veil').trim();
    const veil = [modeVeil, sceneVeil].filter(value => value && value !== 'none').join(',');

    if (state.currentScene === scene && state.currentMode === mode) return;
    const initial = state.currentScene === null;
    const nextIndex = initial ? 0 : (state.activeLayer === 0 ? 1 : 0);
    const previousLayer = overlay.querySelector(`[data-forge-background-layer="${state.activeLayer}"]`);
    const nextLayer = overlay.querySelector(`[data-forge-background-layer="${nextIndex}"]`);
    const image = nextLayer.querySelector('[data-forge-background-image]');
    const veilLayer = nextLayer.querySelector('[data-forge-background-veil]');
    nextLayer.dataset.forgeScene = String(scene);
    nextLayer.dataset.forgeMode = mode;
    image.style.backgroundImage = backgroundImage;
    image.style.backgroundPosition = backgroundPosition;
    image.style.setProperty('--forge-layer-brightness', brightness);
    veilLayer.style.backgroundImage = veil || 'none';

    if (initial) {
      nextLayer.style.transition = 'none';
      nextLayer.dataset.forgeActive = 'true';
      nextLayer.style.opacity = '1';
      nextLayer.getBoundingClientRect();
      nextLayer.style.removeProperty('transition');
    } else {
      nextLayer.dataset.forgeActive = 'false';
      nextLayer.style.opacity = '0';
      nextLayer.getBoundingClientRect();
      previousLayer.dataset.forgeActive = 'false';
      previousLayer.style.opacity = '0';
      nextLayer.dataset.forgeActive = 'true';
      nextLayer.style.opacity = '1';
    }
    overlay.dataset.forgeActiveLayer = String(nextIndex);
    state.activeLayer = nextIndex;
    state.currentScene = scene;
    state.currentMode = mode;
  };

  const refresh = () => {
    state.lastRefreshAt = performance.now();
    clearMarks();
    document.getElementById('wukong-forge-pet-overlay')?.remove();
    document.getElementById('wukong-forge-motif-overlay')?.remove();

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
    let workspace = document.querySelector('[role="main"], main');
    const landingTitle = [...(workspace || document).querySelectorAll('h1, h2, [data-feature="game-source"], .heading-xl')]
      .find(element => visible(element) && landingTitlePattern.test(textOf(element)));
    const landingMain = [...document.querySelectorAll('[data-vscode-context*="supportsNewChatMenu"] [role="main"]')].some(visible);
    const localComposer = [...document.querySelectorAll('[data-thread-find-composer="true"]')].some(visible);
    const surface = threadEvidence || (localComposer && !landingTitle && !landingMain) ? 'thread' : 'landing';
    const mode = surface === 'landing' ? 'battle' : 'scenery';
    root.dataset.forgeSurface = surface;
    root.dataset.forgeMode = mode;

    const computed = getComputedStyle(root);
    const sceneCount = Math.max(1, Number.parseInt(computed.getPropertyValue('--forge-scene-count'), 10) || 1);
    const sceneryScenes = sceneList(computed, '--forge-scenery-scenes', sceneCount);
    const combinedBattleScenes = sceneList(computed, '--forge-battle-scenes', sceneCount);
    const legacyBattleScenes = [
      ...sceneList(computed, '--forge-battle-primary-scenes', sceneCount),
      ...sceneList(computed, '--forge-battle-secondary-scenes', sceneCount)
    ];
    const battleScenes = [...new Set(combinedBattleScenes.length ? combinedBattleScenes : legacyBattleScenes)];
    const choices = mode === 'battle' ? battleScenes : sceneryScenes;
    const safeChoices = choices.length ? choices : [0];

    const activeNavigation = [...document.querySelectorAll('[aria-selected="true"], [aria-current="page"], [data-state="active"]')]
      .find(visible);
    const semanticThreadKey = threadEvidence?.getAttribute('data-content-search-turn-key') ||
      threadEvidence?.getAttribute('data-thread-id') ||
      threadEvidence?.getAttribute('data-testid') ||
      '';
    const identity = [
      location.pathname,
      location.hash,
      surface,
      textOf(activeNavigation),
      semanticThreadKey,
      state.navigationEpoch
    ].join('|');
    const sceneKey = `${mode}|${identity}`;
    if (state.sceneKey !== sceneKey || !safeChoices.includes(state.currentScene)) {
      state.sceneCursors[mode] = (state.sceneCursors[mode] + 1) % safeChoices.length;
      state.sceneKey = sceneKey;
      writeCursorState(state.sceneCursors);
      renderScene(safeChoices[state.sceneCursors[mode]], mode);
    }

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

    const editors = [...document.querySelectorAll([
      'textarea',
      '[contenteditable="true"][role="textbox"]',
      '[contenteditable="true"][data-lexical-editor="true"]',
      '[contenteditable="true"]'
    ].join(','))].filter(visible);
    const editorCandidates = editors.map(editor => ({ editor, composer: composerSurface(editor) }))
      .filter(candidate => candidate.composer)
      .sort((left, right) => right.composer.getBoundingClientRect().bottom - left.composer.getBoundingClientRect().bottom);
    const editor = editorCandidates[0]?.editor || editors
      .sort((left, right) => right.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom)[0] || null;
    const composer = editorCandidates[0]?.composer || null;
    mark(editor, 'forge-input');
    mark(composer, 'forge-composer');

    state.resizeObserver?.disconnect();
    for (const element of [workspace, composer].filter(Boolean)) state.resizeObserver?.observe(element);
  };

  const state = {
    observer: null,
    resizeObserver: null,
    lastRefreshAt: 0,
    timer: 0,
    routeTimers: new Set(),
    navigationEpoch: 0,
    sceneCursors: readCursorState(),
    sceneKey: null,
    currentScene: null,
    currentMode: null,
    activeLayer: 0,
    refresh,
    dispose: null
  };
  const scheduleRefresh = () => {
    if (state.timer) return;
    const elapsed = performance.now() - state.lastRefreshAt;
    const delay = Math.max(160, 650 - elapsed);
    state.timer = window.setTimeout(() => {
      state.timer = 0;
      refresh();
    }, delay);
  };
  const queueRefreshes = delays => {
    scheduleRefresh();
    for (const delay of delays) {
      const timer = window.setTimeout(() => {
        state.routeTimers.delete(timer);
        scheduleRefresh();
      }, delay);
      state.routeTimers.add(timer);
    }
  };
  const scheduleNavigationRefresh = event => {
    const target = event.target instanceof Element
      ? event.target.closest('button, a, [role="button"], [role="treeitem"]')
      : null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const label = textOf(target);
    const mayNavigate = rect.left < Math.min(540, innerWidth * .34) ||
      newTaskLabels.some(item => label === item || label.includes(item));
    const composerSubmit = Boolean(target.closest('.forge-composer, [data-thread-find-composer="true"]'));
    if (!mayNavigate && !composerSubmit) return;
    if (mayNavigate) state.navigationEpoch += 1;
    queueRefreshes(composerSubmit ? [300, 1000, 2500] : [450, 1400]);
  };
  const scheduleComposerKeyboardSubmit = event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('.forge-composer, [data-thread-find-composer="true"]')) return;
    queueRefreshes([300, 1000, 2500]);
  };
  const scheduleRouteRefresh = () => {
    state.navigationEpoch += 1;
    queueRefreshes([350, 1100]);
  };
  const refreshStructureSelector = [
    '[data-virtualized-turn-content]',
    '[data-content-search-turn-key]',
    '[data-local-conversation-final-assistant]',
    '[data-message-author-role]',
    '[data-thread-find-composer]',
    '.composer-surface-chrome',
    'textarea',
    '[contenteditable="true"]'
  ].join(',');
  const nodeTouchesThemeStructure = node => (
    node.nodeType === Node.ELEMENT_NODE &&
    (node.matches(refreshStructureSelector) || Boolean(node.querySelector(refreshStructureSelector)))
  );
  const observer = new MutationObserver(records => {
    const structuralChange = records.some(record => (
      [...record.addedNodes, ...record.removedNodes].some(nodeTouchesThemeStructure)
    ));
    if (structuralChange) scheduleRefresh();
  });
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleRefresh) : null;
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleRouteRefresh);
  window.addEventListener('hashchange', scheduleRouteRefresh);
  window.addEventListener('resize', scheduleRefresh);
  window.visualViewport?.addEventListener('resize', scheduleRefresh);
  document.addEventListener('click', scheduleNavigationRefresh, true);
  document.addEventListener('keydown', scheduleComposerKeyboardSubmit, true);
  state.observer = observer;
  state.resizeObserver = resizeObserver;
  state.dispose = () => {
    window.removeEventListener('popstate', scheduleRouteRefresh);
    window.removeEventListener('hashchange', scheduleRouteRefresh);
    window.removeEventListener('resize', scheduleRefresh);
    window.visualViewport?.removeEventListener('resize', scheduleRefresh);
    document.removeEventListener('click', scheduleNavigationRefresh, true);
    document.removeEventListener('keydown', scheduleComposerKeyboardSubmit, true);
    observer.disconnect();
    resizeObserver?.disconnect();
    if (state.timer) clearTimeout(state.timer);
    state.routeTimers.forEach(timer => clearTimeout(timer));
    state.routeTimers.clear();
    document.getElementById('wukong-forge-pet-overlay')?.remove();
    document.getElementById('wukong-forge-motif-overlay')?.remove();
    document.getElementById('wukong-forge-background')?.remove();
  };
  window[runtimeKey] = state;
  refresh();
}

export function makeApplyExpression({ styleSheet, variables }) {
  const payload = JSON.stringify({
    styleSheet,
    variables,
    markClasses: MARK_CLASSES,
    runtimeKey: RUNTIME_KEY,
    retiredRuntimeKeys: RETIRED_RUNTIME_KEYS
  });
  return `(${applyRuntime.toString()})(${payload})`;
}

export const THEME_STATE_EXPRESSION = `(() => ({
  stylePresent: Boolean(document.getElementById('wukong-forge-style')),
  rootClass: document.documentElement.classList.contains('forge-ink-mountain'),
  markedElements: document.querySelectorAll('[data-forge-mark]').length,
  ownedNodeCount: document.querySelectorAll('[data-forge-owned]').length,
  backgroundLayerPresent: Boolean(document.getElementById('wukong-forge-background')),
  backgroundLayerCount: document.querySelectorAll('#wukong-forge-background > [data-forge-background-layer]').length,
  backgroundActiveLayer: document.getElementById('wukong-forge-background')?.dataset.forgeActiveLayer || null,
  motifLayerPresent: Boolean(document.getElementById('wukong-forge-motif-overlay')),
  surface: document.documentElement.dataset.forgeSurface || null,
  mode: document.documentElement.dataset.forgeMode || null,
  scene: document.documentElement.dataset.forgeScene || null,
  runtimeV4: Boolean(window.__wukongCodexForgeRuntimeV4),
  runtimeV5: Boolean(window.__wukongCodexForgeRuntimeV5),
  runtimeV6: Boolean(window.__wukongCodexForgeRuntimeV6),
  runtimeV7: Boolean(window.__wukongCodexForgeRuntimeV7),
  runtimeV8: Boolean(window.__wukongCodexForgeRuntimeV8),
  runtimeV9: Boolean(window.__wukongCodexForgeRuntimeV9),
  runtimeV10: Boolean(window.__wukongCodexForgeRuntimeV10),
  runtimeV11: Boolean(window.__wukongCodexForgeRuntimeV11),
  runtimeV12: Boolean(window.__wukongCodexForgeRuntimeV12)
}))()`;

export const isNativeThemeState = state => Boolean(state) &&
  state.stylePresent === false &&
  state.rootClass === false &&
  state.markedElements === 0 &&
  state.ownedNodeCount === 0 &&
  state.backgroundLayerPresent === false &&
  state.backgroundLayerCount === 0 &&
  state.backgroundActiveLayer === null &&
  state.motifLayerPresent === false &&
  state.surface === null &&
  state.mode === null &&
  state.scene === null &&
  state.runtimeV4 === false &&
  state.runtimeV5 === false &&
  state.runtimeV6 === false &&
  state.runtimeV7 === false &&
  state.runtimeV8 === false &&
  state.runtimeV9 === false &&
  state.runtimeV10 === false &&
  state.runtimeV11 === false &&
  state.runtimeV12 === false;

export const isActiveThemeState = state => Boolean(state) &&
  state.stylePresent === true &&
  state.rootClass === true &&
  state.backgroundLayerPresent === true &&
  state.backgroundLayerCount === 2 &&
  state.motifLayerPresent === false &&
  state.runtimeV11 === false &&
  state.runtimeV12 === true;

export const RESTORE_EXPRESSION = `(() => {
  for (const runtimeKey of [${[...RETIRED_RUNTIME_KEYS, RUNTIME_KEY].map(key => `'${key}'`).join(',')}]) {
    const runtime = window[runtimeKey];
    runtime?.observer?.disconnect();
    runtime?.dispose?.();
    if (runtime?.timer) clearTimeout(runtime.timer);
    delete window[runtimeKey];
  }
  document.getElementById('wukong-forge-style')?.remove();
  document.getElementById('wukong-forge-pet-overlay')?.remove();
  document.getElementById('wukong-forge-motif-overlay')?.remove();
  document.getElementById('wukong-forge-background')?.remove();
  document.querySelectorAll('[data-forge-mark]').forEach(element => {
    element.classList.remove(${MARK_CLASSES.map(name => `'${name}'`).join(',')});
    delete element.dataset.forgeMark;
  });
  document.documentElement.classList.remove('forge-ink-mountain');
  delete document.documentElement.dataset.forgeSurface;
  delete document.documentElement.dataset.forgeScene;
  delete document.documentElement.dataset.forgeMode;
  delete document.documentElement.dataset.forgeWukongSafe;
  delete document.documentElement.dataset.forgeBajieSafe;
  delete document.documentElement.dataset.forgeGourdSafe;
  delete document.documentElement.dataset.forgeGourdPlacement;
  return true;
})()`;
