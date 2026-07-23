import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import {
  ACTIVE_PROBE_EXPRESSION,
  isActiveThemeState,
  isNativeThemeState,
  makeApplyExpression,
  RESTORE_EXPRESSION,
  THEME_STATE_EXPRESSION
} from '../runtime/injection-plan-v13.mjs';
import {
  runtimeFixtureHtml,
  enterThreadState,
  geometry,
  conversationGeometry,
  conversationText
} from './runtime-fixture.mjs';

const styleSheet = fs.readFileSync(new URL('../runtime/forge-background-v13.css', import.meta.url), 'utf8');
const tinyScene = index => {
  const color = ['8b5e3c', '634e3e', '8a703e', '7b2929', '245868', '243c66', '55463c', '30483d', '365641', '55534f', '75463b'][index];
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='18'%3E%3Crect width='32' height='18' fill='%23${color}'/%3E%3Ctext x='3' y='13' fill='white'%3E${index}%3C/text%3E%3C/svg%3E")`;
};
const variables = [
  ':root.forge-ink-mountain{',
  '--forge-paper:#101210;',
  '--forge-scene-count:11;',
  '--forge-battle-scenes:0 1 2 3 4 5;',
  '--forge-battle-primary-scenes:0 1 2;',
  '--forge-battle-secondary-scenes:3 4 5;',
  '--forge-scenery-scenes:6 7 8 9 10;',
  ...Array.from({ length: 11 }, (_, index) => (
    `--forge-bg-${index}:${tinyScene(index)};--forge-position-${index}:${index === 0 ? '68% center' : 'center center'};`
  )),
  '}',
  ...Array.from({ length: 11 }, (_, index) => (
    `:root.forge-ink-mountain[data-forge-scene="${index}"]{--forge-scene-brightness:1;` +
    `--forge-scene-veil:linear-gradient(rgba(12,14,13,.3),rgba(12,14,13,.3));}`
  ))
].join('');
const expression = makeApplyExpression({ styleSheet, variables });
let browser;
let browserServer;

test.before(async () => {
  browserServer = await chromium.launchServer({ headless: true });
  browser = await chromium.connect(browserServer.wsEndpoint());
});

test.after(async () => {
  await browser?.close();
  await browserServer?.kill();
});

const nativeSurfaceStyle = page => page.evaluate(() => {
  const read = selector => {
    const style = getComputedStyle(document.querySelector(selector));
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      clipPath: style.clipPath,
      color: style.color,
      height: style.height,
      padding: style.padding,
      width: style.width
    };
  };
  return {
    topbar: read('.application-menu'),
    sidebar: read('.app-shell-left-panel'),
    sidebarButton: read('.sidebar-row'),
    composer: read('.composer-surface-chrome'),
    send: read('.send'),
    environment: read('.summary-panel-card')
  };
});

const installLanding = page => page.evaluate(() => {
  document.querySelector('[data-thread-find-target="conversation"]')?.remove();
  if (!document.querySelector('.landing-native')) {
    const landing = document.createElement('section');
    landing.className = 'landing-native';
    landing.innerHTML = `
      <div class="landing-hero">
        <small>新建任务</small>
        <div data-testid="home-icon" aria-hidden="true" style="position:relative;width:56px;height:56px;margin:0 auto 12px">
          <svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="13"/></svg>
        </div>
        <h1 class="heading-xl" data-feature="game-source"><span>今天想处理什么？</span></h1>
        <p>描述目标，Codex 会在当前项目中开始工作。</p>
      </div>`;
    document.querySelector('.route-host').insertBefore(landing, document.querySelector('.thread-summary-layer'));
  }
});

const waitForRuntime = (page, predicate, argument) => page.waitForFunction(
  ({ source, value }) => {
    const runtime = window.__wukongCodexForgeRuntimeV13;
    if (!runtime) return false;
    if (source === 'scene') return runtime.currentScene === value && !runtime.transitionInFlight;
    if (source === 'transition') return runtime.currentScene === value && runtime.transitionInFlight;
    if (source === 'surface') return document.documentElement.dataset.forgeSurface === value;
    return false;
  },
  { source: predicate, value: argument },
  { timeout: 5000 }
);

