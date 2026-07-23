/*
 * V13 keeps V12's native-layout background scope, replaces its scene
 * lifecycle, and applies the explicitly approved landing-title/icon skin.
 * V4–V12 stay in the repository as retained implementation history.
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
  'forge-landing-icon',
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

const RUNTIME_KEY = '__wukongCodexForgeRuntimeV13';
const RETIRED_RUNTIME_KEYS = [
  '__wukongCodexForgeRuntimeV4',
  '__wukongCodexForgeRuntimeV5',
  '__wukongCodexForgeRuntimeV6',
  '__wukongCodexForgeRuntimeV7',
  '__wukongCodexForgeRuntimeV8',
  '__wukongCodexForgeRuntimeV9',
  '__wukongCodexForgeRuntimeV10',
  '__wukongCodexForgeRuntimeV11',
  '__wukongCodexForgeRuntimeV12'
];

function applyRuntime(payload) {
  const root = document.documentElement;
  const runtimeKey = payload.runtimeKey;
  const markClasses = payload.markClasses;

  for (const retiredKey of payload.retiredRuntimeKeys) {
    const retired = window[retiredKey];
    retired?.observer?.disconnect();
    retired?.resizeObserver?.disconnect();
    retired?.dispose?.();
    if (retired?.timer) clearTimeout(retired.timer);
    delete window[retiredKey];
  }
  const previous = window[runtimeKey];
  previous?.observer?.disconnect();
  previous?.resizeObserver?.disconnect();
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
  style.textContent = `${payload.styleSheet}\n${payload.variables}`;
  root.classList.add('forge-ink-mountain');

  const restoreLandingCopy = element => {
    if (!(element instanceof Element)) return;
    if (Object.hasOwn(element.dataset, 'forgeOriginalAriaLabel')) {
      const original = element.dataset.forgeOriginalAriaLabel;
      if (original === '__forge_absent__') element.removeAttribute('aria-label');
      else element.setAttribute('aria-label', original);
      delete element.dataset.forgeOriginalAriaLabel;
    }
    delete element.dataset.forgeTitleCopy;
  };
  const clearMarks = () => {
    document.querySelectorAll('[data-forge-mark]').forEach(element => {
      restoreLandingCopy(element);
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
  const textOf = element => (element?.textContent || '').replace(/\s+/g, ' ').trim();
  const visible = element => {
    if (!(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return false;
    for (let cursor = element; cursor && cursor !== document.documentElement; cursor = cursor.parentElement) {
      const computed = getComputedStyle(cursor);
      if (
        cursor.hidden ||
        cursor.getAttribute('aria-hidden') === 'true' ||
        cursor.hasAttribute('inert') ||
        computed.display === 'none' ||
        computed.visibility === 'hidden' ||
        Number.parseFloat(computed.opacity || '1') <= .01
      ) return false;
    }
    return true;
  };
  const layoutPresent = element => {
    if (!(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return false;
    for (let cursor = element; cursor && cursor !== document.documentElement; cursor = cursor.parentElement) {
      const computed = getComputedStyle(cursor);
      if (
        cursor.hidden ||
        cursor.hasAttribute('inert') ||
        computed.display === 'none' ||
        computed.visibility === 'hidden'
      ) return false;
    }
    return true;
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

  const ensureBackground = () => {
    let overlay = document.getElementById('wukong-forge-background');
    if (overlay && overlay.querySelectorAll(':scope > [data-forge-background-layer]').length !== 2) {
      overlay.remove();
      overlay = null;
    }
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
    document.body.prepend(overlay);
    state.overlayGeneration += 1;
    return overlay;
  };

  const normalizeStoredCursor = value => Number.isInteger(value) && value >= -1 ? value : -1;
  const readCursorState = () => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem('wukong-forge-scene-cursors-v13') || '{}');
      return {
        battle: normalizeStoredCursor(parsed.battle),
        scenery: normalizeStoredCursor(parsed.scenery)
      };
    } catch {
      return { battle: -1, scenery: -1 };
    }
  };
  const writeCursorState = cursors => {
    try {
      sessionStorage.setItem('wukong-forge-scene-cursors-v13', JSON.stringify(cursors));
    } catch {
      // Sandboxed fixture pages may disable storage.
    }
  };
  const sceneList = (computed, name, sceneCount) => computed.getPropertyValue(name)
    .trim()
    .split(/\s+/)
    .map(value => Number.parseInt(value, 10))
    .filter(value => Number.isInteger(value) && value >= 0 && value < sceneCount);
  const sourceFromCssUrl = value => {
    const trimmed = String(value || '').trim();
    if (!trimmed || trimmed === 'none') return '';
    const match = trimmed.match(/^url\((['"]?)(.*)\1\)$/s);
    return match ? match[2] : '';
  };
  const preloadBackground = backgroundImage => {
    const source = sourceFromCssUrl(backgroundImage);
    if (!source) return Promise.resolve(false);
    const existing = state.preloadRequests.get(source);
    if (existing) return existing.promise;
    state.preloadRequests.forEach(request => request.cancel());

    let resolvePromise;
    let settled = false;
    let timeout = 0;
    const image = new Image();
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    const finish = value => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      try { image.src = ''; } catch { }
      state.preloadRequests.delete(source);
      resolvePromise(value);
    };
    const request = {
      promise,
      cancel: () => finish(false)
    };
    state.preloadRequests.set(source, request);
    timeout = window.setTimeout(() => finish(false), 5000);
    image.onload = async () => {
      try { await image.decode?.(); } catch { }
      finish(image.naturalWidth > 0);
    };
    image.onerror = () => finish(false);
    image.src = source;
    if (image.complete && image.naturalWidth > 0) finish(true);
    return promise;
  };
  const readSceneStyle = (scene, mode) => {
    const priorScene = root.dataset.forgeScene;
    const priorMode = root.dataset.forgeMode;
    root.dataset.forgeScene = String(scene);
    root.dataset.forgeMode = mode;
    const computed = getComputedStyle(root);
    const backgroundVariable = `--forge-bg-${scene}`;
    const result = {
      scene,
      mode,
      backgroundImage: `var(${backgroundVariable})`,
      preloadImage: computed.getPropertyValue(backgroundVariable).trim() || 'none',
      backgroundPosition: computed.getPropertyValue(`--forge-position-${scene}`).trim() || 'center center',
      brightness: computed.getPropertyValue('--forge-scene-brightness').trim() || '1',
      veil: [
        computed.getPropertyValue('--forge-mode-veil').trim(),
        computed.getPropertyValue('--forge-scene-veil').trim()
      ].filter(value => value && value !== 'none').join(',')
    };
    if (priorScene == null) delete root.dataset.forgeScene;
    else root.dataset.forgeScene = priorScene;
    if (priorMode == null) delete root.dataset.forgeMode;
    else root.dataset.forgeMode = priorMode;
    return result;
  };
  const paintLayer = (layer, sceneStyle) => {
    const image = layer.querySelector('[data-forge-background-image]');
    const veil = layer.querySelector('[data-forge-background-veil]');
    layer.dataset.forgeScene = String(sceneStyle.scene);
    layer.dataset.forgeMode = sceneStyle.mode;
    image.style.backgroundImage = sceneStyle.backgroundImage;
    image.style.backgroundPosition = sceneStyle.backgroundPosition;
    image.style.setProperty('--forge-layer-brightness', sceneStyle.brightness);
    veil.style.backgroundImage = sceneStyle.veil || 'none';
  };
  const clearLayer = layer => {
    if (!layer) return;
    const image = layer.querySelector('[data-forge-background-image]');
    const veil = layer.querySelector('[data-forge-background-veil]');
    layer.dataset.forgeActive = 'false';
    layer.style.opacity = '0';
    delete layer.dataset.forgeScene;
    delete layer.dataset.forgeMode;
    if (image) {
      image.style.backgroundImage = 'none';
      image.style.removeProperty('background-position');
      image.style.removeProperty('--forge-layer-brightness');
    }
    if (veil) veil.style.backgroundImage = 'none';
  };
  const transitionDuration = () => {
    const value = getComputedStyle(root).getPropertyValue('--forge-background-transition').trim();
    if (value.endsWith('ms')) return Math.max(0, Number.parseFloat(value) || 0);
    if (value.endsWith('s')) return Math.max(0, (Number.parseFloat(value) || 0) * 1000);
    return 820;
  };
  const commitScene = sceneStyle => {
    const overlay = ensureBackground();
    const initial = state.currentScene === null;
    if (!initial && state.transitionInFlight) {
      state.pendingSceneStyle = sceneStyle;
      return;
    }
    const nextIndex = initial ? 0 : (state.activeLayer === 0 ? 1 : 0);
    const previousLayer = overlay.querySelector(`[data-forge-background-layer="${state.activeLayer}"]`);
    const nextLayer = overlay.querySelector(`[data-forge-background-layer="${nextIndex}"]`);
    paintLayer(nextLayer, sceneStyle);
    root.dataset.forgeScene = String(sceneStyle.scene);
    root.dataset.forgeMode = sceneStyle.mode;

    if (initial) {
      nextLayer.style.transition = 'none';
      nextLayer.dataset.forgeActive = 'true';
      nextLayer.style.opacity = '1';
      nextLayer.getBoundingClientRect();
      nextLayer.style.removeProperty('transition');
    } else {
      state.transitionInFlight = true;
      overlay.dataset.forgeTransitioning = 'true';
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
    state.currentScene = sceneStyle.scene;
    state.currentMode = sceneStyle.mode;
    state.renderCount += 1;

    if (!initial) {
      const finishTransition = () => {
        state.transitionTimer = 0;
        state.transitionInFlight = false;
        delete overlay.dataset.forgeTransitioning;
        clearLayer(previousLayer);
        const pending = state.pendingSceneStyle;
        state.pendingSceneStyle = null;
        if (pending && (pending.scene !== state.currentScene || pending.mode !== state.currentMode)) {
          commitScene(pending);
        }
      };
      const duration = transitionDuration();
      if (duration === 0) queueMicrotask(finishTransition);
      else state.transitionTimer = window.setTimeout(finishTransition, duration + 60);
    }
  };
  const requestScene = (scene, mode, force = false) => {
    const requestKey = `${mode}:${scene}:${state.overlayGeneration}`;
    if (!force && (
      (state.currentScene === scene && state.currentMode === mode) ||
      state.requestedSceneKey === requestKey
    )) return;
    const sceneStyle = readSceneStyle(scene, mode);
    state.requestedSceneKey = requestKey;
    const token = ++state.sceneRequestToken;

    if (state.currentScene === null) {
      commitScene(sceneStyle);
      state.requestedSceneKey = null;
      return;
    }

    void preloadBackground(sceneStyle.preloadImage).then(ready => {
      if (token !== state.sceneRequestToken) return;
      state.requestedSceneKey = null;
      if (!ready) return;
      commitScene(sceneStyle);
    });
  };
  const overlayReady = () => {
    const overlay = document.getElementById('wukong-forge-background');
    if (!overlay || overlay.querySelectorAll(':scope > [data-forge-background-layer]').length !== 2) return false;
    const active = overlay.querySelector('[data-forge-background-layer][data-forge-active="true"]');
    const image = active?.querySelector('[data-forge-background-image]');
    return Boolean(active && image && image.style.backgroundImage && image.style.backgroundImage !== 'none');
  };

  const landingTitlePattern = /我们该构建什么|今天想处理什么|准备好就开始|从哪里开始|what should we build|what(?:'s| is) on your mind|ready when you are|where should we begin|what (?:do you want|would you like) to (?:work on|do)|how can i help|新建任务/i;
  const newTaskLabels = [
    '新建任务', '新聊天', '新建对话', '新任务',
    'New task', 'New chat', 'Start a new chat'
  ];
  const exactNewTask = label => newTaskLabels.some(item => label === item || label.startsWith(`${item} `));
  const threadSelectors = [
    '[data-virtualized-turn-content]',
    '[data-local-conversation-final-assistant]',
    '[data-message-author-role]',
    '[data-content-search-turn-key]'
  ].join(',');
  const conversationHasTurns = element => {
    if (!(element instanceof Element)) return false;
    if (element.matches(threadSelectors)) return true;
    return Boolean(element.querySelector(threadSelectors));
  };
  const findLandingTitle = workspace => {
    const scope = workspace || document;
    /*
     * The official home hero enters through a 280 ms opacity animation. Its
     * stable node can therefore have a real layout while opacity is still 0.
     * Detect the layout node instead of waiting for paint; otherwise the skin
     * only appears after an unrelated resize schedules another refresh.
     */
    const stable = [...scope.querySelectorAll('[data-feature="game-source"]')].find(layoutPresent);
    if (stable) return stable;
    return [...scope.querySelectorAll('h1, h2, .heading-xl')]
      .find(element => layoutPresent(element) && landingTitlePattern.test(textOf(element)));
  };
  const classifySurface = workspace => {
    const landingTitle = findLandingTitle(workspace);
    const landingMain = [...document.querySelectorAll('[data-vscode-context*="supportsNewChatMenu"] [role="main"]')].some(visible);
    const threadEvidence = [...document.querySelectorAll([
      '[data-thread-find-target="conversation"]',
      threadSelectors
    ].join(','))].find(element => visible(element) && conversationHasTurns(element));
    const surface = landingTitle || landingMain ? 'landing' : (threadEvidence ? 'thread' : 'landing');
    return { surface, threadEvidence, landingTitle };
  };
  const commonAncestor = (first, second) => {
    if (!(first instanceof Element) || !(second instanceof Element)) return null;
    let cursor = first;
    while (cursor && cursor !== document.body) {
      if (cursor.contains(second)) return cursor;
      cursor = cursor.parentElement;
    }
    return null;
  };
  const markLandingHero = (workspace, landingTitle) => {
    if (!(landingTitle instanceof Element)) return;
    const titleCopy = '此去，欲破何局？';
    if (!Object.hasOwn(landingTitle.dataset, 'forgeOriginalAriaLabel')) {
      landingTitle.dataset.forgeOriginalAriaLabel =
        landingTitle.hasAttribute('aria-label')
          ? landingTitle.getAttribute('aria-label')
          : '__forge_absent__';
    }
    landingTitle.dataset.forgeTitleCopy = titleCopy;
    landingTitle.setAttribute('aria-label', titleCopy);
    mark(landingTitle, 'forge-landing-title');

    const icon = [...(workspace || document).querySelectorAll('[data-testid="home-icon"]')]
      .find(layoutPresent);
    if (icon) mark(icon, 'forge-landing-icon');

    const hero = commonAncestor(landingTitle, icon) || landingTitle.parentElement;
    if (hero && hero !== workspace) mark(hero, 'forge-landing-hero');
  };
  const taskIdentity = threadEvidence => {
    const threadCarrier = threadEvidence?.closest('[data-thread-id], [data-conversation-id], [data-task-id]');
    const explicit = threadCarrier?.getAttribute('data-thread-id') ||
      threadCarrier?.getAttribute('data-conversation-id') ||
      threadCarrier?.getAttribute('data-task-id') ||
      '';
    const route = `${location.pathname}|${location.hash}`;
    const activeNavigation = [...document.querySelectorAll('[aria-selected="true"], [aria-current="page"], [data-state="active"]')]
      .find(visible);
    return explicit || route || textOf(activeNavigation) || 'thread';
  };
  const findWorkspace = () => {
    let workspace = document.querySelector('[role="main"], main');
    if (workspace && visible(workspace)) return workspace;
    const anchor = document.querySelector('[data-thread-find-target="conversation"], [data-vscode-context*="supportsNewChatMenu"]');
    workspace = largeAncestor(anchor, rect => rect.width >= innerWidth * .42 && rect.height >= innerHeight * .58);
    if (workspace && visible(workspace)) return workspace;
    return largeAncestor(document.elementFromPoint(innerWidth * .52, innerHeight * .5), rect => (
      rect.width >= innerWidth * .42 && rect.height >= innerHeight * .58 && rect.width < innerWidth * .92
    ));
  };
  const setResizeTargets = targets => {
    const next = targets.filter(Boolean);
    if (
      next.length === state.observedResizeTargets.length &&
      next.every((target, index) => target === state.observedResizeTargets[index])
    ) return;
    state.resizeObserver?.disconnect();
    state.observedResizeTargets = next;
    next.forEach(target => state.resizeObserver?.observe(target));
  };
  const refresh = () => {
    state.lastRefreshAt = performance.now();
    state.refreshCount += 1;
    clearMarks();
    document.getElementById('wukong-forge-pet-overlay')?.remove();
    document.getElementById('wukong-forge-motif-overlay')?.remove();

    const overlayWasReady = overlayReady();
    ensureBackground();
    const workspace = findWorkspace();
    mark(workspace, 'forge-workspace');
    const { surface, threadEvidence, landingTitle } = classifySurface(workspace);
    const mode = surface === 'landing' ? 'battle' : 'scenery';
    root.dataset.forgeSurface = surface;
    root.dataset.forgeMode = mode;
    if (surface === 'landing') markLandingHero(workspace, landingTitle);

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
    const identity = surface === 'landing'
      ? `landing|${location.pathname}|${location.hash}|${state.landingEpoch}`
      : `thread|${taskIdentity(threadEvidence)}`;
    const sceneKey = `${mode}|${identity}`;

    if (state.sceneKey !== sceneKey || !safeChoices.includes(state.currentScene)) {
      const stored = normalizeStoredCursor(state.sceneCursors[mode]);
      state.sceneCursors[mode] = (stored + 1) % safeChoices.length;
      state.sceneKey = sceneKey;
      writeCursorState(state.sceneCursors);
      requestScene(safeChoices[state.sceneCursors[mode]], mode, !overlayWasReady);
    } else if (!overlayWasReady) {
      requestScene(state.currentScene, mode, true);
    }

    setResizeTargets([workspace]);
  };

  const state = {
    observer: null,
    resizeObserver: null,
    observedResizeTargets: [],
    lastRefreshAt: 0,
    timer: 0,
    routeTimers: new Set(),
    landingEpoch: 0,
    sceneCursors: readCursorState(),
    sceneKey: null,
    currentScene: null,
    currentMode: null,
    activeLayer: 0,
    transitionInFlight: false,
    transitionTimer: 0,
    pendingSceneStyle: null,
    requestedSceneKey: null,
    sceneRequestToken: 0,
    preloadRequests: new Map(),
    overlayGeneration: 0,
    refreshCount: 0,
    renderCount: 0,
    refresh,
    dispose: null
  };
  const scheduleRefresh = () => {
    if (state.timer) return;
    const elapsed = performance.now() - state.lastRefreshAt;
    const delay = Math.max(140, 520 - elapsed);
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
    const label = textOf(target);
    const newTask = exactNewTask(label);
    const composerSubmit = Boolean(target.closest('[data-thread-find-composer="true"], .composer-surface-chrome'));
    const possibleNavigation = newTask ||
      target.matches('a[href], [role="treeitem"], [aria-current], [aria-selected]') ||
      target.closest('a[href], [role="treeitem"]');
    if (!possibleNavigation && !composerSubmit) return;
    if (newTask) state.landingEpoch += 1;
    queueRefreshes(composerSubmit ? [260, 900, 2200] : [360, 1050]);
  };
  const scheduleComposerKeyboardSubmit = event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest('[data-thread-find-composer="true"], .composer-surface-chrome')) return;
    queueRefreshes([260, 900, 2200]);
  };
  const routeEventName = 'wukong-forge-route-v13';
  const scheduleRouteRefresh = () => queueRefreshes([120, 500, 1200]);
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  const notifyRoute = () => window.dispatchEvent(new Event(routeEventName));
  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    notifyRoute();
    return result;
  };
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    notifyRoute();
    return result;
  };

  const refreshStructureSelector = [
    '[data-feature="game-source"]',
    '[data-testid="home-icon"]',
    '[data-vscode-context*="supportsNewChatMenu"]',
    '[data-virtualized-turn-content]',
    '[data-content-search-turn-key]',
    '[data-local-conversation-final-assistant]',
    '[data-message-author-role]',
    '[data-thread-find-composer]',
    '[data-thread-find-target="conversation"]'
  ].join(',');
  const nodeTouchesThemeStructure = node => {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if (node.id === 'wukong-forge-background') return true;
    if (node.matches('[data-forge-owned], [data-forge-owned] *')) return false;
    return node.matches(refreshStructureSelector) || Boolean(node.querySelector(refreshStructureSelector));
  };
  const observer = new MutationObserver(records => {
    if (records.some(record => (
      [...record.addedNodes, ...record.removedNodes].some(nodeTouchesThemeStructure)
    ))) scheduleRefresh();
  });
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(scheduleRefresh) : null;
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', scheduleRouteRefresh);
  window.addEventListener('hashchange', scheduleRouteRefresh);
  window.addEventListener(routeEventName, scheduleRouteRefresh);
  window.addEventListener('resize', scheduleRefresh);
  window.visualViewport?.addEventListener('resize', scheduleRefresh);
  document.addEventListener('click', scheduleNavigationRefresh, true);
  document.addEventListener('keydown', scheduleComposerKeyboardSubmit, true);
  state.observer = observer;
  state.resizeObserver = resizeObserver;
  state.dispose = () => {
    window.removeEventListener('popstate', scheduleRouteRefresh);
    window.removeEventListener('hashchange', scheduleRouteRefresh);
    window.removeEventListener(routeEventName, scheduleRouteRefresh);
    window.removeEventListener('resize', scheduleRefresh);
    window.visualViewport?.removeEventListener('resize', scheduleRefresh);
    document.removeEventListener('click', scheduleNavigationRefresh, true);
    document.removeEventListener('keydown', scheduleComposerKeyboardSubmit, true);
    observer.disconnect();
    resizeObserver?.disconnect();
    if (state.timer) clearTimeout(state.timer);
    if (state.transitionTimer) clearTimeout(state.transitionTimer);
    state.sceneRequestToken += 1;
    state.requestedSceneKey = null;
    state.pendingSceneStyle = null;
    state.preloadRequests.forEach(request => request.cancel());
    state.preloadRequests.clear();
    state.routeTimers.forEach(timer => clearTimeout(timer));
    state.routeTimers.clear();
    if (history.pushState === state.patchedPushState) history.pushState = originalPushState;
    if (history.replaceState === state.patchedReplaceState) history.replaceState = originalReplaceState;
    document.getElementById('wukong-forge-pet-overlay')?.remove();
    document.getElementById('wukong-forge-motif-overlay')?.remove();
    document.getElementById('wukong-forge-background')?.remove();
  };
  state.patchedPushState = history.pushState;
  state.patchedReplaceState = history.replaceState;
  window[runtimeKey] = state;
  refresh();
  /*
   * Bounded startup probes cover React mounting the home hero after the first
   * runtime pass. They stop after 420 ms and do not become a polling loop.
   */
  queueRefreshes([120, 420]);
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

