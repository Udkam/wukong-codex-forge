import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { chromium } from '@playwright/test';
import { makeTheme, cssFor } from '../shared/theme-model.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from '../runtime/injection-plan.mjs';

const averageLuminance = (png, box) => {
  let total = 0;
  let count = 0;
  for (let y = box.y; y < box.y + box.height; y += 8) {
    for (let x = box.x; x < box.x + box.width; x += 8) {
      const index = (png.width * y + x) * 4;
      total += png.data[index] * .2126 + png.data[index + 1] * .7152 + png.data[index + 2] * .0722;
      count++;
    }
  }
  return total / count;
};

const geometry = page => page.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll('[data-native-slot]')].map(element => {
    const rect = element.getBoundingClientRect();
    return [element.dataset.nativeSlot, [rect.x, rect.y, rect.width, rect.height]];
  })
));

test('theme preserves native Codex geometry, changes only visuals, and restores cleanly', async t => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(String.raw`
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #1f1f1f; color: #d4d4d4; font: 14px/1.45 "Segoe UI", "Microsoft YaHei UI", sans-serif; }
      button, textarea { font: inherit; color: inherit; }
      button { border: 1px solid transparent; background: transparent; }
      header { height: 46px; display: flex; align-items: center; gap: 25px; padding: 0 14px; border-bottom: 1px solid #303030; background: #191c1e; color: #aaa; }
      header .back { margin-left: 8px; color: #6f7476; }
      header .window-title { margin-left: auto; color: #777; font-size: 12px; }
      .shell { height: calc(100% - 46px); display: grid; grid-template-columns: 242px minmax(0, 1fr) 270px; }
      nav { min-width: 0; padding: 9px 7px 12px; overflow: hidden; border-right: 1px solid #2c3030; background: #1a1f1f; }
      .codex-name { display: flex; align-items: center; justify-content: space-between; padding: 5px 7px 12px; font-weight: 700; }
      nav button { width: 100%; min-height: 34px; padding: 6px 9px; border-radius: 7px; text-align: left; }
      nav button span { display: inline-block; width: 23px; color: #a4aaa6; }
      nav .section { margin: 18px 8px 6px; color: #696d6b; font-size: 12px; font-weight: 600; }
      [role="tree"] { height: 650px; overflow: hidden; }
      [role="treeitem"] { min-height: 31px; padding: 6px 10px 6px 29px; border: 1px solid transparent; border-radius: 7px; color: #b7bab8; white-space: nowrap; }
      [role="treeitem"][aria-selected="true"] { background: #303332; color: #e0e0df; }
      main { position: relative; min-width: 0; overflow: hidden; background: #1f1f1f; }
      .task-top { height: 48px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #2b2b2b; color: #bfc1bf; }
      .task-top .actions { margin-left: auto; display: flex; gap: 7px; }
      .task-top button { min-height: 30px; padding: 4px 9px; border-color: #353535; border-radius: 7px; }
      .landing-native { width: min(700px, calc(100% - 100px)); margin: 118px auto 0; }
      .landing-native small { color: #b6a071; letter-spacing: .12em; }
      .landing-native h1 { margin: 10px 0 7px; font-size: 28px; font-weight: 600; }
      .landing-native p { color: #aaa; }
      .conversation { width: min(760px, calc(100% - 76px)); margin: 64px auto 150px; }
      article { margin-bottom: 19px; padding: 15px 18px; border: 1px solid #333; border-radius: 13px; background: #2b2b2b; }
      article p { margin: 5px 0; }
      article .meta { color: #9d9d9d; font-size: 12px; }
      pre { margin: 10px 0 2px; padding: 12px; border: 1px solid #383838; border-radius: 7px; background: #171717; }
      form { position: absolute; right: 34px; bottom: 20px; left: 34px; min-height: 96px; padding: 11px 13px 8px; border: 1px solid #414141; border-radius: 17px; background: #2c2c2c; box-shadow: 0 12px 34px rgba(0,0,0,.24); }
      textarea { width: 100%; height: 48px; resize: none; border: 0; outline: 0; background: transparent; }
      [role="toolbar"] { display: flex; align-items: center; gap: 8px; }
      [role="toolbar"] button { min-width: 28px; min-height: 28px; border-radius: 7px; }
      [role="toolbar"] .send { margin-left: auto; border-radius: 50%; background: #d8d8d8; color: #333; }
      aside { min-width: 0; padding: 46px 12px 12px; border-left: 1px solid #2c2c2c; background: #1f1f1f; }
      .env-card { padding: 14px; border: 1px solid #363636; border-radius: 18px; background: #2d2d2d; }
      .env-card h2 { margin: 0 0 13px; color: #aaa; font-size: 14px; }
      .env-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3b3b3b; }
      .env-row:last-child { border: 0; }
      .muted { color: #7d7d7d; }
    </style>
    <header data-native-slot="topbar">
      <span>▣</span><span class="back">←　→</span><span>文件</span><span>编辑</span><span>视图</span><span>帮助</span>
      <span class="window-title">Codex</span>
    </header>
    <div class="shell">
      <nav role="navigation" data-native-slot="sidebar">
        <div class="codex-name"><b>Codex⌄</b><span>⌕</span></div>
        <button data-native-slot="new-task"><span>□</span>新建任务</button>
        <button><span>◎</span>插件</button>
        <p class="section">置顶</p>
        <button><span>◌</span>每日通知与时事汇总</button>
        <p class="section">项目</p>
        <div role="tree" aria-label="项目">
          <div role="treeitem">▱　wukong-codex-forge</div>
          <div role="treeitem" aria-selected="true">重设计黑神话悟空主题</div>
          <div role="treeitem">▱　reproduction-temple-run</div>
          <div role="treeitem">接管 Temple 总控并归档修复</div>
          <div role="treeitem">▱　reproduction-tetris</div>
          <div role="treeitem">Tetris总控</div>
          <div role="treeitem">▱　personal-web</div>
          <div role="treeitem">无任务</div>
        </div>
      </nav>
      <main data-native-slot="workspace">
        <div class="task-top"><span>▱　重设计黑神话悟空主题　···</span><div class="actions"><button>打开位置⌄</button><button>☷</button></div></div>
        <section class="landing-native">
          <small>新建任务</small>
          <h1>今天想锻造什么？</h1>
          <p>原生 Codex 内容与交互保持原位；悟空主题只改变背景、色彩和表面质感。</p>
        </section>
        <section class="conversation" hidden></section>
        <form data-native-slot="composer"><textarea aria-label="Message composer" placeholder="随心输入"></textarea><div role="toolbar"><button>＋</button><button>工具</button><button class="send">↑</button></div></form>
      </main>
      <aside role="complementary" data-native-slot="right-panel">
        <div class="env-card"><h2>环境信息　＋</h2><div class="env-row"><span>▣　变更</span><span class="muted">+0 -0</span></div><div class="env-row"><span>▱　本地</span><span>⌄</span></div><div class="env-row"><span>⌘　main</span><span>⌄</span></div><div class="env-row"><span>◉　比较分支</span><span>↗</span></div></div>
      </aside>
    </div>
  `);

  const nativeGeometry = await geometry(page);
  const nativeBodyChildren = await page.locator('body > *').count();
  const jpeg = fs.readFileSync(new URL('../themes/assets/great-sage-return.jpg', import.meta.url)).toString('base64');
  const image = 'data:image/jpeg;base64,' + jpeg;
  const theme = makeTheme();
  const styleSheet = fs.readFileSync(new URL('../runtime/forge-theme.css', import.meta.url), 'utf8');
  await page.evaluate(makeApplyExpression({
    styleSheet,
    variables: cssFor(theme, image),
    companion: { enabled: false }
  }));

  assert.deepEqual(await geometry(page), nativeGeometry, 'theme changed native Codex geometry');
  assert.equal(await page.locator('body > *').count(), nativeBodyChildren, 'theme injected a body-level control or rail');
  assert.equal(await page.locator('body [data-forge-owned]').count(), 0, 'theme injected a body-level owned node');
  assert.equal(await page.locator('.forge-theme-toggle, .forge-landing-mark').count(), 0);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'landing');
  const landingBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-landing-fixture.png' });
  const landing = PNG.sync.read(landingBuffer);
  assert.match(await page.evaluate(() => getComputedStyle(document.body).backgroundImage), /data:image\/jpeg/);

  await page.evaluate(() => {
    document.querySelector('.landing-native').hidden = true;
    const conversation = document.querySelector('.conversation');
    conversation.hidden = false;
    conversation.innerHTML =
      '<article><div class="meta">你</div><p>页面结构保持原生，只替换主题，不要额外侧栏、底栏或开关按钮。</p></article>' +
      '<article><div class="meta">Codex</div><p>已收紧为原生 Codex 骨架：运行时只应用色彩、背景和材质，卸载后完整回归原生。</p><pre><code>layout: native\ntheme: Wukong\ncontrols: none</code></pre></article>';
  });
  await page.waitForTimeout(220);
  assert.equal(await page.locator('html').getAttribute('data-forge-surface'), 'thread');
  assert.deepEqual(await geometry(page), nativeGeometry, 'thread state changed native shell geometry');
  const threadBuffer = await page.screenshot({ path: 'docs/screenshots/runtime-background-fixture.png' });
  const thread = PNG.sync.read(threadBuffer);

  const workspaceBox = { x: 310, y: 105, width: 720, height: 450 };
  const landingLight = averageLuminance(landing, workspaceBox);
  const threadLight = averageLuminance(thread, workspaceBox);
  assert.ok(
    landingLight > threadLight + 5,
    'landing should be visibly brighter than thread: ' +
      landingLight.toFixed(2) + ' vs ' + threadLight.toFixed(2)
  );

  await page.evaluate(RESTORE_EXPRESSION);
  const restored = await page.evaluate(() => ({
    backgroundImage: getComputedStyle(document.body).backgroundImage,
    forgeRoot: document.documentElement.classList.contains('forge-ink-mountain'),
    forgeStyle: Boolean(document.getElementById('wukong-forge-style')),
    forgeSurface: document.documentElement.dataset.forgeSurface || null,
    ownedNodes: document.querySelectorAll('[data-forge-owned]').length
  }));
  assert.deepEqual(restored, {
    backgroundImage: 'none',
    forgeRoot: false,
    forgeStyle: false,
    forgeSurface: null,
    ownedNodes: 0
  });
});
