import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import {
  makeApplyExpression,
  RESTORE_EXPRESSION
} from '../runtime/injection-plan-v13.mjs';
import {
  nativeUiBaseline,
  runtimeFixtureHtml
} from './runtime-fixture.mjs';

const styleSheet = fs.readFileSync(
  new URL('../runtime/forge-background-v13.css', import.meta.url),
  'utf8'
);

const texture = color => (
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='16'` +
  `%3E%3Crect width='32' height='16' fill='%23${color}'/%3E%3C/svg%3E")`
);

const variables = [
  ':root.forge-ink-mountain{',
  '--forge-scene-count:1;',
  '--forge-battle-scenes:0;',
  '--forge-battle-primary-scenes:0;',
  '--forge-battle-secondary-scenes:0;',
  '--forge-scenery-scenes:0;',
  `--forge-bg-0:${texture('1b1711')};`,
  '--forge-position-0:center;',
  `--forge-ui-composer-main:${texture('bfa884')};`,
  `--forge-ui-composer-strip:${texture('bca47f')};`,
  `--forge-ui-composer-pill:${texture('c2aa83')};`,
  `--forge-ui-paper-tile:${texture('bfa884')};`,
  `--forge-ui-sidebar-level1:${texture('211f1d')};`,
  `--forge-ui-sidebar-selected:${texture('c9bfb4')};`,
  `--forge-ui-sidebar-level2-hover:${texture('151314')};`,
  '}',
  ':root.forge-ink-mountain[data-forge-scene="0"]{',
  '--forge-scene-brightness:1;',
  '--forge-scene-veil:linear-gradient(rgba(12,14,13,.3),rgba(12,14,13,.3));',
  '}'
].join('');

const expression = makeApplyExpression({ styleSheet, variables });

const selectors = {
  composer: '.composer-surface-chrome',
  editor: '.ProseMirror[role="textbox"]',
  add: '[data-native-slot="composer-add"]',
  access: '[data-native-slot="composer-access"]',
  model: '[data-native-slot="composer-model"]',
  voice: '[data-native-slot="composer-voice"]',
  send: '.composer-footer .send',
  newTask: '[data-native-slot="new-task"]',
  menuFile: '[data-native-slot="menu-file"]',
  menuEdit: '[data-native-slot="menu-edit"]',
  menuView: '[data-native-slot="menu-view"]',
  menuHelp: '[data-native-slot="menu-help"]',
  rootThread: '[data-app-action-sidebar-section-heading="Tasks"] [data-app-action-sidebar-thread-row]',
  project: '[data-app-action-sidebar-project-row]',
  childThread: '[data-native-slot="project-active"]'
};

const hitSelectors = [
  selectors.add,
  selectors.access,
  selectors.model,
  selectors.voice,
  selectors.send,
  selectors.newTask,
  selectors.menuFile,
  selectors.menuEdit,
  selectors.menuView,
  selectors.menuHelp,
  selectors.rootThread,
  selectors.project,
  selectors.childThread
];

const snapshot = page => page.evaluate(targets => {
  const read = selector => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`missing fixture selector: ${selector}`);
    const rect = element.getBoundingClientRect();
    return {
      rect: [rect.x, rect.y, rect.width, rect.height],
      text: element.textContent,
      ariaLabel: element.getAttribute('aria-label'),
      ariaCurrent: element.getAttribute('aria-current'),
      ariaSelected: element.getAttribute('aria-selected'),
      ariaExpanded: element.getAttribute('aria-expanded'),
      ariaHaspopup: element.getAttribute('aria-haspopup'),
      role: element.getAttribute('role'),
      type: element.getAttribute('type'),
      tabIndex: element.tabIndex,
      disabled: 'disabled' in element ? element.disabled : null,
      contentEditable: element.getAttribute('contenteditable'),
      placeholder: element.getAttribute('data-placeholder')
    };
  };
  return Object.fromEntries(
    Object.entries(targets).map(([name, selector]) => [name, read(selector)])
  );
}, selectors);

