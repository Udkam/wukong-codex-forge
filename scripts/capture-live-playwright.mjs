import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';

const execFileAsync = promisify(execFile);

const parseArgs = argv => {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith('--') || value == null) throw Error(`Invalid argument near ${flag ?? '(end)'}`);
    values[flag.slice(2)] = value;
  }
  return values;
};

const values = parseArgs(process.argv.slice(2));
const port = Number(values.port);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Use --port PORT --output FILE.png');
if (!values.output) throw Error('Use --port PORT --output FILE.png');
const closeTransientDebug = values['close-debug-after-capture'] === 'true';
const debugRootPid = Number(values['debug-root-pid']);
const debugOwnerPid = Number(values['debug-owner-pid']);
const disableRequest = values['disable-request'] ? path.resolve(values['disable-request']) : '';
if (closeTransientDebug) {
  if (!Number.isInteger(debugRootPid) || debugRootPid <= 0) {
    throw Error('--close-debug-after-capture requires --debug-root-pid PID');
  }
  if (!Number.isInteger(debugOwnerPid) || debugOwnerPid <= 0 || debugOwnerPid === process.pid) {
    throw Error('--close-debug-after-capture requires the separate launcher PID in --debug-owner-pid');
  }
  if (
    !disableRequest ||
    path.basename(path.dirname(disableRequest)).toLowerCase() !== 'requests' ||
    !/^disable-[0-9a-f]{32}\.request$/i.test(path.basename(disableRequest))
  ) {
    throw Error('--close-debug-after-capture requires an owned disable-<session>.request path');
  }
  const requestParent = fs.lstatSync(path.dirname(disableRequest));
  if (!requestParent.isDirectory() || requestParent.isSymbolicLink()) {
    throw Error('Transient cleanup request parent must be a direct directory');
  }
  if (fs.existsSync(disableRequest)) {
    throw Error(`Refusing to overwrite or reuse a retained disable request: ${disableRequest}`);
  }
}
const output = path.resolve(values.output);
const reportPath = output.replace(/\.png$/i, '.json');
for (const retainedPath of [output, reportPath]) {
  if (fs.existsSync(retainedPath)) throw Error(`Refusing to overwrite retained evidence: ${retainedPath}`);
}
fs.mkdirSync(path.dirname(output), { recursive: true });

const processAlive = pid => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== 'ESRCH';
  }
};
const endpointAccepting = async endpointPort => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 450);
  try {
    const response = await fetch(`http://127.0.0.1:${endpointPort}/json/version`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
};
const waitUntil = async (predicate, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  do {
    if (await predicate()) return true;
    await new Promise(resolve => setTimeout(resolve, 250));
  } while (Date.now() < deadline);
  return false;
};
const terminateVerifiedDebugTree = async pid => {
  if (!processAlive(pid)) return false;
  if (process.platform === 'win32') {
    try {
      await execFileAsync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        timeout: 10000
      });
    } catch (error) {
      if (processAlive(pid)) {
        throw Error(
          `Verified transient debug tree did not terminate: ${String(error?.message || error)}`
        );
      }
    }
  } else {
    process.kill(pid, 'SIGTERM');
  }
  return true;
};

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
let page = null;
let report = null;
let nativeEnqueueProof = {
  requested: false,
  attempted: false,
  submissionShortcut: null,
  editorInitiallyEmpty: false,
  reusedExistingOwnedDraft: false,
  inputPrepared: false,
  inputCleared: false,
  queueObserved: false
};
let transientCleanupStarted = false;
let transientCleanupCompleted = false;

const persistReportOnce = payload => {
  if (fs.existsSync(reportPath)) return;
  fs.writeFileSync(
    reportPath,
    JSON.stringify(payload, null, 2) + '\n',
    { encoding: 'utf8', flag: 'wx' }
  );
};