export const THEME_STATE_EXPRESSION = `(() => {
  const overlay = document.getElementById('wukong-forge-background');
  const activeLayer = overlay?.querySelector('[data-forge-background-layer][data-forge-active="true"]') || null;
  const activeImage = activeLayer?.querySelector('[data-forge-background-image]') || null;
  return {
    stylePresent: Boolean(document.getElementById('wukong-forge-style')),
    rootClass: document.documentElement.classList.contains('forge-ink-mountain'),
    markedElements: document.querySelectorAll('[data-forge-mark]').length,
    ownedNodeCount: document.querySelectorAll('[data-forge-owned]').length,
    backgroundLayerPresent: Boolean(overlay),
    backgroundLayerCount: overlay?.querySelectorAll(':scope > [data-forge-background-layer]').length || 0,
    backgroundActiveLayer: overlay?.dataset.forgeActiveLayer || null,
    backgroundActiveScene: activeLayer?.dataset.forgeScene || null,
    backgroundActiveMode: activeLayer?.dataset.forgeMode || null,
    backgroundActiveImage: activeImage?.style.backgroundImage || '',
    backgroundLoadedLayerCount: overlay
      ? [...overlay.querySelectorAll('[data-forge-background-image]')]
        .filter(image => image.style.backgroundImage && image.style.backgroundImage !== 'none').length
      : 0,
    backgroundTransitioning: overlay?.dataset.forgeTransitioning === 'true',
    preloadInFlight: window.__wukongCodexForgeRuntimeV13?.preloadRequests?.size || 0,
    motifLayerPresent: Boolean(document.getElementById('wukong-forge-motif-overlay')),
    surface: document.documentElement.dataset.forgeSurface || null,
    mode: document.documentElement.dataset.forgeMode || null,
    scene: document.documentElement.dataset.forgeScene || null,
    refreshCount: window.__wukongCodexForgeRuntimeV13?.refreshCount || 0,
    renderCount: window.__wukongCodexForgeRuntimeV13?.renderCount || 0,
    runtimeV4: Boolean(window.__wukongCodexForgeRuntimeV4),
    runtimeV5: Boolean(window.__wukongCodexForgeRuntimeV5),
    runtimeV6: Boolean(window.__wukongCodexForgeRuntimeV6),
    runtimeV7: Boolean(window.__wukongCodexForgeRuntimeV7),
    runtimeV8: Boolean(window.__wukongCodexForgeRuntimeV8),
    runtimeV9: Boolean(window.__wukongCodexForgeRuntimeV9),
    runtimeV10: Boolean(window.__wukongCodexForgeRuntimeV10),
    runtimeV11: Boolean(window.__wukongCodexForgeRuntimeV11),
    runtimeV12: Boolean(window.__wukongCodexForgeRuntimeV12),
    runtimeV13: Boolean(window.__wukongCodexForgeRuntimeV13)
  };
})()`;