const assertRectsEqual = (actual, expected, tolerance = 0.25) => {
  for (const [name, before] of Object.entries(expected)) {
    assert.ok(actual[name], `missing geometry for ${name}`);
    actual[name].rect.forEach((value, index) => {
      assert.ok(
        Math.abs(value - before.rect[index]) <= tolerance,
        `${name} rect[${index}] changed from ${before.rect[index]} to ${value}`
      );
    });
    assert.deepEqual(
      { ...actual[name], rect: undefined },
      { ...before, rect: undefined },
      `${name} native semantics changed`
    );
  }
};

const nativeHitPattern = (page, selector) => page.evaluate(target => {
  const element = document.querySelector(target);
  const rect = element.getBoundingClientRect();
  const edgeInset = Math.min(.75, rect.width / 5, rect.height / 5);
  const points = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + edgeInset, rect.top + edgeInset],
    [rect.right - edgeInset, rect.top + edgeInset],
    [rect.left + edgeInset, rect.bottom - edgeInset],
    [rect.right - edgeInset, rect.bottom - edgeInset],
    [rect.left + rect.width / 2, rect.top + edgeInset],
    [rect.left + rect.width / 2, rect.bottom - edgeInset],
    [rect.left + edgeInset, rect.top + rect.height / 2],
    [rect.right - edgeInset, rect.top + rect.height / 2]
  ];
  return points.map(([x, y]) => {
    const hit = document.elementFromPoint(x, y);
    return hit === element || element.contains(hit);
  });
}, selector);

const installAdjacentComposerStates = page => page.evaluate(() => {
  const root = document.querySelector('[data-codex-composer-root]');
  const context = document.createElement('div');
  context.dataset.fixtureSurface = 'composer-context';
  context.style.cssText =
    'pointer-events:auto;display:flex;width:100%;height:var(--spacing-token-button-composer);' +
    'align-items:center;gap:var(--spacing-token-button-composer-gap);margin-bottom:8px';
  context.innerHTML = `
    <button data-composer-navigation-target="workspace-project">wukong-codex-forge</button>
    <button data-composer-navigation-target="environment">本地</button>
    <button data-composer-navigation-target="branch">main</button>`;

  const stack = document.createElement('div');
  stack.className = 'order-2 flex min-w-0 flex-col';
  stack.dataset.fixtureSurface = 'composer-stack';
  stack.style.cssText = 'pointer-events:auto;display:flex;width:100%;margin-bottom:8px';
  stack.innerHTML = `
    <div class="relative min-w-0 overflow-clip" data-fixture-surface="composer-panel"
      style="display:flex;width:100%;height:var(--height-token-row);align-items:center;gap:8px">
      <button data-fixture-control="plan"
        style="display:block;height:var(--spacing-token-button-composer)">第 1 / 5 步 · 10 个文件已更改</button>
      <button data-fixture-control="diff"
        style="display:block;height:var(--spacing-token-button-composer)">10 个文件已更改</button>
    </div>`;
  root.prepend(stack);
  root.prepend(context);
});

let browser;

test.before(async () => {
  browser = await chromium.launch({ headless: true });
});

test.after(async () => {
  await browser?.close();
});

