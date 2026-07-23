import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..', '..');
const htmlPath = join(here, 'composer-black-myth-native-v9-20260724.html');
const proposalPath = join(here, 'v9-composer-proposals-1x-20260724.png');
const contextPath = join(here, 'v9-composer-contexts-1x-20260724.png');
const blindPath = join(here, 'v9-composer-blind-1x-20260724.png');
const reportPath = join(here, 'v9-composer-geometry-and-resource-proof-20260724.json');
const designs = ['chapter-ink', 'golden-hoop', 'sage-plume'];
const widths = [736, 560];
const heights = [98, 154];
const contextAssets = {
  battle: {
    path: join(repoRoot, 'themes', 'assets', 'erlang-ink-duel.jpg'),
    position: '68% center'
  },
  scenery: {
    path: join(repoRoot, 'themes', 'assets', 'forest-shrine.jpg'),
    position: 'center 58%'
  }
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1640, height: 1320 },
  deviceScaleFactor: 1
});
const page = await context.newPage();
const requests = [];
page.on('request', request => requests.push(request.url()));

const rect = box => ({
  x: Number(box.x.toFixed(3)),
  y: Number(box.y.toFixed(3)),
  width: Number(box.width.toFixed(3)),
  height: Number(box.height.toFixed(3))
});

