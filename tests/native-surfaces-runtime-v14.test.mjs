import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import {
  makeApplyExpression,
  RESTORE_EXPRESSION
} from '../runtime/injection-plan-v13.mjs';
import {
  installComposerState,
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

const composerGeometry = Object.freeze({
  aspectNumerator: 184,
  aspectDenominator: 25,
  minHeight: 96,
  maxHeight: 120
});

const expectedComposerHeight = width => Math.min(
  composerGeometry.maxHeight,
  Math.max(
    composerGeometry.minHeight,
    width * composerGeometry.aspectDenominator / composerGeometry.aspectNumerator
  )
);

const selectors = {
  composer: '.composer-surface-chrome',
  editor: '.ProseMirror[role="textbox"]',
  add: '[data-native-slot="composer-add"]',
  access: '[data-native-slot="composer-access"]',
  model: '[data-native-slot="composer-model"]',
  voice: '[data-native-slot="composer-voice"]',
  send: '.composer-footer .send',
  newTask: '[data-native-slot="new-task"]',
  newTaskRow: '[data-native-slot="new-task-row"]',
  newTaskMenu: '[data-native-slot="new-task-menu"]',
  pullRequests: '[data-native-slot="pull-requests"]',
  sites: '[data-native-slot="sites"]',
  scheduled: '[data-native-slot="scheduled"]',
  plugins: '[data-native-slot="plugins"]',
  projectInternalControl: '[data-native-slot="project-internal-control"]',
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
  selectors.newTaskMenu,
  selectors.pullRequests,
  selectors.sites,
  selectors.scheduled,
  selectors.plugins,
  selectors.projectInternalControl,
  selectors.menuFile,
  selectors.menuEdit,
  selectors.menuView,
  selectors.menuHelp,
  selectors.rootThread,
  selectors.project,
  selectors.childThread
];

const composerGeometryNames = new Set([
  'composer',
  'editor'
]);

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

const assertRectsEqual = (
  actual,
  expected,
  tolerance = 0.25,
  ignoredGeometry = new Set()
) => {
  for (const [name, before] of Object.entries(expected)) {
    assert.ok(actual[name], `missing geometry for ${name}`);
    if (!ignoredGeometry.has(name)) {
      actual[name].rect.forEach((value, index) => {
        assert.ok(
          Math.abs(value - before.rect[index]) <= tolerance,
          `${name} rect[${index}] changed from ${before.rect[index]} to ${value}`
        );
      });
    }
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

let browser;

test.before(async () => {
  browser = await chromium.launch({ headless: true });
});

test.after(async () => {
  await browser?.close();
});

test('V20 maps the compact scroll material at the corrected native-state proportion', async () => {
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
      newTaskMenu: 0,
      pullRequests: 0,
      sites: 0,
      scheduled: 0,
      plugins: 0,
      projectInternalControl: 0,
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
    document.querySelector('[data-native-slot="new-task-menu"]')
      .addEventListener('click', () => { window.__forgeClicks.newTaskMenu += 1; });
    document.querySelector('[data-native-slot="pull-requests"]')
      .addEventListener('click', () => { window.__forgeClicks.pullRequests += 1; });
    document.querySelector('[data-native-slot="sites"]')
      .addEventListener('click', () => { window.__forgeClicks.sites += 1; });
    document.querySelector('[data-native-slot="scheduled"]')
      .addEventListener('click', () => { window.__forgeClicks.scheduled += 1; });
    document.querySelector('[data-native-slot="plugins"]')
      .addEventListener('click', () => { window.__forgeClicks.plugins += 1; });
    document.querySelector('[data-native-slot="project-internal-control"]')
      .addEventListener('click', () => { window.__forgeClicks.projectInternalControl += 1; });
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
  assertRectsEqual(after, before, 0.25, composerGeometryNames);
  assert.equal(await page.locator('.forge-composer-frame').count(), 1);
  assert.equal(await page.locator('.forge-composer-input-shell').count(), 1);
  assert.equal(await page.locator('.forge-composer-footer').count(), 1);
  const expectedHeight = expectedComposerHeight(after.composer.rect[2]);
  assert.ok(
    Math.abs(after.composer.rect[3] - expectedHeight) <= 0.5,
    `composer height ${after.composer.rect[3]} must follow the constrained custom-scroll ratio`
  );
  assert.equal(
    await page.locator(
      '[data-native-slot="composer-submit"][type="button"].forge-composer-submit'
    ).count(),
    1,
    'the real type=button send host must receive paint without replacing its semantics'
  );
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
    'non-current project containers must retain the dark level-one material'
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
    await page.locator('[data-native-slot="new-task-row"].forge-sidebar-action').count(),
    1,
    'top native navigation must receive its own themed action-row mapping'
  );
  assert.equal(
    await page.locator('[data-native-slot="plugins"].forge-sidebar-action').count(),
    1,
    'a top navigation action without project expansion semantics must retain action mapping'
  );
  assert.equal(
    await page.locator('[data-native-slot="plugins"][aria-expanded]').count(),
    0,
    'the fixture must not invent project expansion semantics for Plugins'
  );
  assert.equal(
    await page.locator(
      '[data-app-action-sidebar-project-show-all-toggle][data-forge-mark]'
    ).count(),
    0,
    'internal project controls must not be painted as sidebar rows'
  );

  const paint = await page.evaluate(() => ({
    composer: (() => {
      const element = document.querySelector('.forge-composer-frame');
      const style = getComputedStyle(element);
      const paintStyle = getComputedStyle(element, '::before');
      const rect = element.getBoundingClientRect();
      const controlsRemainHittable = [...element.querySelectorAll('button,[role="button"]')]
        .every(control => {
          const controlRect = control.getBoundingClientRect();
          const hit = document.elementFromPoint(
            controlRect.left + controlRect.width / 2,
            controlRect.top + controlRect.height / 2
          );
          return hit === control || control.contains(hit);
        });
      return {
        backgroundImage: style.backgroundImage,
        aspectRatio: style.aspectRatio,
        minHeight: style.minHeight,
        maxHeight: style.maxHeight,
        borderRadius: style.borderRadius,
        clipPath: style.clipPath,
        pseudoContent: paintStyle.content,
        pseudoPointerEvents: paintStyle.pointerEvents,
        pseudoBackgroundImage: paintStyle.backgroundImage,
        pseudoBackgroundPosition: paintStyle.backgroundPosition,
        pseudoBackgroundRepeat: paintStyle.backgroundRepeat,
        pseudoBackgroundSize: paintStyle.backgroundSize,
        pseudoClipPath: paintStyle.clipPath,
        cornerHitKeepsHost: document
          .elementsFromPoint(rect.left + 1, rect.top + 1)
          .includes(element),
        controlsRemainHittable
      };
    })(),
    composerEditorPaddingBlockStart: getComputedStyle(
      document.querySelector('.forge-composer-frame .ProseMirror[role="textbox"]')
    ).paddingBlockStart,
    composerInputShellPaddingBlockStart: getComputedStyle(
      document.querySelector('.forge-composer-input-shell')
    ).paddingBlockStart,
    composerInputShellPaddingInlineStart: getComputedStyle(
      document.querySelector('.forge-composer-input-shell')
    ).paddingInlineStart,
    composerFooterPaddingInlineStart: getComputedStyle(
      document.querySelector('.forge-composer-footer')
    ).paddingInlineStart,
    composerFooterMarginBottom: getComputedStyle(
      document.querySelector('.forge-composer-footer')
    ).marginBottom,
    sidebarShell: (() => {
      const style = getComputedStyle(document.querySelector('.forge-sidebar-shell'));
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        backdropFilter: style.backdropFilter
      };
    })(),
    menu: getComputedStyle(document.querySelector('.forge-topbar-menu-item')).backgroundImage,
    action: getComputedStyle(document.querySelector('.forge-sidebar-action')).backgroundImage,
    level1: getComputedStyle(document.querySelector('.forge-sidebar-level1')).backgroundImage,
    selected: getComputedStyle(document.querySelector('.forge-sidebar-selected')).backgroundImage,
    level2: getComputedStyle(
      document.querySelector('.forge-sidebar-level2:not(.forge-sidebar-selected)')
    ).backgroundImage
  }));
  assert.equal(paint.composer.backgroundImage, 'none');
  assert.match(paint.composer.pseudoBackgroundImage, /data:image\/svg\+xml/);
  assert.ok(
    (paint.composer.pseudoBackgroundImage.match(/data:image\//g) || []).length >= 2,
    'composer paint layer must use the frame and repeatable paper layers'
  );
  assert.equal(paint.composer.pseudoBackgroundRepeat, 'no-repeat, repeat');
  assert.equal(paint.composer.pseudoBackgroundSize, '100% 100%, 512px 220px');
  assert.equal(paint.composer.aspectRatio, '184 / 25');
  assert.equal(paint.composer.minHeight, '96px');
  assert.equal(paint.composer.maxHeight, '120px');
  assert.equal(paint.composer.borderRadius, '0px');
  assert.equal(paint.composer.clipPath, 'none');
  assert.match(paint.composer.pseudoClipPath, /^polygon\(/);
  assert.equal(
    paint.composer.pseudoContent,
    '""',
    'composer paper must be isolated to a paint-only pseudo-element'
  );
  assert.equal(paint.composer.pseudoPointerEvents, 'none');
  assert.equal(
    paint.composer.cornerHitKeepsHost,
    true,
    'the visually cut composer corner must retain the native rectangular host hit area'
  );
  assert.equal(
    paint.composer.controlsRemainHittable,
    true,
    'the composer paint stacking context must not cover native controls'
  );
  assert.equal(
    paint.composerEditorPaddingBlockStart,
    '0px',
    'the editable ProseMirror node itself must keep its native padding'
  );
  assert.equal(paint.composerInputShellPaddingBlockStart, '8px');
  assert.equal(paint.composerInputShellPaddingInlineStart, '12px');
  assert.equal(paint.composerFooterPaddingInlineStart, '8px');
  assert.equal(paint.composerFooterMarginBottom, '8px');
  assert.equal(paint.sidebarShell.backgroundColor, 'rgba(0, 0, 0, 0)');
  assert.match(paint.sidebarShell.backgroundImage, /linear-gradient/);
  assert.equal(
    paint.sidebarShell.backdropFilter,
    'none',
    'the full-window background must show through the sidebar without a GPU blur'
  );
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
  await page.locator(selectors.newTaskMenu).click();
  await page.locator(selectors.pullRequests).click();
  await page.locator(selectors.sites).click();
  await page.locator(selectors.scheduled).click();
  await page.locator(selectors.plugins).click();
  await page.locator(selectors.projectInternalControl).click();
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
      newTaskMenu: 1,
      pullRequests: 1,
      sites: 1,
      scheduled: 1,
      plugins: 1,
      projectInternalControl: 1,
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

test('V15 preserves native topbar and sidebar state semantics while painting the full state matrix', async () => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v15-state-matrix.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v15-state-matrix.test/');

  const rectTargets = {
    menuFile: selectors.menuFile,
    menuEdit: selectors.menuEdit,
    menuView: selectors.menuView,
    menuHelp: selectors.menuHelp,
    newTaskRow: selectors.newTaskRow,
    newTask: selectors.newTask,
    newTaskMenu: selectors.newTaskMenu,
    pullRequests: selectors.pullRequests,
    sites: selectors.sites,
    scheduled: selectors.scheduled,
    plugins: selectors.plugins,
    rootThread: selectors.rootThread,
    project: selectors.project,
    childThread: selectors.childThread
  };
  const readRects = () => page.evaluate(targets => Object.fromEntries(
    Object.entries(targets).map(([name, selector]) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return [name, [rect.x, rect.y, rect.width, rect.height]];
    })
  ), rectTargets);
  const beforeRects = await readRects();

  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelectorAll('.forge-topbar-menu-item').length === 4 &&
    document.querySelectorAll('.forge-sidebar-action').length === 5 &&
    document.querySelector('[data-native-slot="new-task-row"]')
      ?.classList.contains('forge-sidebar-action')
  ));

  assert.equal(
    await page.locator(
      [
        selectors.newTaskRow,
        selectors.pullRequests,
        selectors.sites,
        selectors.scheduled,
        selectors.plugins
      ].map(selector => `${selector}.forge-sidebar-action`).join(',')
    ).count(),
    5,
    'all five native sidebar entry surfaces must receive action-row paint'
  );

  const menuFile = page.locator(selectors.menuFile);
  const menuEdit = page.locator(selectors.menuEdit);
  const menuView = page.locator(selectors.menuView);
  const menuHelp = page.locator(selectors.menuHelp);
  const menuDefault = await menuFile.evaluate(element => ({
    image: getComputedStyle(element).backgroundImage,
    color: getComputedStyle(element).color,
    shadow: getComputedStyle(element).boxShadow
  }));

  await menuFile.hover();
  const menuHover = await menuFile.evaluate(element => ({
    image: getComputedStyle(element).backgroundImage,
    color: getComputedStyle(element).color
  }));
  assert.notEqual(menuHover.image, menuDefault.image);
  assert.notEqual(menuHover.color, menuDefault.color);

  await page.mouse.move(900, 450);
  await menuEdit.focus();
  assert.equal(await menuEdit.evaluate(element => element.matches(':focus-visible')), true);
  assert.notEqual(
    await menuEdit.evaluate(element => getComputedStyle(element).boxShadow),
    menuDefault.shadow
  );
  assert.equal(
    await menuEdit.evaluate(element => getComputedStyle(element).outlineStyle),
    'none',
    'native browser focus outline must be replaced by the themed focus paint'
  );

  await menuView.evaluate(element => element.setAttribute('aria-expanded', 'true'));
  assert.notEqual(
    await menuView.evaluate(element => getComputedStyle(element).backgroundImage),
    menuDefault.image
  );
  await menuView.evaluate(element => element.setAttribute('aria-expanded', 'false'));

  await menuHelp.evaluate(element => element.dataset.state = 'open');
  assert.notEqual(
    await menuHelp.evaluate(element => getComputedStyle(element).backgroundImage),
    menuDefault.image,
    'data-state=open must use the same selected-paper state as aria-expanded'
  );
  await menuHelp.evaluate(element => delete element.dataset.state);

  await page.evaluate(() => {
    window.__disabledMenuClicks = 0;
    const menu = document.querySelector('[data-native-slot="menu-file"]');
    menu.addEventListener('click', () => { window.__disabledMenuClicks += 1; });
    menu.disabled = true;
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="menu-file"]')?.disabled === true
  ));
  await menuFile.hover();
  const disabledMenu = await menuFile.evaluate(element => ({
    image: getComputedStyle(element).backgroundImage,
    shadow: getComputedStyle(element).boxShadow,
    opacity: getComputedStyle(element).opacity
  }));
  assert.equal(disabledMenu.image, menuDefault.image);
  assert.equal(disabledMenu.shadow, 'none');
  assert.equal(disabledMenu.opacity, '0.46');
  await menuFile.evaluate(element => element.click());
  assert.equal(await page.evaluate(() => window.__disabledMenuClicks), 0);
  await menuFile.evaluate(element => { element.disabled = false; });

  const newTaskRow = page.locator(selectors.newTaskRow);
  const newTask = page.locator(selectors.newTask);
  const newTaskMenu = page.locator(selectors.newTaskMenu);
  const actionDefault = await newTaskRow.evaluate(element => ({
    image: getComputedStyle(element).backgroundImage,
    shadow: getComputedStyle(element).boxShadow
  }));

  await newTaskRow.hover();
  assert.notEqual(
    await newTaskRow.evaluate(element => getComputedStyle(element).backgroundImage),
    actionDefault.image
  );
  await page.mouse.move(900, 450);
  await newTask.focus();
  assert.equal(await newTask.evaluate(element => element.matches(':focus-visible')), true);
  assert.notEqual(
    await newTaskRow.evaluate(element => getComputedStyle(element).backgroundImage),
    actionDefault.image
  );
  assert.equal(
    await newTaskRow.evaluate(element => getComputedStyle(element).boxShadow),
    'none',
    'action focus must use ink-material contrast instead of a modern control outline'
  );

  await newTaskMenu.evaluate(element => element.dataset.state = 'open');
  assert.notEqual(
    await newTaskRow.evaluate(element => getComputedStyle(element).backgroundImage),
    actionDefault.image,
    'a native trailing menu must open the paint state on its existing outer row'
  );
  await newTaskMenu.evaluate(element => element.dataset.state = 'closed');

  await newTaskMenu.evaluate(element => { element.disabled = true; });
  assert.equal(
    await newTaskRow.evaluate(element => getComputedStyle(element).opacity),
    '1',
    'disabling only the native trailing menu must not disable the whole action row'
  );
  await newTaskMenu.evaluate(element => { element.disabled = false; });

  await newTask.evaluate(element => { element.disabled = true; });
  assert.equal(
    await newTaskRow.evaluate(element => getComputedStyle(element).opacity),
    '0.46',
    'disabling the direct native main action must expose the disabled row state'
  );
  await newTask.evaluate(element => { element.disabled = false; });

  await page.locator(selectors.pullRequests).evaluate(element => {
    element.setAttribute('aria-current', 'page');
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="pull-requests"]')
      ?.classList.contains('forge-sidebar-action-active')
  ));
  assert.notEqual(
    await page.locator(selectors.pullRequests).evaluate(
      element => getComputedStyle(element).backgroundImage
    ),
    actionDefault.image
  );
  const activeActionPaint = await page.locator(selectors.pullRequests).evaluate(element => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    shadow: getComputedStyle(element).boxShadow,
    color: getComputedStyle(element).color,
    descendantColors: [...element.querySelectorAll('span, svg')]
      .map(child => getComputedStyle(child).color)
  }));
  assert.equal(activeActionPaint.color, 'rgb(47, 40, 34)');
  assert.ok(
    activeActionPaint.descendantColors.every(color => color === 'rgb(47, 40, 34)'),
    `active action descendants did not switch to dark ink: ${
      activeActionPaint.descendantColors.join(', ')
    }`
  );
  assert.doesNotMatch(
    `${activeActionPaint.backgroundImage} ${activeActionPaint.shadow}`,
    /(?:157,\s*63,\s*38|133,\s*56,\s*35)/,
    'active action retained the rejected lacquer-red left edge'
  );
  await page.locator(selectors.pullRequests).evaluate(element => {
    element.removeAttribute('aria-current');
  });
  await page.waitForFunction(() => (
    !document.querySelector('[data-native-slot="pull-requests"]')
      ?.classList.contains('forge-sidebar-action-active')
  ));

  await page.locator(selectors.sites).evaluate(element => {
    element.dataset.state = 'active';
  });
  await page.waitForTimeout(80);
  assert.equal(
    await page.locator(`${selectors.sites}.forge-sidebar-action-active`).count(),
    0,
    'generic data-state=active must not be mistaken for native current navigation'
  );
  await page.locator(selectors.sites).evaluate(element => {
    delete element.dataset.state;
  });

  await page.evaluate(() => {
    window.__disabledSidebarClicks = 0;
    const action = document.querySelector('[data-native-slot="plugins"]');
    action.addEventListener('click', () => { window.__disabledSidebarClicks += 1; });
    action.disabled = true;
  });
  const plugins = page.locator(selectors.plugins);
  await plugins.hover();
  const disabledAction = await plugins.evaluate(element => ({
    image: getComputedStyle(element).backgroundImage,
    shadow: getComputedStyle(element).boxShadow,
    opacity: getComputedStyle(element).opacity
  }));
  assert.equal(disabledAction.image, actionDefault.image);
  assert.equal(disabledAction.shadow, 'none');
  assert.equal(disabledAction.opacity, '0.46');
  await plugins.evaluate(element => element.click());
  assert.equal(await page.evaluate(() => window.__disabledSidebarClicks), 0);
  await plugins.evaluate(element => { element.disabled = false; });

  const projectRows = page.locator(
    '[data-app-action-sidebar-project-row].forge-sidebar-level1'
  );
  const expandedProjectImage = await projectRows.nth(0).evaluate(
    element => getComputedStyle(element).backgroundImage
  );
  const collapsedProjectImage = await projectRows.nth(2).evaluate(
    element => getComputedStyle(element).backgroundImage
  );
  assert.notEqual(
    expandedProjectImage,
    collapsedProjectImage,
    'expanded and collapsed project rows need distinguishable native directory states'
  );
  await projectRows.nth(2).hover();
  assert.notEqual(
    await projectRows.nth(2).evaluate(element => getComputedStyle(element).backgroundImage),
    collapsedProjectImage,
    'collapsed project rows must retain a visible hover state'
  );
  await page.mouse.move(900, 450);
  await projectRows.nth(2).focus();
  assert.equal(
    await projectRows.nth(2).evaluate(element => element.matches(':focus-visible')),
    true
  );
  assert.notEqual(
    await projectRows.nth(2).evaluate(element => getComputedStyle(element).backgroundImage),
    collapsedProjectImage,
    'collapsed project focus must remain visible through the ink material'
  );
  assert.equal(
    await projectRows.nth(2).evaluate(element => getComputedStyle(element).boxShadow),
    'none',
    'project focus must not add a modern rounded control outline'
  );
  assert.equal(
    await projectRows.nth(2).evaluate(element => getComputedStyle(element).outlineStyle),
    'none',
    'project focus must not leak the browser default rectangular ring'
  );

  const level2 = page.locator('[data-native-slot="project-temple-child"]');
  const level2Default = await level2.evaluate(element => ({
    image: getComputedStyle(element).backgroundImage,
    shadow: getComputedStyle(element).boxShadow
  }));
  await level2.hover();
  assert.notEqual(
    await level2.evaluate(element => getComputedStyle(element).backgroundImage),
    level2Default.image
  );
  await page.mouse.move(900, 450);
  await level2.focus();
  assert.equal(await level2.evaluate(element => element.matches(':focus-visible')), true);
  assert.notEqual(
    await level2.evaluate(element => getComputedStyle(element).backgroundImage),
    level2Default.image
  );
  assert.equal(
    await level2.evaluate(element => getComputedStyle(element).boxShadow),
    'none',
    'level-two focus must use the ink strip rather than a rounded control outline'
  );

  const sidebarPaintStates = await page.evaluate(() => (
    [...document.querySelectorAll(
      '.forge-sidebar-action, .forge-sidebar-level1, ' +
      '.forge-sidebar-level2, .forge-sidebar-selected'
    )].map(element => {
      const style = getComputedStyle(element);
      return {
        slot: element.dataset.nativeSlot || element.textContent.trim().slice(0, 32),
        paint: `${style.backgroundImage} ${style.boxShadow}`
      };
    })
  ));
  for (const state of sidebarPaintStates) {
    assert.doesNotMatch(
      state.paint,
      /(?:157,\s*63,\s*38|133,\s*56,\s*35)/,
      `${state.slot} retained the rejected lacquer-red left edge`
    );
  }
  assert.equal(
    await page.locator('[data-native-slot="project-active"] [data-thread-title]').evaluate(
      element => getComputedStyle(element).color
    ),
    'rgb(47, 40, 34)',
    'the pale current-thread material must use dark ink text'
  );

  const nativeIndicators = await page.evaluate(() => {
    const unread = document.querySelector('[data-native-status="unread"] span span');
    const spinner = document.querySelector('[data-native-status="running"] .animate-spin');
    const spinnerStyle = getComputedStyle(spinner);
    return {
      unreadColor: getComputedStyle(unread).backgroundColor,
      spinnerColor: spinnerStyle.color,
      spinnerAnimationName: spinnerStyle.animationName,
      spinnerAnimationDuration: spinnerStyle.animationDuration
    };
  });
  assert.equal(nativeIndicators.unreadColor, 'rgb(167, 75, 48)');
  assert.equal(nativeIndicators.spinnerColor, 'rgb(179, 84, 55)');
  assert.equal(nativeIndicators.spinnerAnimationName, 'fixture-spin');
  assert.equal(nativeIndicators.spinnerAnimationDuration, '2s');
  assert.equal(
    await page.locator('[data-native-slot="project-internal-control"][data-forge-mark]').count(),
    0
  );

  const afterRects = await readRects();
  for (const [name, before] of Object.entries(beforeRects)) {
    afterRects[name].forEach((value, index) => {
      assert.ok(
        Math.abs(value - before[index]) <= 0.25,
        `${name} rect[${index}] changed from ${before[index]} to ${value}`
      );
    });
  }

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});