test('V15 maps reference materials without changing native geometry, semantics, or hit boxes', async () => {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v14.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v14.test/');

  const before = await snapshot(page);
  const beforeHits = Object.fromEntries(await Promise.all(
    hitSelectors.map(async selector => [selector, await nativeHitPattern(page, selector)])
  ));
  await page.evaluate(() => {
    window.__forgeClicks = {
      add: 0,
      send: 0,
      newTask: 0,
      menuFile: 0,
      menuEdit: 0,
      menuView: 0,
      menuHelp: 0
    };
    document.querySelector('[data-native-slot="composer-add"]')
      .addEventListener('click', () => { window.__forgeClicks.add += 1; });
    document.querySelector('.composer-footer .send')
      .addEventListener('click', event => {
        event.preventDefault();
        window.__forgeClicks.send += 1;
      });
    document.querySelector('[data-native-slot="new-task"]')
      .addEventListener('click', () => { window.__forgeClicks.newTask += 1; });
    document.querySelector('[data-native-slot="menu-file"]')
      .addEventListener('click', () => { window.__forgeClicks.menuFile += 1; });
    document.querySelector('[data-native-slot="menu-edit"]')
      .addEventListener('click', () => { window.__forgeClicks.menuEdit += 1; });
    document.querySelector('[data-native-slot="menu-view"]')
      .addEventListener('click', () => { window.__forgeClicks.menuView += 1; });
    document.querySelector('[data-native-slot="menu-help"]')
      .addEventListener('click', () => { window.__forgeClicks.menuHelp += 1; });
  });

  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelector('.composer-surface-chrome')?.classList.contains('forge-composer-frame') &&
    document.querySelector('[data-native-slot="project-active"]')
      ?.classList.contains('forge-sidebar-selected')
  ));

  const after = await snapshot(page);
  assertRectsEqual(after, before);
  assert.equal(await page.locator('.forge-composer-frame').count(), 1);
  assert.equal(await page.locator('.forge-topbar-menu-item').count(), 4);
  assert.equal(
    await page.locator(
      '[class~="group/application-menu-top-bar"] button' +
      '[aria-haspopup="menu"][aria-expanded].forge-topbar-menu-item'
    ).count(),
    4,
    'all four native ASAR application-menu buttons must be mapped structurally'
  );
  assert.equal(await page.locator('.forge-sidebar-shell').count(), 1);
  assert.equal(await page.locator('.forge-sidebar-action').count(), 5);
  assert.equal(await page.locator('.forge-sidebar-level1').count(), 5);
  assert.equal(await page.locator('.forge-sidebar-level2').count(), 2);
  assert.equal(await page.locator('.forge-sidebar-selected').count(), 1);
  assert.equal(
    await page.locator('[data-app-action-sidebar-project-row].forge-sidebar-selected').count(),
    0,
    'project containers must never receive the pale selected material'
  );
  assert.equal(
    await page.locator('[data-app-action-sidebar-project-row].forge-sidebar-level1').count(),
    3,
    'production project rows must map to level one'
  );
  assert.equal(
    await page.locator(
      '[data-app-action-sidebar-section-heading="Tasks"] ' +
      '[data-app-action-sidebar-thread-row].forge-sidebar-level1'
    ).count(),
    2,
    'unprojected Tasks threads must map to level one'
  );
  assert.equal(
    await page.locator(
      '[data-app-action-sidebar-project-list-id] ' +
      '[data-app-action-sidebar-thread-row].forge-sidebar-level2'
    ).count(),
    2,
    'threads under a production project list must map to level two'
  );
  assert.equal(
    await page.locator(
      '[data-app-action-sidebar-project-row][aria-expanded="true"].forge-sidebar-level1'
    ).count(),
    2,
    'expanded production projects must retain level-one mapping'
  );
  assert.equal(
    await page.locator(
      '[data-app-action-sidebar-project-row]' +
      '[data-app-action-sidebar-project-collapsed="true"]' +
      '[aria-expanded="false"].forge-sidebar-level1'
    ).count(),
    1,
    'collapsed production projects must retain level-one mapping'
  );
  assert.equal(
    await page.locator(
      '[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-active="true"]' +
      '.forge-sidebar-selected'
    ).count(),
    1,
    'production active-thread state must receive the selected material'
  );
  assert.equal(
    await page.locator(
      '[data-root-thread-row], [data-project-row], ' +
      '[data-sidebar-project-row], [data-sidebar-thread-row]'
    ).count(),
    0,
    'the fixture must not depend on superseded fake sidebar attributes'
  );
  assert.equal(
    await page.locator('[data-native-slot="new-task"].forge-sidebar-action').count(),
    1,
    'top native navigation must receive its own themed action-row mapping'
  );
  assert.equal(
    await page.locator(
      '.sidebar-row[aria-expanded="false"].forge-sidebar-action'
    ).count(),
    1,
    'a generic expanded-state top navigation button must not be mistaken for a project'
  );

  const paint = await page.evaluate(() => ({
    composer: getComputedStyle(document.querySelector('.forge-composer-frame')).backgroundImage,
    menu: getComputedStyle(document.querySelector('.forge-topbar-menu-item')).backgroundImage,
    action: getComputedStyle(document.querySelector('.forge-sidebar-action')).backgroundImage,
    level1: getComputedStyle(document.querySelector('.forge-sidebar-level1')).backgroundImage,
    selected: getComputedStyle(document.querySelector('.forge-sidebar-selected')).backgroundImage,
    level2: getComputedStyle(
      document.querySelector('.forge-sidebar-level2:not(.forge-sidebar-selected)')
    ).backgroundImage
  }));
  assert.match(paint.composer, /data:image\/svg\+xml/);
  assert.match(paint.menu, /data:image\/svg\+xml/);
  assert.match(paint.action, /data:image\/svg\+xml/);
  assert.match(paint.level1, /data:image\/svg\+xml/);
  assert.match(paint.selected, /data:image\/svg\+xml/);
  assert.match(paint.level2, /linear-gradient/);

  for (const selector of hitSelectors) {
    assert.deepEqual(
      await nativeHitPattern(page, selector),
      beforeHits[selector],
      `nine-point native hit region changed for ${selector}`
    );
  }

  const menuFile = page.locator(selectors.menuFile);
  const menuEdit = page.locator(selectors.menuEdit);
  const menuView = page.locator(selectors.menuView);
  const menuDefaultImage = await menuFile.evaluate(
    element => getComputedStyle(element).backgroundImage
  );
  await menuFile.hover();
  const menuHover = await menuFile.evaluate(element => ({
    image: getComputedStyle(element).backgroundImage,
    color: getComputedStyle(element).color
  }));
  assert.notEqual(menuHover.image, menuDefaultImage);
  await page.mouse.move(800, 450);
  await menuEdit.focus();
  assert.equal(await menuEdit.evaluate(element => element.matches(':focus-visible')), true);
  assert.notEqual(
    await menuEdit.evaluate(element => getComputedStyle(element).backgroundImage),
    menuDefaultImage
  );
  await menuView.evaluate(element => element.setAttribute('aria-expanded', 'true'));
  assert.notEqual(
    await menuView.evaluate(element => getComputedStyle(element).backgroundImage),
    menuDefaultImage,
    'open menu paint must react directly to aria-expanded without runtime refresh'
  );
  await menuView.evaluate(element => element.setAttribute('aria-expanded', 'false'));

  await page.locator(selectors.add).click();
  await page.locator(selectors.send).click();
  await page.locator(selectors.newTask).click();
  await page.locator(selectors.menuFile).click();
  await page.locator(selectors.menuEdit).click();
  await page.locator(selectors.menuView).click();
  await page.locator(selectors.menuHelp).click();
  assert.deepEqual(
    await page.evaluate(() => window.__forgeClicks),
    {
      add: 1,
      send: 1,
      newTask: 1,
      menuFile: 1,
      menuEdit: 1,
      menuView: 1,
      menuHelp: 1
    }
  );

  await page.evaluate(RESTORE_EXPRESSION);
  await page.waitForFunction(() => !document.querySelector('[data-forge-mark]'));
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  assert.equal(await page.locator('#wukong-forge-background').count(), 0);
  assertRectsEqual(await snapshot(page), before);
  await page.close();
});