test('V13 keeps native UI intact, crossfades decoded scenes, repairs its overlay, and reaches refresh quiescence', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route('http://wukong.test/**', route => route.fulfill({ body: runtimeFixtureHtml, contentType: 'text/html' }));
  await page.goto('http://wukong.test/');
  await page.evaluate(() => sessionStorage.setItem(
    'wukong-forge-scene-cursors-v13',
    JSON.stringify({ battle: -6, scenery: 'broken' })
  ));
  await page.evaluate(() => {
    const NativeImage = window.Image;
    window.__forgePreloadImages = [];
    window.Image = class ForgeAuditedImage extends NativeImage {
      constructor(...args) {
        super(...args);
        window.__forgePreloadImages.push(this);
      }
    };
  });

  const beforeGeometry = await geometry(page);
  const beforeStyle = await nativeSurfaceStyle(page);
  const beforeText = await page.locator('body').innerText();
  const beforeBodyChildren = await page.locator('body > *').count();
  const beforeLandingGeometry = await page.evaluate(() => {
    const read = selector => {
      const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      icon: read('[data-testid="home-icon"]'),
      title: read('[data-feature="game-source"]'),
      titleText: document.querySelector('[data-feature="game-source"]').textContent.trim()
    };
  });

  await page.evaluate(expression);
  const activeState = await page.evaluate(THEME_STATE_EXPRESSION);
  assert.equal(isActiveThemeState(activeState), true);
  assert.equal(await page.evaluate(ACTIVE_PROBE_EXPRESSION), true);
  assert.equal(activeState.surface, 'landing');
  assert.equal(activeState.mode, 'battle');
  assert.equal(activeState.scene, '0');
  assert.equal(activeState.backgroundActiveImage, 'var(--forge-bg-0)');
  assert.equal(activeState.backgroundLoadedLayerCount, 1);
  assert.equal(activeState.backgroundTransitioning, false);
  assert.equal(activeState.preloadInFlight, 0);
  assert.equal(await page.evaluate(() => window.__forgePreloadImages.length), 0);
  assert.deepEqual(await geometry(page), beforeGeometry);
  assert.deepEqual(await nativeSurfaceStyle(page), beforeStyle);
  assert.equal(await page.locator('body').innerText(), beforeText);
  assert.equal(await page.locator('body > *').count(), beforeBodyChildren + 1);
  assert.equal(await page.locator('.forge-workspace').count(), 1);
  assert.equal(await page.locator('.forge-landing-title').count(), 1);
  assert.equal(await page.locator('.forge-landing-icon').count(), 1);
  assert.equal(await page.locator('.forge-composer,.forge-input,.forge-sidebar,.forge-right-card,.forge-button').count(), 0);

  const background = await page.evaluate(() => {
    const overlay = document.getElementById('wukong-forge-background');
    const active = overlay.querySelector('[data-forge-background-layer][data-forge-active="true"]');
    const image = active.querySelector('[data-forge-background-image]');
    return {
      position: getComputedStyle(overlay).position,
      inset: getComputedStyle(overlay).inset,
      pointerEvents: getComputedStyle(overlay).pointerEvents,
      transitionDuration: getComputedStyle(active).transitionDuration,
      backgroundSize: getComputedStyle(image).backgroundSize,
      backgroundPosition: getComputedStyle(image).backgroundPosition,
      filter: getComputedStyle(image).filter,
      transform: getComputedStyle(image).transform,
      willChange: getComputedStyle(active).willChange,
      bodyIsolation: getComputedStyle(document.body).isolation,
      mainBackground: getComputedStyle(document.querySelector('main.main-surface')).backgroundColor,
      mainBackgroundImage: getComputedStyle(document.querySelector('main.main-surface')).backgroundImage,
      topFadeBackgroundImage: getComputedStyle(document.querySelector('[data-app-shell-main-content-top-fade]')).backgroundImage
    };
  });
  assert.equal(background.position, 'fixed');
  assert.equal(background.inset, '0px');
  assert.equal(background.pointerEvents, 'none');
  assert.equal(background.transitionDuration, '0.82s');
  assert.equal(background.backgroundSize, 'cover');
  assert.equal(background.backgroundPosition, '68% 50%');
  assert.equal(background.filter, 'none');
  assert.equal(background.transform, 'none');
  assert.equal(background.willChange, 'auto');
  assert.equal(background.bodyIsolation, 'auto');
  assert.equal(background.mainBackground, 'rgba(0, 0, 0, 0)');
  assert.equal(background.mainBackgroundImage, 'none');
  assert.equal(background.topFadeBackgroundImage, 'none');

  const landingSkin = await page.evaluate(() => {
    const title = document.querySelector('.forge-landing-title');
    const icon = document.querySelector('.forge-landing-icon');
    const readRect = element => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      titleCopy: title.dataset.forgeTitleCopy,
      titleAria: title.getAttribute('aria-label'),
      titlePseudo: getComputedStyle(title, '::after').content,
      iconPseudo: getComputedStyle(icon, '::before').backgroundImage,
      iconRect: readRect(icon),
      titleRect: readRect(title),
      nativeText: title.textContent.trim()
    };
  });
  assert.equal(landingSkin.titleCopy, '此去，欲破何局？');
  assert.equal(landingSkin.titleAria, '此去，欲破何局？');
  assert.match(landingSkin.titlePseudo, /此去，欲破何局/);
  assert.match(landingSkin.iconPseudo, /data:image\/svg\+xml/);
  assert.deepEqual(landingSkin.iconRect, beforeLandingGeometry.icon);
  assert.deepEqual(landingSkin.titleRect, beforeLandingGeometry.title);
  assert.equal(landingSkin.nativeText, beforeLandingGeometry.titleText);

  await page.waitForTimeout(900);
  const settledRefreshCount = await page.evaluate(() => window.__wukongCodexForgeRuntimeV13.refreshCount);
  await page.waitForTimeout(1300);
  assert.equal(
    await page.evaluate(() => window.__wukongCodexForgeRuntimeV13.refreshCount),
    settledRefreshCount,
    'ResizeObserver kept refreshing a stable layout'
  );

  const battleScene = await page.locator('html').getAttribute('data-forge-scene');
  await page.locator('.sidebar-row').nth(1).click();
  await page.waitForTimeout(650);
  assert.equal(await page.locator('html').getAttribute('data-forge-scene'), battleScene);

  const authored = await enterThreadState(page);
  await waitForRuntime(page, 'transition', 6);
  const transitionState = await page.evaluate(THEME_STATE_EXPRESSION);
  assert.equal(transitionState.backgroundLoadedLayerCount, 2);
  assert.equal(transitionState.backgroundTransitioning, true);
  assert.equal(transitionState.preloadInFlight, 0);
  assert.equal(await page.evaluate(() => window.__forgePreloadImages.length), 1);
  assert.ok(
    await page.locator('[data-forge-background-layer]').evaluateAll(layers => (
      layers.every(layer => getComputedStyle(layer).willChange === 'opacity')
    ))
  );
  await page.waitForTimeout(360);
  const midpoint = await page.locator('[data-forge-background-layer]').evaluateAll(layers => (
    layers.map(layer => Number.parseFloat(getComputedStyle(layer).opacity))
  ));
  assert.ok(midpoint.every(opacity => opacity > .03 && opacity < .97), `invalid midpoint ${midpoint}`);
  assert.ok(Math.abs(midpoint[0] + midpoint[1] - 1) < .12, `alpha sum drifted: ${midpoint}`);
  await waitForRuntime(page, 'scene', 6);
  const settledBackgroundState = await page.evaluate(THEME_STATE_EXPRESSION);
  assert.equal(settledBackgroundState.backgroundLoadedLayerCount, 1);
  assert.equal(settledBackgroundState.backgroundTransitioning, false);
  assert.equal(settledBackgroundState.preloadInFlight, 0);
  const settledLayers = await page.locator('[data-forge-background-layer]').evaluateAll(layers => (
    layers.map(layer => ({
      active: layer.dataset.forgeActive,
      background: layer.querySelector('[data-forge-background-image]').style.backgroundImage,
      veil: layer.querySelector('[data-forge-background-veil]').style.backgroundImage,
      willChange: getComputedStyle(layer).willChange
    }))
  ));
  assert.deepEqual(
    settledLayers[0],
    { active: 'false', background: 'none', veil: 'none', willChange: 'auto' }
  );
  assert.equal(settledLayers[1].active, 'true');
  assert.equal(settledLayers[1].background, 'var(--forge-bg-6)');
  assert.match(settledLayers[1].veil, /linear-gradient/);
  assert.equal(settledLayers[1].willChange, 'auto');
  assert.deepEqual(
    await page.evaluate(() => window.__forgePreloadImages.map(image => ({
      onload: image.onload,
      onerror: image.onerror,
      srcAttribute: image.getAttribute('src')
    }))),
    [{ onload: null, onerror: null, srcAttribute: '' }]
  );
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), 'scenery');
  assert.equal(await page.locator('html').getAttribute('data-forge-scene'), '6');
  assert.deepEqual(await geometry(page), beforeGeometry);
  assert.deepEqual(await nativeSurfaceStyle(page), beforeStyle);
  assert.deepEqual(await conversationGeometry(page), authored.geometry);
  assert.equal(await conversationText(page), authored.text);
  assert.equal(await page.locator('.forge-landing-title,.forge-landing-icon,.forge-landing-hero').count(), 0);

  await page.locator('#wukong-forge-background').evaluate(element => element.remove());
  await page.waitForFunction(() => {
    const overlay = document.getElementById('wukong-forge-background');
    const active = overlay?.querySelector('[data-forge-background-layer][data-forge-active="true"]');
    return overlay?.querySelectorAll(':scope > [data-forge-background-layer]').length === 2 &&
      Boolean(active?.querySelector('[data-forge-background-image]')?.style.backgroundImage);
  }, null, { timeout: 5000 });
  assert.equal(await page.evaluate(ACTIVE_PROBE_EXPRESSION), true);

  assert.equal(await page.evaluate(() => {
    const button = document.querySelector('[data-native-slot="new-task"]');
    button?.click();
    return Boolean(button);
  }), true);
  await installLanding(page);
  await page.evaluate(() => {
    const stale = document.createElement('section');
    stale.dataset.threadFindTarget = 'conversation';
    stale.style.opacity = '0';
    stale.innerHTML = '<div data-virtualized-turn-content>stale hidden turn</div>';
    document.querySelector('.route-host').append(stale);
  });
  await waitForRuntime(page, 'scene', 1);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');
  assert.equal(await page.locator('html').getAttribute('data-forge-mode'), 'battle');

  await page.evaluate(RESTORE_EXPRESSION);
  const nativeState = await page.evaluate(THEME_STATE_EXPRESSION);
  assert.equal(isNativeThemeState(nativeState), true);
  assert.equal(await page.locator('#wukong-forge-background').count(), 0);
  assert.deepEqual(await nativeSurfaceStyle(page), beforeStyle);
  assert.equal(await page.locator('[data-forge-title-copy],[data-forge-original-aria-label]').count(), 0);
});

