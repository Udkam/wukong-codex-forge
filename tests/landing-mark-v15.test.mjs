import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateTheme } from '../shared/theme-model.mjs';

const css = fs.readFileSync(
  new URL('../runtime/forge-background-v13.css', import.meta.url),
  'utf8'
);

const ruleMatch = css.match(
  /\[data-testid="home-icon"\]\[data-forge-mark="1"\]::before\s*\{([\s\S]*?)\n\}/
);

test('V16 landing mark paints the official Wukong wordmark at threefold scale without resizing its host', () => {
  assert.ok(ruleMatch, 'landing mark pseudo rule must exist');
  const rule = ruleMatch[1];
  assert.match(
    rule,
    /background-image:\s*var\(--forge-ui-landing-mark\)/
  );
  assert.doesNotMatch(rule, /animation|filter|will-change/i);
  assert.match(rule, /top:\s*50%/);
  assert.match(rule, /left:\s*50%/);
  assert.match(rule, /width:\s*168px/);
  assert.match(rule, /height:\s*168px/);
  assert.match(rule, /transform:\s*translate\(-50%,\s*-50%\)/);
  assert.match(rule, /background-size:\s*contain/);
  assert.match(rule, /pointer-events:\s*none/);
  assert.doesNotMatch(rule, /(?:^|[;\s])(?:margin|padding|filter|scale)\s*:/);

  const hostRule = css.match(
    /\[data-testid="home-icon"\]\[data-forge-mark="1"\]\s*\{([\s\S]*?)\n\}/
  );
  assert.ok(hostRule, 'landing mark host rule must exist');
  assert.match(hostRule[1], /overflow:\s*visible/);
  assert.doesNotMatch(
    hostRule[1],
    /(?:^|[;\s])(?:width|height|margin|padding|transform|scale)\s*:/
  );

  const activeTheme = JSON.parse(
    fs.readFileSync(new URL('../themes/active.json', import.meta.url), 'utf8')
  );
  assert.equal(
    activeTheme.uiAssets.landingMark,
    'ui/v16/landing-wukong-wordmark-light.webp'
  );
  assert.equal(
    activeTheme.uiAssets.landingMarkDark,
    'ui/v16/landing-wukong-wordmark-dark.webp'
  );
  for (const relativePath of Object.values({
    light: activeTheme.uiAssets.landingMark,
    dark: activeTheme.uiAssets.landingMarkDark
  })) {
    const asset = fs.readFileSync(new URL(`../themes/${relativePath}`, import.meta.url));
    assert.equal(asset.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.ok(asset.byteLength < 40960, `${relativePath} should stay under 40 KiB`);
  }

  const darkRule = css.match(
    /:root\.forge-ink-mountain:is\(([\s\S]*?)\)\s+\[data-testid="home-icon"\]\[data-forge-mark="1"\]::before\s*\{([\s\S]*?)\n\}/
  );
  assert.ok(darkRule, 'scene-adaptive dark wordmark rule must exist');
  for (const scene of ['0', '4', '8']) {
    assert.match(darkRule[1], new RegExp(`data-forge-scene="${scene}"`));
  }
  assert.match(darkRule[2], /--forge-ui-landing-mark-dark/);
  assert.match(darkRule[2], /--forge-ui-landing-mark/);

  const legacyTheme = structuredClone(activeTheme);
  delete legacyTheme.uiAssets.landingMarkDark;
  assert.doesNotThrow(
    () => validateTheme(legacyTheme),
    'schema v3 themes with the original UI asset set must remain valid'
  );
});

test('V16 landing title is optically reduced without changing native geometry', () => {
  const titleRule = css.match(
    /\[data-forge-title-copy\]::after\s*\{([\s\S]*?)\n\}/
  );
  assert.ok(titleRule, 'landing title pseudo rule must exist');
  assert.match(titleRule[1], /inset:\s*-2px 0 2px/);
  assert.match(titleRule[1], /font-size:\s*\.9em/);
  assert.match(titleRule[1], /letter-spacing:\s*\.035em/);
  assert.doesNotMatch(titleRule[1], /(?:^|[;\s])(?:width|height|margin|padding)\s*:/);
});