test('V14 updates dynamic composer states and moves current-conversation material without a resize trigger', async () => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v14-state.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v14-state.test/');
  await installAdjacentComposerStates(page);

  const adjacentBefore = await page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('[data-fixture-surface], [data-fixture-control]')].map(element => {
      const rect = element.getBoundingClientRect();
      return [
        element.dataset.fixtureSurface || element.dataset.fixtureControl,
        [rect.x, rect.y, rect.width, rect.height]
      ];
    })
  ));

  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelector('[data-fixture-surface="composer-context"]')
      ?.classList.contains('forge-composer-context') &&
    document.querySelector('[data-fixture-control="plan"]')
      ?.classList.contains('forge-plan-pill') &&
    document.querySelector('[data-fixture-control="diff"]')
      ?.classList.contains('forge-diff-summary')
  ));

  assert.equal(await page.locator('.forge-composer-context').count(), 1);
  assert.equal(await page.locator('.forge-composer-panel').count(), 1);
  assert.equal(await page.locator('.forge-plan-pill').count(), 1);
  assert.equal(await page.locator('.forge-diff-summary').count(), 1);

  const adjacentAfter = await page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('[data-fixture-surface], [data-fixture-control]')].map(element => {
      const rect = element.getBoundingClientRect();
      return [
        element.dataset.fixtureSurface || element.dataset.fixtureControl,
        [rect.x, rect.y, rect.width, rect.height]
      ];
    })
  ));
  assert.deepEqual(adjacentAfter, adjacentBefore);

  await page.evaluate(() => {
    const active = document.querySelector('[data-native-slot="project-active"]');
    active.removeAttribute('aria-current');
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="project-active"]')
      ?.classList.contains('forge-sidebar-selected')
  ));

  await page.evaluate(() => {
    document.querySelector('[data-native-slot="project-active"]')
      .removeAttribute('data-app-action-sidebar-thread-active');
    document.querySelector(
      '[data-app-action-sidebar-section-heading="Tasks"] ' +
      '[data-app-action-sidebar-thread-row]'
    ).setAttribute('data-app-action-sidebar-thread-active', 'true');
  });
  await page.waitForFunction(() => (
    document.querySelector(
      '[data-app-action-sidebar-section-heading="Tasks"] ' +
      '[data-app-action-sidebar-thread-row]'
    )?.classList.contains('forge-sidebar-selected') &&
    !document.querySelector('[data-native-slot="project-active"]')
      ?.classList.contains('forge-sidebar-selected')
  ));

  await page.evaluate(() => {
    document.querySelector(
      '[data-app-action-sidebar-section-heading="Tasks"] ' +
      '[data-app-action-sidebar-thread-row]'
    ).removeAttribute('data-app-action-sidebar-thread-active');
    document.querySelector('[data-app-action-sidebar-project-row]')
      .setAttribute('aria-current', 'page');
  });
  await page.waitForFunction(() => (
    !document.querySelector(
      '[data-app-action-sidebar-section-heading="Tasks"] ' +
      '[data-app-action-sidebar-thread-row]'
    )?.classList.contains('forge-sidebar-selected')
  ));
  assert.equal(
    await page.locator('[data-app-action-sidebar-project-row].forge-sidebar-selected').count(),
    0
  );

  await page.evaluate(() => {
    document.querySelector('[data-app-action-sidebar-project-row]')
      .removeAttribute('aria-current');
    document.querySelector('[data-native-slot="new-task"]').setAttribute('aria-current', 'page');
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="new-task"]')
      ?.classList.contains('forge-sidebar-action-active')
  ));
  assert.equal(
    await page.locator('[data-native-slot="new-task"].forge-sidebar-selected').count(),
    0
  );

  const level2 = page.locator('[data-native-slot="project-temple-child"]');
  const defaultImage = await level2.evaluate(element => getComputedStyle(element).backgroundImage);
  assert.match(defaultImage, /linear-gradient/);
  await level2.hover();
  const hoverImage = await level2.evaluate(element => getComputedStyle(element).backgroundImage);
  assert.match(hoverImage, /data:image\/svg\+xml/);

  await page.evaluate(() => {
    const current = document.querySelector(
      '[class~="group/application-menu-top-bar"]'
    );
    const replacement = current.cloneNode(true);
    replacement.querySelector('[data-native-slot="menu-help"]').textContent = 'Aide';
    replacement.querySelectorAll('[data-forge-mark]').forEach(element => {
      element.removeAttribute('data-forge-mark');
      [...element.classList]
        .filter(className => className.startsWith('forge-'))
        .forEach(className => element.classList.remove(className));
    });
    current.replaceWith(replacement);
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="menu-help"]')?.textContent === 'Aide' &&
    document.querySelectorAll(
      '[class~="group/application-menu-top-bar"] ' +
      'button[aria-haspopup="menu"][aria-expanded].forge-topbar-menu-item'
    ).length === 4
  ));

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});