const cleanupTransientDebug = async reason => {
  if (!closeTransientDebug || transientCleanupCompleted) return;
  if (transientCleanupStarted) {
    throw Error('Transient debug cleanup was already started but did not complete');
  }
  transientCleanupStarted = true;

  const browserSession = await browser.newBrowserCDPSession();
  const processInfo = await browserSession.send('SystemInfo.getProcessInfo');
  const browserProcess = processInfo.processInfo?.find(item => item.type === 'browser');
  if (Number(browserProcess?.id) !== debugRootPid) {
    throw Error(
      `Transient cleanup PID mismatch: CDP browser=${browserProcess?.id ?? 'unknown'}, requested=${debugRootPid}`
    );
  }
  if (!processAlive(debugOwnerPid)) {
    throw Error(`Transient cleanup launcher PID is not alive: ${debugOwnerPid}`);
  }
  fs.writeFileSync(
    disableRequest,
    `${JSON.stringify({
      requestedAt: new Date().toISOString(),
      reason,
      rootPid: debugRootPid,
      ownerPid: debugOwnerPid,
      port
    })}\n`,
    { encoding: 'utf8', flag: 'wx' }
  );

  let nativeRestoreObserved = false;
  if (page) {
    try {
      await page.waitForFunction(
        () => (
          !document.getElementById('wukong-forge-style') &&
          !window.__wukongCodexForgeRuntimeV13 &&
          !document.documentElement.classList.contains('forge-ink-mountain')
        ),
        null,
        { timeout: 15000 }
      );
      nativeRestoreObserved = true;
    } catch {
      // A renderer can disappear while the watcher is restoring it. The
      // append-only watcher confirmation below remains the authoritative
      // fallback for that failure edge.
    }
  }
  const confirmationPath = `${disableRequest}.confirmed.json`;
  const watcherConfirmed = await waitUntil(
    () => fs.existsSync(confirmationPath),
    15000
  );
  if (!nativeRestoreObserved && !watcherConfirmed) {
    throw Error('Transient debug watcher did not confirm native restoration');
  }

  try {
    await browserSession.send('Browser.close');
  } catch (error) {
    if (!/closed|disconnected|target/i.test(String(error?.message || error))) throw error;
  }
  let rootReleased = await waitUntil(() => !processAlive(debugRootPid), 20000);
  let verifiedTreeFallback = false;
  if (!rootReleased) {
    /*
     * Some Windows Electron builds close every renderer after Browser.close
     * but retain the verified portable browser root and its loopback
     * listener. The PID above was already matched against CDP and the
     * launcher-owned disable request, so a bounded exact-tree fallback is
     * safe and cannot target the user's normal Codex control window.
     */
    verifiedTreeFallback = await terminateVerifiedDebugTree(debugRootPid);
    rootReleased = await waitUntil(() => !processAlive(debugRootPid), 10000);
  }
  const ownerReleased = await waitUntil(() => !processAlive(debugOwnerPid), 20000);
  const portReleased = await waitUntil(async () => !(await endpointAccepting(port)), 10000);
  report ||= {};
  report.transientCleanup = {
    requested: true,
    reason,
    rootPid: debugRootPid,
    ownerPid: debugOwnerPid,
    port,
    nativeRestoreObserved,
    watcherConfirmed,
    verifiedTreeFallback,
    rootReleased,
    ownerReleased,
    portReleased
  };
  if (!rootReleased || !ownerReleased || !portReleased) {
    persistReportOnce(report);
    throw Error(`Transient debug cleanup was incomplete: ${JSON.stringify(report.transientCleanup)}`);
  }
  transientCleanupCompleted = true;
};