test('V13 skins a delayed animated home hero without waiting for a resize', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  await page.route('http://wukong-delayed-hero.test/**', route => route.fulfill({ body: runtimeFixtureHtml, contentType: 'text/html' }));
  await page.goto('http://wukong-delayed-hero.test/');
  await page.evaluate(() => document.querySelector('.landing-native')?.remove());
  await page.evaluate(expression);
  await page.evaluate(() => {
    const landing = document.createElement('section');
    landing.className = 'landing-native';
    landing.style.opacity = '0';
    landing.innerHTML = `
      <div class="landing-hero">
        <div data-testid="home-icon" aria-hidden="true" style="position:relative;width:56px;height:56px;margin:0 auto 12px">
          <svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="13"/></svg>
        </div>
        <div class="heading-xl" data-feature="game-source">
          <span>我们该构建什么<button style="color:rgb(220,220,220);text-decoration:underline dotted rgb(220,220,220);border-bottom:1px solid rgb(220,220,220)">项目</button>？</span>
        </div>
      </div>`;
    document.querySelector('.route-host').prepend(landing);
  });

  await page.waitForFunction(() => (
    document.querySelector('[data-feature="game-source"]')?.classList.contains('forge-landing-title') &&
    document.querySelector('[data-testid="home-icon"]')?.classList.contains('forge-landing-icon')
  ), null, { timeout: 3000 });

  const skin = await page.evaluate(() => {
    const title = document.querySelector('.forge-landing-title');
    const button = title.querySelector('button');
    return {
      titleCopy: title.dataset.forgeTitleCopy,
      titlePseudo: getComputedStyle(title, '::after').content,
      iconPseudo: getComputedStyle(document.querySelector('.forge-landing-icon'), '::before').backgroundImage,
      nativeDecorationLine: getComputedStyle(button).textDecorationLine,
      nativeDecorationColor: getComputedStyle(button).textDecorationColor,
      nativeBorderBottomColor: getComputedStyle(button).borderBottomColor,
      refreshCount: window.__wukongCodexForgeRuntimeV13.refreshCount
    };
  });
  assert.equal(skin.titleCopy, '此去，欲破何局？');
  assert.match(skin.titlePseudo, /此去，欲破何局/);
  assert.match(skin.iconPseudo, /data:image\/svg\+xml/);
  assert.equal(skin.nativeDecorationLine, 'none');
  assert.equal(skin.nativeDecorationColor, 'rgba(0, 0, 0, 0)');
  assert.equal(skin.nativeBorderBottomColor, 'rgba(0, 0, 0, 0)');
  assert.ok(skin.refreshCount >= 2);

  /*
   * React may write its own className again after the 280 ms hero animation.
   * Theme paint must stay anchored to owned data attributes, not to classes
   * React can legitimately replace.
   */
  await page.waitForTimeout(900);
  const afterReactClassCommit = await page.evaluate(() => {
    const title = document.querySelector('[data-feature="game-source"]');
    const icon = document.querySelector('[data-testid="home-icon"]');
    title.className = 'heading-xl';
    icon.className = '';
    const button = title.querySelector('button');
    return {
      titleCopy: title.dataset.forgeTitleCopy,
      titlePseudo: getComputedStyle(title, '::after').content,
      iconPseudo: getComputedStyle(icon, '::before').backgroundImage,
      nativeDecorationLine: getComputedStyle(button).textDecorationLine,
      nativeBorderBottomColor: getComputedStyle(button).borderBottomColor
    };
  });
  assert.equal(afterReactClassCommit.titleCopy, '此去，欲破何局？');
  assert.match(afterReactClassCommit.titlePseudo, /此去，欲破何局/);
  assert.match(afterReactClassCommit.iconPseudo, /data:image\/svg\+xml/);
  assert.equal(afterReactClassCommit.nativeDecorationLine, 'none');
  assert.equal(afterReactClassCommit.nativeBorderBottomColor, 'rgba(0, 0, 0, 0)');

  await page.evaluate(() => {
    document.querySelector('.landing-native').style.opacity = '1';
  });
  assert.equal(await page.locator('[data-forge-title-copy]').isVisible(), true);

  await page.evaluate(RESTORE_EXPRESSION);
  const restored = await page.evaluate(() => {
    const title = document.querySelector('[data-feature="game-source"]');
    const icon = document.querySelector('[data-testid="home-icon"]');
    const button = title.querySelector('button');
    return {
      titleCopy: title.dataset.forgeTitleCopy || null,
      titlePseudo: getComputedStyle(title, '::after').content,
      iconPseudo: getComputedStyle(icon, '::before').content,
      nativeDecorationLine: getComputedStyle(button).textDecorationLine,
      nativeBorderBottomColor: getComputedStyle(button).borderBottomColor
    };
  });
  assert.equal(restored.titleCopy, null);
  assert.equal(restored.titlePseudo, 'none');
  assert.equal(restored.iconPseudo, 'none');
  assert.equal(restored.nativeDecorationLine, 'underline');
  assert.equal(restored.nativeBorderBottomColor, 'rgb(220, 220, 220)');
});

