import fs from 'node:fs';
import process from 'node:process';
import { payloadFromThemeFile } from './forge-runtime.mjs';
import { getBrowserVersion, getTargets, evaluateTarget, isCodexTarget } from './cdp-client.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from './injection-plan.mjs';

const [,, mode, portRaw, providedTheme] = process.argv;
const port = Number(portRaw);
const themePath = providedTheme || 'themes/active.json';
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');

const version = await getBrowserVersion(port);
if (mode === '--verify') {
  console.log(JSON.stringify({ ok: true, address: '127.0.0.1', browserId: version.id || null }));
  process.exit(0);
}
if (!['--apply', '--restore'].includes(mode)) {
  throw Error('Use --verify|--apply|--restore <port> [theme.json]');
}

const makeExpression = () => {
  if (mode === '--restore') return RESTORE_EXPRESSION;
  const payload = payloadFromThemeFile(themePath);
  const styleSheet = fs.readFileSync(new URL('./forge-theme.css', import.meta.url), 'utf8');
  const companion = payload.theme.companion.enabled
    ? {
        ...payload.theme.companion,
        image: 'data:image/png;base64,' + fs.readFileSync(
          new URL('../assets/little-wayfarer.png', import.meta.url)
        ).toString('base64')
      }
    : null;
  return makeApplyExpression({ styleSheet, variables: payload.variables, companion });
};

const expression = makeExpression();
const targets = (await getTargets(port)).filter(isCodexTarget);
if (!targets.length) throw Error('No Codex renderer target was found');
await Promise.all(targets.map(target => evaluateTarget(target, expression)));
console.log(`${mode} complete on ${targets.length} loopback CDP target(s) using ${themePath}`);