export const ACTIVE_PROBE_EXPRESSION = `(() => {
  const overlay = document.getElementById('wukong-forge-background');
  const layers = overlay?.querySelectorAll(':scope > [data-forge-background-layer]') || [];
  const active = overlay?.querySelector('[data-forge-background-layer][data-forge-active="true"]');
  const image = active?.querySelector('[data-forge-background-image]');
  return Boolean(
    document.getElementById('wukong-forge-style') &&
    document.documentElement.classList.contains('forge-ink-mountain') &&
    window.__wukongCodexForgeRuntimeV13 &&
    layers.length === 2 &&
    active &&
    image?.style.backgroundImage &&
    image.style.backgroundImage !== 'none'
  );
})()`;

export const isActiveThemeState = state => Boolean(state) &&
  state.stylePresent === true &&
  state.rootClass === true &&
  state.backgroundLayerPresent === true &&
  state.backgroundLayerCount === 2 &&
  ['0', '1'].includes(state.backgroundActiveLayer) &&
  ['landing', 'thread'].includes(state.surface) &&
  state.mode === (state.surface === 'landing' ? 'battle' : 'scenery') &&
  /^\d+$/.test(String(state.scene || '')) &&
  state.backgroundActiveScene === state.scene &&
  state.backgroundActiveMode === state.mode &&
  Boolean(state.backgroundActiveImage && state.backgroundActiveImage !== 'none') &&
  state.motifLayerPresent === false &&
  state.runtimeV12 === false &&
  state.runtimeV13 === true;