test('V14 selects the visible composer surface and ignores one-button context and external submits', async () => {
  const page = await browser.newPage({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v14-composer-edge.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v14-composer-edge.test/');

  await page.evaluate(() => {
    const root = document.querySelector('[data-thread-find-composer="true"]');
    const liveSurface = root.querySelector('.composer-surface-chrome');
    const staleSurface = liveSurface.cloneNode(true);
    staleSurface.dataset.nativeSlot = 'composer-stale-hidden';
    staleSurface.querySelectorAll('[data-native-slot]').forEach(element => {
      element.dataset.nativeSlot = `stale-${element.dataset.nativeSlot}`;
    });
    staleSurface.style.display = 'none';
    root.prepend(staleSurface);

    const oneButtonContext = document.createElement('div');
    oneButtonContext.dataset.fixtureSurface = 'single-navigation-target';
    oneButtonContext.innerHTML =
      '<button data-composer-navigation-target="only-one">只有一个导航项</button>';
    root.prepend(oneButtonContext);

    const externalSubmit = document.createElement('button');
    externalSubmit.type = 'submit';
    externalSubmit.dataset.fixtureControl = 'external-submit';
    externalSubmit.textContent = '外部提交';
    root.prepend(externalSubmit);

    document.querySelector('[data-native-slot="composer-access"]').disabled = true;
  });

  const accessBefore = await page.locator(selectors.access).evaluate(element => ({
    color: getComputedStyle(element).color,
    disabled: element.disabled
  }));
  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="composer"]')
      ?.classList.contains('forge-composer-frame')
  ));

  assert.equal(
    await page.locator('[data-native-slot="composer-stale-hidden"].forge-composer-frame').count(),
    0
  );
  assert.equal(
    await page.locator('[data-fixture-surface="single-navigation-target"].forge-composer-context')
      .count(),
    0,
    'a single navigation button must not paint its entire ancestor as a context strip'
  );
  assert.equal(
    await page.locator('[data-fixture-control="external-submit"].forge-composer-submit').count(),
    0,
    'submit-like controls outside the native composer surface must not be themed as send'
  );
  assert.deepEqual(
    await page.locator(selectors.access).evaluate(element => ({
      color: getComputedStyle(element).color,
      disabled: element.disabled
    })),
    accessBefore,
    'full-access orange and disabled semantics must survive composer theming'
  );

  await page.evaluate(() => {
    const oldSurface = document.querySelector('[data-native-slot="composer"]');
    const replacement = oldSurface.cloneNode(true);
    replacement.dataset.nativeSlot = 'composer-fresh-visible';
    replacement.querySelectorAll('[data-forge-mark]').forEach(element => {
      element.removeAttribute('data-forge-mark');
      [...element.classList]
        .filter(className => className.startsWith('forge-'))
        .forEach(className => element.classList.remove(className));
    });
    oldSurface.after(replacement);
    oldSurface.style.display = 'none';
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="composer-fresh-visible"]')
      ?.classList.contains('forge-composer-frame') &&
    !document.querySelector('[data-native-slot="composer"]')
      ?.classList.contains('forge-composer-frame')
  ));
  assert.equal(
    await page.locator(
      '[data-native-slot="composer-fresh-visible"] button[type="submit"].forge-composer-submit'
    ).count(),
    1
  );
  assert.equal(
    await page.locator('[data-fixture-control="external-submit"].forge-composer-submit').count(),
    0
  );

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});