test('V16 maps the native guided stack once and remaps context without a resize trigger', async () => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v14-state.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v14-state.test/');
  await installComposerState(page, 'guided');

  const nativeStateContract = await page.evaluate(() => {
    const rectOf = element => {
      const rect = element.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom
      };
    };
    const root = document.querySelector('[data-codex-composer-root]');
    const portal = root.querySelector(
      ':scope > [data-above-composer-portal][data-above-composer-conversation-id]'
    );
    const composer = root.querySelector('.composer-surface-chrome');
    const component = [...root.children].find(child => (
      child !== portal && child.contains(composer)
    ));
    const editor = composer.querySelector('.ProseMirror[role="textbox"]');
    const submit = composer.querySelector('[data-native-slot="composer-submit"]');
    const footer = submit.closest('div.select-none');
    const footerButtons = [...footer.querySelectorAll('button')].filter(button => {
      const rect = button.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    });
    const controlGroupButtons = [
      ...submit.parentElement.querySelectorAll('button')
    ].filter(button => {
      const rect = button.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    });
    const progressHost = portal.querySelector('.native-progress-host');
    const progress = portal.querySelector('[data-fixture-control="plan"]');
    const stack = root.querySelector('[data-fixture-surface="composer-stack"]');
    const queued = root.querySelector('[data-fixture-surface="queued-panel"]');
    const goal = root.querySelector('[data-fixture-surface="goal-panel"]');
    return {
      composer: rectOf(composer),
      editor: rectOf(editor),
      submit: rectOf(submit),
      progressHost: rectOf(progressHost),
      progress: rectOf(progress),
      stack: rectOf(stack),
      queued: rectOf(queued),
      goal: rectOf(goal),
      stackSharedParent: queued.parentElement === goal.parentElement,
      portalIsDirectChild: portal.parentElement === root,
      componentIsDirectChild: component.parentElement === root,
      componentUsesProductionSignature: [
        'relative',
        'flex',
        'w-full',
        'flex-col',
        'gap-2'
      ].every(token => component.classList.contains(token)),
      fixtureDoesNotDeclareComponentIdentity: !root.querySelector(
        '[data-native-composer-component]'
      ),
      stackInsideComponent: component.contains(stack),
      progressInsidePortal: portal.contains(progress),
      progressInsideStack: stack.contains(progress),
      stackInsidePortal: portal.contains(stack),
      progressSignature: [
        'flex',
        'w-max',
        'max-w-full',
        'min-w-0',
        'items-center',
        'gap-2',
        'rounded-3xl',
        'border',
        'px-3',
        'py-1.5'
      ].every(token => progress.classList.contains(token)),
      submitSignature: [
        'cursor-interaction',
        'size-token-button-composer',
        'flex',
        'items-center',
        'justify-center',
        'rounded-full',
        'transition-opacity',
        'focus-visible:outline-2'
      ].every(token => submit.classList.contains(token)),
      footerSignature: [
        'select-none',
        '_footer_uoylu_2'
      ].every(token => footer.classList.contains(token)),
      submitIsLastFooterButton: footerButtons.at(-1) === submit,
      submitIsLastControlGroupButton: controlGroupButtons.at(-1) === submit,
      submitLabel: submit.getAttribute('aria-label'),
      submitType: submit.getAttribute('type'),
      stopSquare: submit.querySelector('rect')?.getAttribute('width')
    };
  });
  assert.equal(nativeStateContract.composer.height, 84);
  assert.equal(nativeStateContract.editor.height, nativeUiBaseline.composerEditorMinHeight);
  assert.deepEqual(
    [nativeStateContract.submit.width, nativeStateContract.submit.height],
    [nativeUiBaseline.composerButtonSize, nativeUiBaseline.composerButtonSize]
  );
  assert.equal(nativeStateContract.progressHost.height, 32);
  assert.ok(nativeStateContract.progress.width < nativeStateContract.composer.width * .8);
  assert.ok(
    Math.abs(
      nativeStateContract.progress.x + nativeStateContract.progress.width / 2 -
      (nativeStateContract.composer.x + nativeStateContract.composer.width / 2)
    ) <= .25,
    'native progress pill must remain content-width and centered over the composer'
  );
  assert.equal(nativeStateContract.stackSharedParent, true);
  assert.equal(nativeStateContract.portalIsDirectChild, true);
  assert.equal(nativeStateContract.componentIsDirectChild, true);
  assert.equal(nativeStateContract.componentUsesProductionSignature, true);
  assert.equal(nativeStateContract.fixtureDoesNotDeclareComponentIdentity, true);
  assert.equal(nativeStateContract.stackInsideComponent, true);
  assert.equal(nativeStateContract.progressInsidePortal, true);
  assert.equal(nativeStateContract.progressInsideStack, false);
  assert.equal(nativeStateContract.stackInsidePortal, false);
  assert.equal(nativeStateContract.progressSignature, true);
  assert.equal(nativeStateContract.submitSignature, true);
  assert.equal(nativeStateContract.footerSignature, true);
  assert.equal(nativeStateContract.submitIsLastFooterButton, true);
  assert.equal(nativeStateContract.submitIsLastControlGroupButton, true);
  assert.ok(
    Math.abs(nativeStateContract.queued.bottom - nativeStateContract.goal.y) <= .25,
    'queued and active-goal rows must be contiguous without a card gap'
  );
  assert.ok(
    Math.abs(
      nativeStateContract.stack.width -
      (nativeStateContract.composer.width - (2 * 13))
    ) <= .25,
    'the native above-composer stack must keep the official 13px side inset'
  );
  assert.equal(nativeStateContract.submitLabel, '停止');
  assert.equal(nativeStateContract.submitType, 'button');
  assert.equal(nativeStateContract.stopSquare, '6');

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
    document.querySelector('[data-fixture-control="plan"]')
      ?.classList.contains('forge-composer-progress-pill') &&
    document.querySelector('[data-fixture-control="plan"]')
      ?.classList.contains('forge-plan-pill') &&
    document.querySelector('[data-fixture-surface="composer-stack"]')
      ?.classList.contains('forge-composer-panel-stack') &&
    document.querySelectorAll('.forge-composer-panel').length === 2 &&
    document.querySelector('[data-native-slot="composer-submit"]')
      ?.classList.contains('forge-composer-submit')
  ));

  assert.equal(await page.locator('.forge-composer-context').count(), 0);
  assert.equal(await page.locator('.forge-composer-panel-stack').count(), 1);
  assert.equal(await page.locator('.forge-composer-panel').count(), 2);
  assert.equal(await page.locator('.forge-composer-progress-pill').count(), 1);
  assert.equal(await page.locator('.forge-plan-pill').count(), 1);
  assert.equal(await page.locator('.forge-diff-summary').count(), 1);
  const guidedPaint = await page.evaluate(() => {
    const stack = document.querySelector('.forge-composer-panel-stack');
    const stackStyle = getComputedStyle(stack);
    const stackPaintStyle = getComputedStyle(stack, '::before');
    const stackControls = [...stack.querySelectorAll('button,[role="button"]')];
    const previousStackPointerEvents = stack.style.pointerEvents;
    const previousControlPointerEvents = stackControls.map(
      control => control.style.pointerEvents
    );
    stack.style.pointerEvents = 'auto';
    stackControls.forEach(control => {
      control.style.pointerEvents = 'auto';
    });
    const stackControlsRemainHittable = stackControls.every(control => {
        const controlRect = control.getBoundingClientRect();
        const hit = document.elementFromPoint(
          controlRect.left + controlRect.width / 2,
          controlRect.top + controlRect.height / 2
        );
        return hit === control || control.contains(hit);
      });
    stack.style.pointerEvents = previousStackPointerEvents;
    stackControls.forEach((control, index) => {
      control.style.pointerEvents = previousControlPointerEvents[index];
    });
    const pillStyle = getComputedStyle(
      document.querySelector('.forge-composer-progress-pill')
    );
    return {
      stackClipPath: stackStyle.clipPath,
      stackBackgroundImage: stackStyle.backgroundImage,
      stackPaintClipPath: stackPaintStyle.clipPath,
      stackPaintBackgroundSize: stackPaintStyle.backgroundSize,
      stackPaintBackgroundPosition: stackPaintStyle.backgroundPosition,
      stackPaintPointerEvents: stackPaintStyle.pointerEvents,
      stackControlsRemainHittable,
      stackBorderRadius: stackStyle.borderRadius,
      pillBorderRadius: pillStyle.borderRadius
    };
  });
  assert.equal(
    guidedPaint.stackClipPath,
    'none',
    'the live joined queue/goal host must retain its rectangular native hit area'
  );
  assert.equal(guidedPaint.stackBackgroundImage, 'none');
  assert.equal(
    guidedPaint.stackPaintClipPath,
    'polygon(8px 0px, calc(100% - 8px) 0px, 100% 8px, 100% 100%, 0px 100%, 0px 8px)',
    'the paint-only joined queue/goal strip must have only the two upper cut corners'
  );
  assert.equal(
    guidedPaint.stackPaintBackgroundSize,
    '100% 200%, 512px 220px',
    'the joined strip must paint only the upper half of the four-corner source'
  );
  assert.match(
    guidedPaint.stackPaintBackgroundPosition,
    /^50% 0%/,
    'the joined strip must use the source upper edge and never reveal lower corners'
  );
  assert.equal(guidedPaint.stackPaintPointerEvents, 'none');
  assert.equal(
    guidedPaint.stackControlsRemainHittable,
    true,
    'the joined-stack paint stacking context must not cover native controls'
  );
  assert.equal(guidedPaint.stackBorderRadius, '0px');
  assert.equal(
    guidedPaint.pillBorderRadius,
    '999px',
    'the separate progress pill remains rounded on all sides'
  );
  assert.equal(
    await page.locator('[data-native-slot="composer-submit"]').getAttribute('aria-label'),
    '停止'
  );
  const themedComposerRect = await page.locator('.forge-composer-frame').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return [rect.x, rect.y, rect.width, rect.height];
  });
  assert.ok(
    Math.abs(
      themedComposerRect[3] -
      expectedComposerHeight(themedComposerRect[2])
    ) <= 0.5,
    'the themed composer must follow the constrained custom-scroll ratio'
  );

  const adjacentAfter = await page.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('[data-fixture-surface], [data-fixture-control]')].map(element => {
      const rect = element.getBoundingClientRect();
      return [
        element.dataset.fixtureSurface || element.dataset.fixtureControl,
        [rect.x, rect.y, rect.width, rect.height]
      ];
    })
  ));
  for (const [key, beforeRect] of Object.entries(adjacentBefore)) {
    const afterRect = adjacentAfter[key];
    assert.ok(afterRect, `missing adjacent surface ${key}`);
    if (key !== 'goal') {
      assert.ok(Math.abs(afterRect[0] - beforeRect[0]) <= 0.25, `${key} x changed`);
    }
    assert.ok(Math.abs(afterRect[2] - beforeRect[2]) <= 0.25, `${key} width changed`);
    assert.ok(Math.abs(afterRect[3] - beforeRect[3]) <= 0.25, `${key} height changed`);
  }

  const contextGeometry = await installComposerState(page, 'context');
  await page.waitForFunction(() => (
    document.querySelector('[data-fixture-surface="composer-context"]')
      ?.classList.contains('forge-composer-context') &&
    !document.querySelector('.forge-composer-panel-stack') &&
    !document.querySelector('.forge-composer-panel')
  ));
  assert.equal(await page.locator('.forge-composer-context').count(), 1);
  assert.equal(await page.locator('.forge-plan-pill').count(), 0);
  assert.equal(
    await page.locator('[data-native-slot="composer-submit"]').getAttribute('aria-label'),
    null
  );
  const contextAfter = await page.locator(
    '[data-fixture-surface="composer-context"]'
  ).evaluate(element => {
    const rect = element.getBoundingClientRect();
    return [rect.x, rect.y, rect.width, rect.height];
  });
  assert.deepEqual(contextAfter, contextGeometry.context);
  const contextContract = await page.evaluate(() => {
    const root = document.querySelector('[data-codex-composer-root]');
    const utility = root.querySelector('[data-native-composer-utility-slot]');
    const portal = root.querySelector('[data-above-composer-portal]');
    const composer = root.querySelector('.composer-surface-chrome');
    const component = [...root.children].find(child => (
      child !== portal && child.contains(composer)
    ));
    const utilityRect = utility.getBoundingClientRect();
    const composerRect = composer.getBoundingClientRect();
    return {
      utilityIsInsideComponent: component.contains(utility) && !portal.contains(utility),
      utilitySignature: [
        'flex',
        'flex-wrap',
        'items-center',
        'gap-2',
        'overflow-visible',
        'pr-2',
        'pl-2'
      ].every(token => utility.classList.contains(token)),
      utilityWidth: utilityRect.width,
      composerWidth: composerRect.width,
      runLocationCount: utility.querySelectorAll(
        '[data-composer-navigation-target="run-location"]'
      ).length,
      footerReasoningInsideUtility: Boolean(
        utility.querySelector('[data-composer-navigation-target="reasoning"]')
      )
    };
  });
  assert.equal(contextContract.utilityIsInsideComponent, true);
  assert.equal(contextContract.utilitySignature, true);
  assert.equal(contextContract.utilityWidth, contextContract.composerWidth);
  assert.equal(contextContract.runLocationCount, 1);
  assert.equal(contextContract.footerReasoningInsideUtility, false);

  const homeContextGeometry = await installComposerState(page, 'home-context');
  await page.waitForFunction(() => (
    document.querySelector('[data-fixture-surface="composer-context"]')
      ?.classList.contains('forge-composer-context') &&
    document.querySelector('[data-composer-utility-bar-scroll-area]')
  ));
  const homeContextContract = await page.evaluate(() => {
    const root = document.querySelector('[data-codex-composer-root]');
    const utility = root.querySelector('[data-native-composer-utility-slot]');
    const portal = root.querySelector('[data-above-composer-portal]');
    const composer = root.querySelector('.composer-surface-chrome');
    const component = [...root.children].find(child => (
      child !== portal && child.contains(composer)
    ));
    const scrollArea = utility.querySelector('[data-composer-utility-bar-scroll-area]');
    const rect = utility.getBoundingClientRect();
    return {
      insideComponent: component.contains(utility),
      outsidePortal: !portal.contains(utility),
      componentSignature: [
        'relative',
        'flex',
        'w-full',
        'flex-col',
        'gap-2'
      ].every(token => component.classList.contains(token)),
      scrollAreaDirect: scrollArea.parentElement === utility,
      signature: [
        'flex',
        'flex-nowrap',
        'items-center',
        'gap-2',
        'overflow-hidden'
      ].every(token => utility.classList.contains(token)),
      rect: [rect.x, rect.y, rect.width, rect.height]
    };
  });
  assert.equal(homeContextContract.insideComponent, true);
  assert.equal(homeContextContract.outsidePortal, true);
  assert.equal(homeContextContract.componentSignature, true);
  assert.equal(homeContextContract.scrollAreaDirect, true);
  assert.equal(homeContextContract.signature, true);
  assert.deepEqual(homeContextContract.rect, homeContextGeometry.context);

  const transitionStates = [
    {
      name: 'running',
      context: 0,
      progress: 1,
      stacks: 1,
      panels: 1,
      submitLabel: '停止'
    },
    {
      name: 'guided',
      context: 0,
      progress: 1,
      stacks: 1,
      panels: 2,
      submitLabel: '停止',
      collapsed: true
    },
    {
      name: 'expanded-guided',
      context: 0,
      progress: 1,
      stacks: 1,
      panels: 2,
      submitLabel: '停止',
      collapsed: false
    },
    {
      name: 'default',
      context: 0,
      progress: 0,
      stacks: 0,
      panels: 0,
      submitLabel: null
    }
  ];
  for (const expected of transitionStates) {
    const nativeGeometry = await installComposerState(page, expected.name);
    await page.waitForFunction(state => {
      const submit = document.querySelector('[data-native-slot="composer-submit"]');
      return (
        document.querySelectorAll('.forge-composer-context').length === state.context &&
        document.querySelectorAll('.forge-composer-progress-pill').length === state.progress &&
        document.querySelectorAll('.forge-composer-panel-stack').length === state.stacks &&
        document.querySelectorAll('.forge-composer-panel').length === state.panels &&
        submit?.getAttribute('aria-label') === state.submitLabel &&
        submit.classList.contains('forge-composer-submit')
      );
    }, expected);
    const mappedGeometry = await page.evaluate(() => Object.fromEntries(
      [
        ['composer', '.composer-surface-chrome'],
        ['context', '[data-fixture-surface="composer-context"]'],
        ['progress', '[data-fixture-control="plan"]'],
        ['stack', '[data-fixture-surface="composer-stack"]'],
        ['queued', '[data-fixture-surface="queued-panel"]'],
        ['goal', '[data-fixture-surface="goal-panel"]'],
        ['submit', '[data-native-slot="composer-submit"]']
      ].map(([name, selector]) => {
        const element = document.querySelector(selector);
        if (!element) return [name, null];
        const rect = element.getBoundingClientRect();
        return [name, [rect.x, rect.y, rect.width, rect.height]];
      })
    ));
    assert.deepEqual(mappedGeometry, nativeGeometry, `${expected.name} geometry changed`);
    const topology = await page.evaluate(() => {
      const root = document.querySelector('[data-codex-composer-root]');
      const portal = root.querySelector(':scope > [data-above-composer-portal]');
      const composer = root.querySelector('.composer-surface-chrome');
      const component = [...root.children].find(child => (
        child !== portal && child.contains(composer)
      ));
      const utility = root.querySelector('[data-native-composer-utility-slot]');
      const stack = root.querySelector('[data-fixture-surface="composer-stack"]');
      const progress = root.querySelector('[data-fixture-control="plan"]');
      const queue = root.querySelector('[data-fixture-surface="queued-panel"]');
      const goal = root.querySelector('[data-fixture-surface="goal-panel"]');
      const inset = stack?.parentElement;
      const rows = [queue, goal].filter(Boolean);
      return {
        portalDirect: portal?.parentElement === root,
        componentDirect: component?.parentElement === root,
        utilityInComponent: Boolean(utility && component?.contains(utility)),
        progressInPortal: Boolean(progress && portal.contains(progress)),
        stackInPortal: Boolean(stack && portal.contains(stack)),
        progressInStack: Boolean(progress && stack?.contains(progress)),
        queueGoalSameParent: Boolean(queue && goal && queue.parentElement === goal.parentElement),
        insetCollapsed: inset
          ? inset.classList.contains('native-collapsed')
          : null,
        rowsUseCompactBorders: rows.length
          ? rows.every(row => (
              row.classList.contains('border-x') &&
              row.classList.contains('border-t')
            ))
          : null,
        rowsUseNativeTopCornerToken: rows.length
          ? rows.every(row => row.classList.contains('first:rounded-t-2xl'))
          : null,
        rowsUseLowerCornerToken: rows.length
          ? rows.some(row => [...row.classList].some(token => (
              token.includes('rounded-b') ||
              token.includes('rounded-bl') ||
              token.includes('rounded-br')
            )))
          : null,
        directStackOrder: stack
          ? [...stack.children].map(element => element.dataset.fixtureSurface)
          : []
      };
    });
    assert.equal(topology.portalDirect, true);
    assert.equal(topology.componentDirect, true);
    assert.equal(topology.utilityInComponent, true);
    assert.equal(topology.progressInPortal, expected.progress === 1);
    assert.equal(topology.stackInPortal, false);
    assert.equal(topology.progressInStack, false);
    assert.equal(
      topology.insetCollapsed,
      expected.stacks ? expected.collapsed ?? true : null
    );
    assert.equal(
      topology.rowsUseCompactBorders,
      expected.stacks ? expected.collapsed ?? true : null
    );
    assert.equal(
      topology.rowsUseNativeTopCornerToken,
      expected.stacks ? expected.collapsed ?? true : null
    );
    assert.equal(
      topology.rowsUseLowerCornerToken,
      expected.stacks ? false : null
    );
    assert.equal(
      topology.queueGoalSameParent,
      expected.name === 'guided' || expected.name === 'expanded-guided'
    );
    assert.deepEqual(
      topology.directStackOrder,
      expected.name === 'guided' || expected.name === 'expanded-guided'
        ? ['queued-panel', 'goal-panel']
        : expected.name === 'running'
          ? ['goal-panel']
          : []
    );
  }

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
    )?.classList.contains('forge-sidebar-selected') &&
    document.querySelector('[data-app-action-sidebar-project-row]')
      ?.classList.contains('forge-sidebar-selected')
  ));
  assert.equal(
    await page.locator('[data-app-action-sidebar-project-row].forge-sidebar-selected').count(),
    1
  );
  const selectedProjectPaint = await page.locator(
    '[data-app-action-sidebar-project-row].forge-sidebar-selected'
  ).evaluate(element => {
    const style = getComputedStyle(element);
    const descendantColors = [...element.querySelectorAll('span, svg, button')]
      .filter(child => {
        const rect = child.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          !child.closest('[data-native-status]')
        );
      })
      .map(child => getComputedStyle(child).color);
    return {
      backgroundImage: style.backgroundImage,
      color: style.color,
      shadow: style.boxShadow,
      descendantColors
    };
  });
  assert.match(selectedProjectPaint.backgroundImage, /data:image\//);
  assert.equal(selectedProjectPaint.color, 'rgb(47, 40, 34)');
  assert.ok(
    selectedProjectPaint.descendantColors.every(color => color === 'rgb(47, 40, 34)'),
    `selected project descendants did not switch to dark ink: ${
      selectedProjectPaint.descendantColors.join(', ')
    }`
  );
  assert.doesNotMatch(
    `${selectedProjectPaint.backgroundImage} ${selectedProjectPaint.shadow}`,
    /(?:157,\s*63,\s*38|133,\s*56,\s*35)/,
    'selected project retained the rejected lacquer-red left edge'
  );

  await page.evaluate(() => {
    document.querySelector('[data-app-action-sidebar-project-row]')
      .removeAttribute('aria-current');
    document.querySelector('[data-native-slot="new-task"]').setAttribute('aria-current', 'page');
  });
  await page.waitForFunction(() => (
    document.querySelector('[data-native-slot="new-task-row"]')
      ?.classList.contains('forge-sidebar-action-active')
  ));
  assert.equal(
    await page.locator('[data-native-slot="new-task-row"].forge-sidebar-selected').count(),
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

    const misplacedSubmit = liveSurface.querySelector(
      '[data-native-slot="composer-submit"]'
    ).cloneNode(true);
    misplacedSubmit.removeAttribute('data-native-slot');
    misplacedSubmit.dataset.fixtureControl = 'misplaced-native-submit';
    misplacedSubmit.setAttribute('aria-label', '发送');
    Object.assign(misplacedSubmit.style, {
      position: 'absolute',
      right: '8px',
      bottom: '8px',
      width: '28px',
      height: '28px'
    });
    liveSurface.querySelector('.composer-input-wrap').append(misplacedSubmit);

    const externalSubmit = document.createElement('button');
    externalSubmit.type = 'button';
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
  assert.equal(
    await page.locator(
      '[data-fixture-control="misplaced-native-submit"].forge-composer-submit'
    ).count(),
    0,
    'a native-signature button outside the official footer must not be themed as send'
  );
  assert.equal(
    await page.locator(
      '[data-native-slot="composer-submit"].forge-composer-submit'
    ).count(),
    1,
    'the final native footer control remains the only themed send button'
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
      '[data-native-slot="composer-fresh-visible"] ' +
      '[data-native-slot="composer-submit"].forge-composer-submit'
    ).count(),
    1
  );
  assert.equal(
    await page.locator('[data-fixture-control="external-submit"].forge-composer-submit').count(),
    0
  );
  assert.equal(
    await page.locator(
      '[data-fixture-control="misplaced-native-submit"].forge-composer-submit'
    ).count(),
    0
  );

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});

