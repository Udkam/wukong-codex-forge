import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(
  new URL('../runtime/forge-background-v13.css', import.meta.url),
  'utf8'
);

const ruleMatch = css.match(
  /\[data-testid="home-icon"\]\[data-forge-mark="1"\]::before\s*\{([\s\S]*?)\n\}/
);

test('V15 landing mark uses the real Jingu Bang asset in the native slot', () => {
  assert.ok(ruleMatch, 'landing mark pseudo rule must exist');
  const rule = ruleMatch[1];
  assert.match(
    rule,
    /background-image:\s*var\(--forge-ui-landing-mark\)/
  );
  assert.doesNotMatch(rule, /animation|filter|will-change/i);
  assert.match(rule, /inset:\s*0/);
  assert.match(rule, /background-size:\s*contain/);
  assert.match(rule, /pointer-events:\s*none/);

  const activeTheme = JSON.parse(
    fs.readFileSync(new URL('../themes/active.json', import.meta.url), 'utf8')
  );
  assert.equal(activeTheme.uiAssets.landingMark, 'ui/v15/landing-jingubang.webp');
  const asset = fs.readFileSync(
    new URL('../themes/ui/v15/landing-jingubang.webp', import.meta.url)
  );
  assert.equal(asset.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.ok(asset.byteLength < 8192, 'landing mark should stay under 8 KiB');
});