test('V13 rotates six battle and five scenery scenes in independent pools without motion', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 }, reducedMotion: 'reduce' });
  await page.route('http://wukong-rotation.test/**', route => route.fulfill({ body: runtimeFixtureHtml, contentType: 'text/html' }));
  await page.goto('http://wukong-rotation.test/');
  await page.evaluate(expression);

  const battleScenes = ['0'];
  const sceneryScenes = [];
  for (let index = 0; index < 5; index += 1) {
    await enterThreadState(page);
    await waitForRuntime(page, 'scene', 6 + index);
    sceneryScenes.push(await page.locator('html').getAttribute('data-forge-scene'));

    assert.equal(await page.evaluate(() => {
      const button = document.querySelector('[data-native-slot="new-task"]');
      button?.click();
      return Boolean(button);
    }), true);
    await installLanding(page);
    await waitForRuntime(page, 'scene', 1 + index);
    battleScenes.push(await page.locator('html').getAttribute('data-forge-scene'));
  }

  assert.deepEqual(battleScenes, ['0', '1', '2', '3', '4', '5']);
  assert.deepEqual(sceneryScenes, ['6', '7', '8', '9', '10']);
  assert.equal(new Set(battleScenes).size, 6);
  assert.equal(new Set(sceneryScenes).size, 5);
  assert.ok(
    await page.locator('[data-forge-background-layer]').evaluateAll(layers => (
      layers.every(layer => getComputedStyle(layer).transitionDuration === '0s')
    ))
  );
  assert.equal((await page.evaluate(THEME_STATE_EXPRESSION)).backgroundLoadedLayerCount, 1);
});