test('V15 keeps the native composer material while the editor is read-only', async () => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v15-readonly-composer.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v15-readonly-composer.test/');

  const before = await page.evaluate(() => {
    const editor = document.querySelector('.composer-surface-chrome .ProseMirror[role="textbox"]');
    const submit = document.querySelector(
      '.composer-surface-chrome [data-native-slot="composer-submit"]'
    );
    editor.setAttribute('contenteditable', 'false');
    editor.setAttribute('aria-readonly', 'true');
    submit.disabled = true;
    submit.setAttribute('aria-disabled', 'true');
    const rect = document.querySelector('.composer-surface-chrome').getBoundingClientRect();
    return {
      rect: [rect.x, rect.y, rect.width, rect.height],
      contenteditable: editor.getAttribute('contenteditable'),
      ariaReadonly: editor.getAttribute('aria-readonly'),
      disabled: submit.disabled,
      ariaDisabled: submit.getAttribute('aria-disabled')
    };
  });

  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelector('.composer-surface-chrome')
      ?.classList.contains('forge-composer-frame')
  ));

  const themed = await page.evaluate(() => {
    const frame = document.querySelector('.composer-surface-chrome');
    const editor = frame.querySelector('.ProseMirror[role="textbox"]');
    const submit = frame.querySelector('[data-native-slot="composer-submit"]');
    const rect = frame.getBoundingClientRect();
    return {
      rect: [rect.x, rect.y, rect.width, rect.height],
      backgroundImage: getComputedStyle(frame, '::before').backgroundImage,
      contenteditable: editor.getAttribute('contenteditable'),
      ariaReadonly: editor.getAttribute('aria-readonly'),
      disabled: submit.disabled,
      ariaDisabled: submit.getAttribute('aria-disabled')
    };
  });
  assert.deepEqual(
    [themed.rect[0], themed.rect[2]],
    [before.rect[0], before.rect[2]]
  );
  assert.ok(
    Math.abs(
      themed.rect[3] -
      expectedComposerHeight(themed.rect[2])
    ) <= 0.5
  );
  assert.match(themed.backgroundImage, /data:image\//);
  assert.deepEqual(
    {
      contenteditable: themed.contenteditable,
      ariaReadonly: themed.ariaReadonly,
      disabled: themed.disabled,
      ariaDisabled: themed.ariaDisabled
    },
    {
      contenteditable: before.contenteditable,
      ariaReadonly: before.ariaReadonly,
      disabled: before.disabled,
      ariaDisabled: before.ariaDisabled
    }
  );

  for (const editable of ['true', 'false', 'true']) {
    await page.evaluate(value => {
      document.querySelector('.composer-surface-chrome .ProseMirror[role="textbox"]')
        .setAttribute('contenteditable', value);
    }, editable);
    await page.waitForFunction(() => (
      document.querySelector('.composer-surface-chrome')
        ?.classList.contains('forge-composer-frame') &&
      document.querySelectorAll('.forge-composer-frame').length === 1
    ));
  }

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});