test('V15 preserves native surface geometry across compact and wide window sizes', async () => {
  const page = await browser.newPage({
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v14-responsive.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));

  for (const width of [360, 400, 560, 736, 1600]) {
    await page.setViewportSize({ width, height: 820 });
    await page.goto(`http://wukong-v14-responsive.test/?width=${width}`);
    const before = await snapshot(page);
    await page.evaluate(expression);
    await page.waitForTimeout(700);
    assert.equal(
      await page.locator('.composer-surface-chrome.forge-composer-frame').count(),
      1,
      `composer mapping missing at ${width}px`
    );
    assert.equal(
      await page.locator('.forge-topbar-menu-item').count(),
      4,
      `top menu mapping missing at ${width}px`
    );
    assertRectsEqual(await snapshot(page), before);
    await page.evaluate(RESTORE_EXPRESSION);
    assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  }

  await page.close();
});

test('V14 re-maps a delayed React shell without resize or zoom assistance', async () => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v14-first-frame.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v14-first-frame.test/');
  await page.evaluate(() => {
    window.__forgeResizeEvents = 0;
    window.addEventListener('resize', () => { window.__forgeResizeEvents += 1; });
    window.__delayedAppWindow = document.querySelector('.app-window');
    window.__delayedAppWindow.remove();
  });

  await page.evaluate(expression);
  assert.equal(await page.locator('.forge-topbar-menu-item').count(), 0);
  assert.equal(await page.locator('.forge-composer-frame').count(), 0);
  await page.waitForTimeout(700);
  const insertedAt = await page.evaluate(() => {
    document.querySelector('#root').append(window.__delayedAppWindow);
    return performance.now();
  });
  await page.waitForFunction(() => (
    document.querySelectorAll('.forge-topbar-menu-item').length === 4 &&
    document.querySelector('.composer-surface-chrome')?.classList.contains('forge-composer-frame') &&
    document.querySelector('[data-native-slot="project-active"]')
      ?.classList.contains('forge-sidebar-selected')
  ), undefined, { timeout: 1800 });

  const markedAt = await page.evaluate(() => performance.now());
  assert.ok(
    markedAt - insertedAt < 900,
    `delayed shell was not mapped promptly (${markedAt - insertedAt}ms)`
  );
  assert.equal(
    await page.evaluate(() => window.__forgeResizeEvents),
    0,
    'first-frame recovery must not depend on a window resize or zoom change'
  );

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});

test('V15 yields all journal materials to Windows forced-colors mode', async () => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.emulateMedia({ forcedColors: 'active' });
  await page.route('http://wukong-v14-forced-colors.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v14-forced-colors.test/');
  const before = await snapshot(page);
  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelectorAll('.forge-topbar-menu-item').length === 4 &&
    document.querySelector('.forge-composer-frame')
  ));

  const forcedPaint = await page.evaluate(() => {
    const targets = [
      '.forge-composer-frame',
      '.forge-topbar-menu-item',
      '.forge-sidebar-action',
      '.forge-sidebar-level1',
      '.forge-sidebar-level2',
      '.forge-sidebar-selected'
    ];
    return targets.map(selector => {
      const style = getComputedStyle(document.querySelector(selector));
      return {
        selector,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        color: style.color
      };
    });
  });
  for (const paint of forcedPaint) {
    assert.equal(paint.backgroundImage, 'none', `${paint.selector} retained a bitmap`);
    assert.equal(paint.boxShadow, 'none', `${paint.selector} retained a decorative shadow`);
    assert.notEqual(paint.color, 'rgba(0, 0, 0, 0)', `${paint.selector} lost readable text`);
  }
  assertRectsEqual(await snapshot(page), before);

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});