test('V13 bounds pending background decoding to one request and cancels it on replacement and restore', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  await page.route('http://wukong-loader.test/**', route => route.fulfill({ body: runtimeFixtureHtml, contentType: 'text/html' }));
  await page.goto('http://wukong-loader.test/');
  await page.evaluate(() => {
    window.__forgeFakeImages = [];
    window.Image = class ForgeHangingImage {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this.complete = false;
        this.naturalWidth = 0;
        this.canceled = false;
        this._src = '';
        window.__forgeFakeImages.push(this);
      }
      set src(value) {
        this._src = value;
        if (value === '') this.canceled = true;
      }
      get src() {
        return this._src;
      }
      decode() {
        return Promise.resolve();
      }
    };
  });
  await page.evaluate(expression);
  assert.equal((await page.evaluate(THEME_STATE_EXPRESSION)).preloadInFlight, 0);

  await enterThreadState(page);
  await waitForRuntime(page, 'surface', 'thread');
  assert.equal((await page.evaluate(THEME_STATE_EXPRESSION)).preloadInFlight, 1);
  assert.equal(await page.evaluate(() => window.__forgeFakeImages.length), 1);

  await page.evaluate(() => document.querySelector('[data-native-slot="new-task"]')?.click());
  await installLanding(page);
  await waitForRuntime(page, 'surface', 'landing');
  assert.equal((await page.evaluate(THEME_STATE_EXPRESSION)).preloadInFlight, 1);
  assert.equal(await page.evaluate(() => window.__forgeFakeImages.length), 2);
  assert.equal(await page.evaluate(() => window.__forgeFakeImages[0].canceled), true);

  await enterThreadState(page);
  await waitForRuntime(page, 'surface', 'thread');
  assert.equal((await page.evaluate(THEME_STATE_EXPRESSION)).preloadInFlight, 1);
  assert.equal(await page.evaluate(() => window.__forgeFakeImages.length), 3);
  assert.equal(await page.evaluate(() => window.__forgeFakeImages[1].canceled), true);

  await page.evaluate(() => {
    window.__retiredForgeRuntime = window.__wukongCodexForgeRuntimeV13;
  });
  await page.evaluate(RESTORE_EXPRESSION);
  assert.deepEqual(
    await page.evaluate(() => ({
      pending: window.__retiredForgeRuntime.preloadRequests.size,
      images: window.__forgeFakeImages.map(image => ({
        canceled: image.canceled,
        onload: image.onload,
        onerror: image.onerror
      }))
    })),
    {
      pending: 0,
      images: [
        { canceled: true, onload: null, onerror: null },
        { canceled: true, onload: null, onerror: null },
        { canceled: true, onload: null, onerror: null }
      ]
    }
  );
});

test('V13 keeps its background inert in forced-colors mode and its scene-zero veil wins appended variables', async () => {
  assert.match(styleSheet, /html:root\.forge-ink-mountain\[data-forge-scene="0"\]/);
  const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
  await page.setContent(runtimeFixtureHtml);
  await page.evaluate(expression);
  const veil = await page.locator('html').evaluate(element => (
    getComputedStyle(element).getPropertyValue('--forge-scene-veil')
  ));
  assert.match(veil, /rgba\(13, 15, 14, (?:0)?\.79\)/);
  await page.emulateMedia({ forcedColors: 'active' });
  assert.equal(
    await page.locator('#wukong-forge-background').evaluate(element => getComputedStyle(element).display),
    'none'
  );
});