test('V17 keeps the official composer surface themed when the native editor signature changes', async () => {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: nativeUiBaseline.rendererDeviceScaleFactor
  });
  await page.route('http://wukong-v17-editor-signature.test/**', route => route.fulfill({
    body: runtimeFixtureHtml,
    contentType: 'text/html; charset=utf-8'
  }));
  await page.goto('http://wukong-v17-editor-signature.test/');

  const before = await page.evaluate(() => {
    const frame = document.querySelector('.composer-surface-chrome');
    const editor = frame.querySelector('.ProseMirror[role="textbox"]');
    editor.classList.remove('ProseMirror');
    editor.removeAttribute('role');
    editor.setAttribute('contenteditable', 'true');
    const rect = frame.getBoundingClientRect();
    return {
      rect: [rect.x, rect.y, rect.width, rect.height],
      contenteditable: editor.getAttribute('contenteditable'),
      role: editor.getAttribute('role')
    };
  });

  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelector('.composer-surface-chrome')
      ?.classList.contains('forge-composer-frame')
  ));

  const themed = await page.evaluate(() => {
    const frame = document.querySelector('.composer-surface-chrome');
    const editor = frame.querySelector('[contenteditable="true"]');
    const rect = frame.getBoundingClientRect();
    return {
      rect: [rect.x, rect.y, rect.width, rect.height],
      backgroundImage: getComputedStyle(frame, '::before').backgroundImage,
      contenteditable: editor.getAttribute('contenteditable'),
      role: editor.getAttribute('role')
    };
  });
  assert.deepEqual([themed.rect[0], themed.rect[2]], [before.rect[0], before.rect[2]]);
  assert.ok(
    Math.abs(
      themed.rect[3] -
      expectedComposerHeight(themed.rect[2])
    ) <= 0.5
  );
  assert.match(themed.backgroundImage, /data:image\//);
  assert.deepEqual(
    {
      contenteditable: themed.contenteditable,
      role: themed.role
    },
    {
      contenteditable: before.contenteditable,
      role: before.role
    }
  );

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});