try {
  const pages = browser.contexts().flatMap(context => context.pages());
  page = pages.find(candidate => /^app:\/(?:\/codex\/|\/-\/index\.html)/.test(candidate.url()));
  if (!page) throw Error('No Codex app renderer page was found');
  await page.waitForFunction(
    () => {
      const nativeShell = document.querySelector([
        'aside.app-shell-left-panel',
        'aside[data-testid="app-shell-floating-left-panel"]',
        '[data-app-shell-main-content-layout]'
      ].join(','));
      const nativeSurface = document.querySelector([
        '.composer-surface-chrome',
        '[data-testid="home-icon"]',
        '[data-feature="game-source"]',
        '.heading-xl'
      ].join(','));
      return Boolean(nativeShell && nativeSurface);
    },
    null,
    { timeout: 30000 }
  );
  await page.waitForFunction(
    () => {
      const root = document.documentElement;
      const overlay = document.getElementById('wukong-forge-background');
      return Boolean(
        window.__wukongCodexForgeRuntimeV13 &&
        root.classList.contains('forge-ink-mountain') &&
        root.dataset.forgeBackgroundReady === 'true' &&
        overlay?.dataset.forgeReady === 'true'
      );
    },
    null,
    { timeout: 30000 }
  );
  await page.waitForTimeout(650);
  let transitionProof = null;
  let selectedTask = null;
  const taskSelectionProof = [];
  const nativeEnqueueMessage = String(values['enqueue-native-message'] || '').trim();
  nativeEnqueueProof = {
    requested: Boolean(nativeEnqueueMessage),
    attempted: false,
    submissionShortcut: nativeEnqueueMessage ? 'Enter' : null,
    editorInitiallyEmpty: false,
    reusedExistingOwnedDraft: false,
    editorFocused: false,
    inputPrepared: false,
    inputCleared: false,
    queueObserved: false
  };
  const captureTransition = async () => {
    if (values['sample-transition'] !== 'true') {
      await page.waitForTimeout(1800);
      return;
    }
    await page.waitForFunction(
      () => Boolean(window.__wukongCodexForgeRuntimeV13?.transitionInFlight),
      null,
      { timeout: 7000 }
    );
    await page.waitForTimeout(320);
    transitionProof = await page.evaluate(() => ({
      surface: document.documentElement.dataset.forgeSurface || null,
      mode: document.documentElement.dataset.forgeMode || null,
      scene: document.documentElement.dataset.forgeScene || null,
      inFlight: Boolean(window.__wukongCodexForgeRuntimeV13?.transitionInFlight),
      layers: [...document.querySelectorAll('[data-forge-background-layer]')].map(layer => ({
        index: layer.dataset.forgeBackgroundLayer || null,
        scene: layer.dataset.forgeScene || null,
        mode: layer.dataset.forgeMode || null,
        active: layer.dataset.forgeActive || null,
        opacity: Number.parseFloat(getComputedStyle(layer).opacity)
      }))
    }));
    await page.waitForFunction(
      () => !window.__wukongCodexForgeRuntimeV13?.transitionInFlight,
      null,
      { timeout: 7000 }
    );
  };
  const dismissFullAccessWarning = async () => {
    if (values['dismiss-full-access-warning'] !== 'true') return false;
    const dismiss = page.getByRole('button', {
      name: /^(?:Don['’]t show again|不再显示)$/i
    }).first();
    if (!await dismiss.isVisible().catch(() => false)) return false;
    await dismiss.click();
    await dismiss.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    return true;
  };
  const waitForRequestedTaskState = async () => {
    const requireQueueGoal = values['require-queue-goal'] === 'true';
    const requireSurface = values['require-surface'] || '';
    if (!requireQueueGoal && !requireSurface) return;
    await page.waitForFunction(
      ({ expectedSurface, queueGoal }) => {
        const root = document.documentElement;
        const surfaceReady = !expectedSurface || root.dataset.forgeSurface === expectedSurface;
        if (!surfaceReady) return false;
        if (!queueGoal) return true;
        return Boolean(
          root.dataset.forgeSurface === 'thread' &&
          root.dataset.forgeMode === 'scenery' &&
          document.querySelector('.forge-composer-panel-stack') &&
          document.querySelectorAll('.forge-composer-panel').length >= 2 &&
          document.querySelectorAll('.forge-composer-queue-item').length >= 1
        );
      },
      {
        expectedSurface: requireSurface,
        queueGoal: requireQueueGoal
      },
      { timeout: Number(values['task-state-timeout-ms'] || 12000) }
    );
  };
  const waitForSelectedTask = async label => {
    await page.waitForFunction(
      expectedLabel => {
        const normalize = value => String(value || '').replace(/\s+/g, ' ').trim();
        const expected = normalize(expectedLabel);
        const ownsExpectedLabel = element => normalize(element?.textContent) === expected;
        const themedCurrent = [...document.querySelectorAll('.forge-sidebar-selected')]
          .some(ownsExpectedLabel);
        if (themedCurrent) return true;
        return [...document.querySelectorAll([
          '[aria-current="page"]',
          '[aria-selected="true"]',
          '[data-state="active"]'
        ].join(','))].some(ownsExpectedLabel);
      },
      label,
      { timeout: Number(values['task-state-timeout-ms'] || 12000) }
    );
  };
  const enqueueNativeFollowUp = async () => {
    if (!nativeEnqueueMessage || nativeEnqueueProof.attempted) return;
    const surfaces = page.locator('.composer-surface-chrome');
    let editor = null;
    for (let index = 0; index < await surfaces.count(); index += 1) {
      const surface = surfaces.nth(index);
      if (!await surface.isVisible().catch(() => false)) continue;
      const candidate = surface.locator([
        '[contenteditable="true"][role="textbox"]',
        '.ProseMirror[contenteditable="true"]',
        '[contenteditable="true"]'
      ].join(', ')).first();
      if (await candidate.isVisible().catch(() => false)) {
        editor = candidate;
        break;
      }
    }
    if (!editor) throw Error('Selected task has no visible editable native composer');

    const readEditorText = async () => String(
      await editor.innerText().catch(() => editor.textContent().catch(() => ''))
    ).replace(/\s+/g, ' ').trim();
    const existingEditorText = await readEditorText();
    nativeEnqueueProof.editorInitiallyEmpty = existingEditorText === '';
    nativeEnqueueProof.reusedExistingOwnedDraft = (
      !nativeEnqueueProof.editorInitiallyEmpty &&
      existingEditorText === nativeEnqueueMessage
    );
    if (
      !nativeEnqueueProof.editorInitiallyEmpty &&
      !nativeEnqueueProof.reusedExistingOwnedDraft
    ) {
      throw Error('Refusing to overwrite an existing native composer draft');
    }

    nativeEnqueueProof.attempted = true;
    await editor.focus();
    nativeEnqueueProof.editorFocused = await editor.evaluate(element => (
      element === document.activeElement || element.contains(document.activeElement)
    ));
    if (!nativeEnqueueProof.editorFocused) {
      throw Error('Native composer editor did not receive focus');
    }
    if (nativeEnqueueProof.editorInitiallyEmpty) {
      // ProseMirror owns its document state. Keyboard insertion exercises its
      // native beforeinput/input path; DOM-oriented fill() can paint text without
      // proving that the controller accepted it as a submit-ready prompt.
      await page.keyboard.insertText(nativeEnqueueMessage);
      nativeEnqueueProof.inputPrepared = await waitUntil(
        async () => await readEditorText() === nativeEnqueueMessage,
        5000
      );
    } else {
      // A failed acceptance run can leave its own exact placeholder in the
      // isolated profile. Reuse only a byte-for-byte match with this run's
      // requested message; any other draft remains protected and fails closed.
      nativeEnqueueProof.inputPrepared = true;
    }
    if (!nativeEnqueueProof.inputPrepared) {
      throw Error('Native composer controller did not accept the follow-up message');
    }
    // The isolated acceptance profile has no composerEnterBehavior override,
    // so the native default (`enter`) applies. In that mode plain Enter is the
    // default follow-up submit action; Ctrl+Enter is intercepted as the one-shot
    // opposite action and can steer instead of queueing.
    await editor.press('Enter');
    nativeEnqueueProof.inputCleared = await waitUntil(async () => {
      if (!await editor.isVisible().catch(() => false)) return true;
      return String(await editor.textContent().catch(() => '')).trim() === '';
    }, 5000);
    if (!nativeEnqueueProof.inputCleared) {
      throw Error('Native composer did not accept the follow-up message');
    }
    nativeEnqueueProof.queueObserved = await waitUntil(async () => (
      await page.locator('.forge-composer-queue-item').count() >= 1
    ), 5000);
  };
  const verifySelectedTaskState = async label => {
    await waitForSelectedTask(label);
    await enqueueNativeFollowUp();
    await waitForRequestedTaskState();
    await waitForSelectedTask(label);
  };
  const openTaskCandidate = async label => {
    const task = page
      .locator('aside.app-shell-left-panel')
      .getByText(label, { exact: true })
      .first();
    if (!await task.isVisible().catch(() => false)) {
      taskSelectionProof.push({ label, visible: false, ready: false });
      return false;
    }
    await task.evaluate(element => (
      element.closest('button, a, [role="button"], [role="treeitem"]') || element
    ).click());
    await dismissFullAccessWarning();
    try {
      await verifySelectedTaskState(label);
      taskSelectionProof.push({ label, visible: true, ready: true });
      selectedTask = label;
      return true;
    } catch (error) {
      taskSelectionProof.push({
        label,
        visible: true,
        ready: false,
        error: String(error?.name || 'Error')
      });
      return false;
    }
  };
  const taskCandidates = String(values['open-task-candidates'] || '')
    .split('|')
    .map(value => value.trim())
    .filter(Boolean);
  if (taskCandidates.length > 0) {
    for (const candidate of taskCandidates) {
      if (await openTaskCandidate(candidate)) break;
    }
    if (!selectedTask) {
      throw Error(`No task candidate reached the requested native state: ${JSON.stringify(taskSelectionProof)}`);
    }
    await captureTransition();
  } else if (values['open-task']) {
    const opened = await openTaskCandidate(values['open-task']);
    if (!opened) throw Error(`Task did not reach the requested native state: ${values['open-task']}`);
    await captureTransition();
  } else if (values['open-new-task'] === 'true') {
    const newTask = page.getByText(/^(新建任务|新建对话|New task|New chat)$/).first();
    await newTask.waitFor({ state: 'visible', timeout: 15000 });
    await newTask.evaluate(element => (
      element.closest('button, a, [role="button"], [role="treeitem"]') || element
    ).click());
    await captureTransition();
  }
  if (selectedTask) await verifySelectedTaskState(selectedTask);
  if (values['scroll-thread-top'] === 'true') {
    await page.evaluate(() => {
      const seed = document.querySelector(
        '[data-thread-find-target="conversation"], [data-virtualized-turn-content], [data-content-search-turn-key]'
      );
      let current = seed;
      while (current) {
        if (current.scrollHeight > current.clientHeight + 20) current.scrollTop = 0;
        current = current.parentElement;
      }
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    });
    await page.waitForTimeout(1400);
  }
  report = await page.evaluate(() => {
    const rect = element => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const styleState = element => {
      if (!element) return null;
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        filter: style.filter,
        overflow: style.overflow,
        position: style.position
      };
    };
    const composerSurface = document.querySelector('.composer-surface-chrome');
    const composer = document.querySelector('.forge-composer') || composerSurface;
    const composerEditorCandidates = composerSurface
      ? [...composerSurface.querySelectorAll([
          '.ProseMirror',
          '[role="textbox"]',
          '[contenteditable]',
          'textarea',
          '[data-placeholder]'
        ].join(', '))]
      : [];
    const composerEditor = composerEditorCandidates[0] || null;
    const composerAncestorChain = [];
    for (
      let element = composerSurface;
      element && element !== document.body && composerAncestorChain.length < 10;
      element = element.parentElement
    ) {
      const box = element.getBoundingClientRect();
      const computed = getComputedStyle(element);
      const before = getComputedStyle(element, '::before');
      const after = getComputedStyle(element, '::after');
      composerAncestorChain.push({
        tag: element.tagName,
        id: element.id || null,
        className: String(element.className || '').slice(0, 500),
        forgeMarks: [...element.classList].filter(token => token.startsWith('forge-')),
        attributes: {
          codexComposerRoot: element.getAttribute('data-codex-composer-root'),
          threadFindComposer: element.getAttribute('data-thread-find-composer'),
          aboveComposerPortal: element.getAttribute('data-above-composer-portal'),
          utilityScrollArea: element.getAttribute('data-composer-utility-bar-scroll-area')
        },
        rect: { x: box.x, y: box.y, width: box.width, height: box.height },
        directChildCount: element.children.length,
        paint: {
          backgroundColor: computed.backgroundColor,
          backgroundImage: computed.backgroundImage,
          borderColor: computed.borderColor,
          borderRadius: computed.borderRadius,
          boxShadow: computed.boxShadow,
          backdropFilter: computed.backdropFilter,
          filter: computed.filter,
          overflow: computed.overflow,
          before: {
            content: before.content,
            backgroundColor: before.backgroundColor,
            backgroundImage: before.backgroundImage,
            boxShadow: before.boxShadow
          },
          after: {
            content: after.content,
            backgroundColor: after.backgroundColor,
            backgroundImage: after.backgroundImage,
            boxShadow: after.boxShadow
          }
        }
      });
    }
    const assistant = document.querySelector('.forge-assistant-turn, [data-local-conversation-final-assistant]');
    const workspace = document.querySelector('.forge-workspace, main');
    const rightCard = document.querySelector('.forge-right-card') || document.querySelector('[data-pip-obstacle="thread-summary-panel"]');
    const petState = name => {
      const element = document.querySelector(`[data-forge-pet="${name}"]`);
      return element ? {
        hidden: element.hidden,
        placement: element.dataset.forgePlacement || null,
        rect: rect(element),
        pointerEvents: getComputedStyle(element).pointerEvents
      } : null;
    };
    const overlay = document.getElementById('wukong-forge-background');
    const backgroundLayers = [...(overlay?.querySelectorAll(':scope > [data-forge-background-layer]') || [])];
    const activeBackgroundLayer = backgroundLayers.find(layer => layer.dataset.forgeActive === 'true') || null;
    const activeBackgroundImage = activeBackgroundLayer?.querySelector('[data-forge-background-image]') || null;
    return {
      url: location.href,
      title: document.title,
      viewport: { width: innerWidth, height: innerHeight, scale: devicePixelRatio },
      theme: {
        active: document.documentElement.classList.contains('forge-ink-mountain'),
        runtimeV9: Boolean(window.__wukongCodexForgeRuntimeV9),
        runtimeV10: Boolean(window.__wukongCodexForgeRuntimeV10),
        runtimeV11: Boolean(window.__wukongCodexForgeRuntimeV11),
        runtimeV12: Boolean(window.__wukongCodexForgeRuntimeV12),
        runtimeV13: Boolean(window.__wukongCodexForgeRuntimeV13),
        mode: document.documentElement.dataset.forgeMode || null,
        scene: document.documentElement.dataset.forgeScene || null,
        surface: document.documentElement.dataset.forgeSurface || null,
        styleLength: document.getElementById('wukong-forge-style')?.textContent?.length || 0,
        refreshCount: window.__wukongCodexForgeRuntimeV13?.refreshCount || 0,
        renderCount: window.__wukongCodexForgeRuntimeV13?.renderCount || 0,
        transitionInFlight: Boolean(window.__wukongCodexForgeRuntimeV13?.transitionInFlight)
      },
      geometry: {
        sidebar: rect(document.querySelector('.forge-sidebar, aside.app-shell-left-panel')),
        workspace: rect(workspace),
        composer: rect(composer),
        rightCard: rect(rightCard)
      },
      pets: {
        wukong: petState('little-wukong'),
        bajie: petState('little-bajie'),
        xiangfeiGourd: petState('xiangfei-gourd')
      },
      styles: {
        composer: styleState(composer),
        assistant: styleState(assistant),
        workspace: styleState(workspace),
        rightCard: styleState(rightCard),
        background: {
          present: Boolean(overlay),
          inert: Boolean(overlay?.inert),
          ariaHidden: overlay?.getAttribute('aria-hidden') || null,
          pointerEvents: overlay ? getComputedStyle(overlay).pointerEvents : null,
          layerCount: backgroundLayers.length,
          activeLayer: overlay?.dataset.forgeActiveLayer || null,
          activeScene: activeBackgroundLayer?.dataset.forgeScene || null,
          activeMode: activeBackgroundLayer?.dataset.forgeMode || null,
          activeImagePresent: Boolean(
            activeBackgroundImage?.style.backgroundImage &&
            activeBackgroundImage.style.backgroundImage !== 'none'
          ),
          backgroundSize: activeBackgroundImage ? getComputedStyle(activeBackgroundImage).backgroundSize : null,
          backgroundPosition: activeBackgroundImage ? getComputedStyle(activeBackgroundImage).backgroundPosition : null
        }
      },
      composerChildren: composer
        ? [...composer.children].map(child => ({ tag: child.tagName, className: String(child.className || ''), role: child.getAttribute('role') }))
        : [],
      composerTopology: {
        surfacePresent: Boolean(composerSurface),
        editorPresent: Boolean(composerEditor),
        surfaceMarked: Boolean(composerSurface?.classList.contains('forge-composer-frame')),
        editorCandidates: composerEditorCandidates.slice(0, 12).map(element => ({
          tag: element.tagName,
          className: String(element.className || '').slice(0, 500),
          role: element.getAttribute('role'),
          contenteditable: element.getAttribute('contenteditable'),
          ariaReadonly: element.getAttribute('aria-readonly'),
          dataPlaceholder: element.getAttribute('data-placeholder'),
          forgeMarks: [...element.classList].filter(token => token.startsWith('forge-'))
        })),
        ancestorChain: composerAncestorChain
      },
      markedElements: document.querySelectorAll('[class*="forge-"]').length
    };
  });
  report.transitionProof = transitionProof;
  report.taskSelectionProof = taskSelectionProof;
  report.selectedTask = selectedTask;
  report.nativeEnqueueProof = nativeEnqueueProof;
  if (selectedTask) await verifySelectedTaskState(selectedTask);
  await page.screenshot({ path: output, type: 'png' });

  if (closeTransientDebug) {
    await cleanupTransientDebug('capture-complete');
  } else {
    report.transientCleanup = { requested: false };
  }

  persistReportOnce(report);
  console.log(JSON.stringify({ output, reportPath, report }));
} catch (error) {
  if (closeTransientDebug) {
    report ||= {};
    report.nativeEnqueueProof = nativeEnqueueProof;
    report.captureError = {
      name: String(error?.name || 'Error'),
      message: String(error?.message || error)
    };
    let cleanupError = null;
    if (!transientCleanupStarted) {
      try {
        await cleanupTransientDebug('capture-failed');
      } catch (caughtCleanupError) {
        cleanupError = caughtCleanupError;
      }
    }
    persistReportOnce(report);
    if (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `Capture failed and transient cleanup also failed: ${cleanupError.message}`
      );
    }
  }
  throw error;
} finally {
  await browser.close().catch(() => {});
}