export const isNativeThemeState = state => Boolean(state) &&
  state.stylePresent === false &&
  state.rootClass === false &&
  state.markedElements === 0 &&
  state.ownedNodeCount === 0 &&
  state.backgroundLayerPresent === false &&
  state.motifLayerPresent === false &&
  state.runtimeV4 === false &&
  state.runtimeV5 === false &&
  state.runtimeV6 === false &&
  state.runtimeV7 === false &&
  state.runtimeV8 === false &&
  state.runtimeV9 === false &&
  state.runtimeV10 === false &&
  state.runtimeV11 === false &&
  state.runtimeV12 === false &&
  state.runtimeV13 === false;

export const RESTORE_EXPRESSION = `(() => {
  for (const runtimeKey of [${[...RETIRED_RUNTIME_KEYS, RUNTIME_KEY].map(key => `'${key}'`).join(',')}]) {
    const runtime = window[runtimeKey];
    runtime?.observer?.disconnect();
    runtime?.resizeObserver?.disconnect();
    runtime?.dispose?.();
    if (runtime?.timer) clearTimeout(runtime.timer);
    delete window[runtimeKey];
  }
  document.getElementById('wukong-forge-style')?.remove();
  document.getElementById('wukong-forge-pet-overlay')?.remove();
  document.getElementById('wukong-forge-motif-overlay')?.remove();
  document.getElementById('wukong-forge-background')?.remove();
  document.querySelectorAll('[data-forge-mark]').forEach(element => {
    if (Object.hasOwn(element.dataset, 'forgeOriginalAriaLabel')) {
      const original = element.dataset.forgeOriginalAriaLabel;
      if (original === '__forge_absent__') element.removeAttribute('aria-label');
      else element.setAttribute('aria-label', original);
      delete element.dataset.forgeOriginalAriaLabel;
    }
    delete element.dataset.forgeTitleCopy;
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