test('V20 keeps the corrected composer ratio responsive while preserving surrounding native geometry', async () => {
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
    const after = await snapshot(page);
    assertRectsEqual(after, before, 0.25, composerGeometryNames);
    const expectedHeight = expectedComposerHeight(after.composer.rect[2]);
    assert.ok(
      Math.abs(after.composer.rect[3] - expectedHeight) <= 0.5,
      `composer ratio mismatch at ${width}px`
    );
    for (const name of ['add', 'access', 'model', 'voice', 'send']) {
      assert.deepEqual(
        after[name].rect.slice(2),
        before[name].rect.slice(2),
        `${name} native hit-box dimensions changed at ${width}px`
      );
    }
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
  await page.evaluate(() => {
    document.querySelector('[data-native-slot="menu-file"]').disabled = true;
    document.querySelector('[data-native-slot="menu-view"]')
      .setAttribute('aria-expanded', 'true');
    document.querySelector('[data-native-slot="menu-help"]').dataset.state = 'open';
    document.querySelector('[data-native-slot="new-task-menu"]').dataset.state = 'open';
    document.querySelector('[data-native-slot="plugins"]').disabled = true;
  });
  const before = await snapshot(page);
  await page.evaluate(expression);
  await page.waitForFunction(() => (
    document.querySelectorAll('.forge-topbar-menu-item').length === 4 &&
    document.querySelector('.forge-composer-frame')
  ));
  await page.locator(
    '[data-app-action-sidebar-project-row][aria-expanded="false"]'
  ).hover();
  await page.locator('[data-native-slot="project-active"]').focus();

  const forcedPaint = await page.evaluate(() => {
    const selector = [
      '.forge-composer-frame',
      '.forge-composer-context',
      '.forge-composer-panel-stack',
      '.forge-composer-panel',
      '.forge-composer-progress-pill',
      '.forge-plan-pill',
      '.forge-diff-summary',
      '.forge-composer-submit',
      '.forge-topbar-menu-item',
      '.forge-sidebar-shell',
      '.forge-sidebar-action',
      '.forge-sidebar-level1',
      '.forge-sidebar-level2',
      '.forge-sidebar-selected'
    ].join(',');
    return [...new Set(document.querySelectorAll(selector))].map((element, index) => {
      const style = getComputedStyle(element);
      return {
        selector: `${element.className}#${index}`,
        backgroundImage: style.backgroundImage,
        boxShadow: style.boxShadow,
        color: style.color,
        opacity: style.opacity,
        clipPath: style.clipPath,
        forcedColorAdjust: style.forcedColorAdjust
      };
    });
  });
  for (const paint of forcedPaint) {
    assert.equal(paint.backgroundImage, 'none', `${paint.selector} retained a bitmap`);
    assert.equal(paint.boxShadow, 'none', `${paint.selector} retained a decorative shadow`);
    assert.notEqual(paint.color, 'rgba(0, 0, 0, 0)', `${paint.selector} lost readable text`);
    assert.equal(paint.opacity, '1', `${paint.selector} retained theme opacity`);
    assert.equal(paint.clipPath, 'none', `${paint.selector} retained a theme clip path`);
    assert.equal(paint.forcedColorAdjust, 'auto', `${paint.selector} blocks system colors`);
  }
  assert.notEqual(
    await page.locator('[data-native-slot="project-active"]').evaluate(
      element => getComputedStyle(element).outlineStyle
    ),
    'none',
    'forced-colors focus must return to the system outline'
  );
  assertRectsEqual(
    await snapshot(page),
    before,
    0.25,
    composerGeometryNames
  );

  await page.evaluate(RESTORE_EXPRESSION);
  assert.equal(await page.locator('[data-forge-mark]').count(), 0);
  await page.close();
});
