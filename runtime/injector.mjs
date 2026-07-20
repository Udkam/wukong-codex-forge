import fs from 'node:fs';
import process from 'node:process';
import { getBrowserVersion, getTargets, evaluateTarget, isCodexTarget } from './cdp-client.mjs';
import { payloadFromThemeFile } from './forge-runtime.mjs';
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
if (!['--apply', '--restore'].includes(mode)) throw Error('Use --verify|--apply|--restore <port> [theme.json]');

const expression = mode === '--restore'
  ? RESTORE_EXPRESSION
  : makeApplyExpression({
      styleSheet: fs.readFileSync(new URL('./forge-theme.css', import.meta.url), 'utf8'),
      variables: payloadFromThemeFile(themePath).variables
    });
const targets = (await getTargets(port)).filter(isCodexTarget);
if (!targets.length) throw Error('No Codex renderer target was found');
await Promise.all(targets.map(target => evaluateTarget(target, expression)));
console.log(`${mode} complete on ${targets.length} loopback CDP target(s) using ${themePath}`);