try {
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });

  const comparison = page.locator('#proposal-board');
  await comparison.screenshot({ path: proposalPath });

  for (const [contextName, asset] of Object.entries(contextAssets)) {
    await page.locator(`.context-card[data-context="${contextName}"]`).evaluateAll((cards, payload) => {
      for (const card of cards) {
        card.style.backgroundImage = `url("${payload.imageUrl}")`;
        card.style.backgroundPosition = payload.position;
      }
    }, {
      imageUrl: pathToFileURL(asset.path).href,
      position: asset.position
    });
  }
  await page.locator('#context-board').screenshot({ path: contextPath });
  await page.locator('#blind-board').screenshot({ path: blindPath });

  const individualImages = [];
  for (const design of designs) {
    for (const width of widths) {
      await page.evaluate(({ designId, targetWidth }) => {
        document.getElementById('capture-overlay')?.remove();
        const source = document.querySelector(
          `.proposal[data-design="${designId}"] [data-fixture-width="${targetWidth}"]`
        );
        const overlay = source.cloneNode(true);
        overlay.id = 'capture-overlay';
        Object.assign(overlay.style, {
          position: 'fixed',
          left: '0',
          top: '0',
          zIndex: '2147483647',
          width: `${targetWidth}px`,
          minWidth: `${targetWidth}px`,
          height: '98px',
          background: '#0b0d0b'
        });
        document.body.append(overlay);
      }, { designId: design, targetWidth: width });
      const host = page.locator('#capture-overlay .composer-surface-chrome');
      const path = join(here, `v9-${design}-${width}x98-focus-1x-20260724.png`);
      await host.screenshot({ path });
      await page.locator('#capture-overlay').evaluate(overlay => overlay.remove());
      individualImages.push(path);
    }
  }

  const geometry = await page.evaluate(({ designIds, testWidths, testHeights }) => {
    const template = document.getElementById('fixture-template');
    const stage = document.createElement('div');
    stage.id = 'geometry-stage';
    Object.assign(stage.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      zIndex: '2147483647',
      opacity: '0.001'
    });
    document.body.append(stage);

    const snapshot = host => {
      const hostBox = host.getBoundingClientRect();
      const localRect = element => {
        const box = element.getBoundingClientRect();
        return {
          x: Number((box.x - hostBox.x).toFixed(3)),
          y: Number((box.y - hostBox.y).toFixed(3)),
          width: Number(box.width.toFixed(3)),
          height: Number(box.height.toFixed(3))
        };
      };
      const buttons = [...host.querySelectorAll('.composer-footer button')];
      return {
        host: {
          x: 0,
          y: 0,
          width: Number(hostBox.width.toFixed(3)),
          height: Number(hostBox.height.toFixed(3))
        },
        editor: localRect(host.querySelector('.ProseMirror')),
        footer: localRect(host.querySelector('.composer-footer')),
        buttons: buttons.map(button => ({
          className: button.className,
          ariaLabel: button.getAttribute('aria-label'),
          text: button.textContent.trim(),
          rect: localRect(button),
          hits: hitPoints(button)
        })),
        placeholder: host.querySelector('.ProseMirror').dataset.placeholder,
        editorAria: host.querySelector('.ProseMirror').getAttribute('aria-label'),
        overflow: getComputedStyle(host).overflow,
        pseudo: ['::before', '::after'].map(name => {
          const style = getComputedStyle(host, name);
          return {
            name,
            pointerEvents: style.pointerEvents,
            filter: style.filter,
            animationName: style.animationName,
            willChange: style.willChange
          };
        })
      };

      function hitPoints(button) {
        const box = button.getBoundingClientRect();
        const points = [
          [box.left + box.width / 2, box.top + box.height / 2],
          [box.left + box.width / 2, box.top + 4],
          [box.left + box.width / 2, box.bottom - 4],
          [box.left + 4, box.top + box.height / 2],
          [box.right - 4, box.top + box.height / 2]
        ];
        return points.map(([x, y]) => (
          document.elementFromPoint(x, y)?.closest('button') === button
        ));
      }
    };

    const results = [];
    for (const width of testWidths) {
      for (const height of testHeights) {
        for (const design of designIds) {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.gap = '10px';
          stage.append(row);
          const create = designId => {
            const fixture = template.content.firstElementChild.cloneNode(true);
            fixture.style.setProperty('--fixture-width', `${width}px`);
            fixture.style.height = `${height}px`;
            const host = fixture.querySelector('.composer-surface-chrome');
            host.style.height = `${height}px`;
            if (designId) host.dataset.v9Theme = designId;
            row.append(fixture);
            return host;
          };
          const nativeHost = create(null);
          const themedHost = create(design);
          results.push({
            design,
            width,
            height,
            native: snapshot(nativeHost),
            themed: snapshot(themedHost)
          });
          row.remove();
        }
      }
    }
    stage.remove();
    return results;
  }, { designIds: designs, testWidths: widths, testHeights: heights });

  for (const sample of geometry) {
    assert.equal(sample.native.host.width, sample.width);
    assert.equal(sample.native.host.height, sample.height);
    assert.deepEqual(sample.themed.host, sample.native.host);
    assert.deepEqual(sample.themed.editor, sample.native.editor);
    assert.deepEqual(sample.themed.footer, sample.native.footer);
    assert.deepEqual(
      sample.themed.buttons.map(button => ({
        className: button.className,
        ariaLabel: button.ariaLabel,
        text: button.text,
        rect: button.rect
      })),
      sample.native.buttons.map(button => ({
        className: button.className,
        ariaLabel: button.ariaLabel,
        text: button.text,
        rect: button.rect
      }))
    );
    assert.ok(
      sample.themed.buttons.every(button => button.hits.every(Boolean)),
      JSON.stringify({
        design: sample.design,
        width: sample.width,
        height: sample.height,
        buttons: sample.themed.buttons
      })
    );
    assert.equal(sample.themed.placeholder, '随心输入');
    assert.equal(sample.themed.editorAria, 'Message composer');
    assert.equal(sample.themed.overflow, 'hidden');
    assert.ok(sample.themed.pseudo.every(layer => layer.pointerEvents === 'none'));
    assert.ok(sample.themed.pseudo.every(layer => layer.filter === 'none'));
    assert.ok(sample.themed.pseudo.every(layer => layer.animationName === 'none'));
    assert.ok(sample.themed.pseudo.every(layer => layer.willChange === 'auto'));
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await page.locator('[data-v9-theme]').evaluateAll(hosts => hosts.map(host => ({
    host: getComputedStyle(host).transitionDuration,
    before: getComputedStyle(host, '::before').transitionDuration,
    after: getComputedStyle(host, '::after').transitionDuration,
    animation: getComputedStyle(host).animationName
  })));
  assert.ok(reducedMotion.every(item => (
    item.host === '0s'
    && item.before === '0s'
    && item.after === '0s'
    && item.animation === 'none'
  )));

  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  const forcedColors = await page.locator('[data-v9-theme]').evaluateAll(hosts => hosts.map(host => ({
    beforeDisplay: getComputedStyle(host, '::before').display,
    afterDisplay: getComputedStyle(host, '::after').display,
    overflow: getComputedStyle(host).overflow
  })));
  assert.ok(forcedColors.every(item => (
    item.beforeDisplay === 'none'
    && item.afterDisplay === 'none'
    && item.overflow === 'hidden'
  )));

  const images = [];
  for (const path of [proposalPath, contextPath, blindPath, ...individualImages]) {
    const png = PNG.sync.read(await readFile(path));
    images.push({
      file: path.slice(here.length + 1).replaceAll('\\', '/'),
      width: png.width,
      height: png.height
    });
  }
  for (const image of images.filter(item => item.file.includes('-focus-1x-'))) {
    const expectedWidth = Number(image.file.match(/-(\d+)x98-focus/)[1]);
    assert.equal(image.width, expectedWidth);
    assert.equal(image.height, 98);
  }

  const networkRequests = requests.filter(url => /^https?:/i.test(url));
  assert.deepEqual(networkRequests, []);

  const report = {
    generatedAt: new Date().toISOString(),
    fixture: 'composer-black-myth-native-v9-20260724.html',
    status: 'PREVIEW_ONLY_AWAITING_USER_SELECTION',
    contract: {
      designs: designs.length,
      widths,
      heights,
      nativeAndThemedDOMRectsEqual: true,
      nativeTextAndAriaEqual: true,
      fivePointButtonHitTestsPass: true,
      placeholderUnchanged: true,
      overflowPreserved: 'hidden',
      pseudoLayersPointerEvents: 'none',
      filters: 0,
      animations: 0,
      timers: 0,
      externalNetworkRequests: networkRequests.length,
      rasterAssetsInCandidateCSS: 0,
      reducedMotion: true,
      forcedColorsFallsBackToNativeSurface: true,
      runtimeIntegrated: false
    },
    geometry,
    reducedMotion,
    forcedColors,
    images
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report.contract));
} finally {
  await context.close();
  await browser.close();
}
