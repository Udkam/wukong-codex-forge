import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';

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

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
try {
  const pages = browser.contexts().flatMap(context => context.pages());
  const page = pages.find(candidate => /^app:\/(?:\/codex\/|\/-\/index\.html)/.test(candidate.url()));
  if (!page) throw Error('No Codex app renderer page was found');
  let transitionProof = null;
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
  if (values['open-task']) {
    const task = page.getByText(values['open-task'], { exact: true }).first();
    await task.waitFor({ state: 'visible', timeout: 15000 });
    await task.evaluate(element => (
      element.closest('button, a, [role="button"], [role="treeitem"]') || element
    ).click());
    await captureTransition();
  } else if (values['open-new-task'] === 'true') {
    const newTask = page.getByText(/^(新建任务|新建对话|New task|New chat)$/).first();
    await newTask.waitFor({ state: 'visible', timeout: 15000 });
    await newTask.evaluate(element => (
      element.closest('button, a, [role="button"], [role="treeitem"]') || element
    ).click());
    await captureTransition();
  }
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
  const report = await page.evaluate(() => {
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
    const composer = document.querySelector('.forge-composer, .composer-surface-chrome');
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
      markedElements: document.querySelectorAll('[class*="forge-"]').length
    };
  });
  report.transitionProof = transitionProof;
  await page.screenshot({ path: output, type: 'png' });

  if (closeTransientDebug) {
    /*
     * This opt-in path is only for a launcher-owned disposable review session.
     * It verifies the CDP browser PID before creating the append-only disable
     * request, waits for the watcher to restore native DOM, then closes that
     * exact browser and proves root/launcher/port release. The normal capture
     * path never closes a browser, so it cannot terminate the control window.
     */
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
        reason: 'capture-complete',
        rootPid: debugRootPid,
        ownerPid: debugOwnerPid,
        port
      })}\n`,
      { encoding: 'utf8', flag: 'wx' }
    );
    await page.waitForFunction(
      () => (
        !document.getElementById('wukong-forge-style') &&
        !window.__wukongCodexForgeRuntimeV13 &&
        !document.documentElement.classList.contains('forge-ink-mountain')
      ),
      null,
      { timeout: 15000 }
    );
    try {
      await browserSession.send('Browser.close');
    } catch (error) {
      if (!/closed|disconnected|target/i.test(String(error?.message || error))) throw error;
    }
    const rootReleased = await waitUntil(() => !processAlive(debugRootPid), 20000);
    const ownerReleased = await waitUntil(() => !processAlive(debugOwnerPid), 20000);
    const portReleased = await waitUntil(async () => !(await endpointAccepting(port)), 10000);
    report.transientCleanup = {
      requested: true,
      rootPid: debugRootPid,
      ownerPid: debugOwnerPid,
      port,
      rootReleased,
      ownerReleased,
      portReleased
    };
    if (!rootReleased || !ownerReleased || !portReleased) {
      throw Error(`Transient debug cleanup was incomplete: ${JSON.stringify(report.transientCleanup)}`);
    }
  } else {
    report.transientCleanup = { requested: false };
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  console.log(JSON.stringify({ output, reportPath, report }));
} finally {
  await browser.close().catch(() => {});
}
