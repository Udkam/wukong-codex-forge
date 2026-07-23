import fs from 'node:fs';
import process from 'node:process';
import { getBrowserVersion, getTargets, evaluateTarget, isCodexTarget } from './cdp-client.mjs';
import { payloadFromThemeFile } from './forge-runtime.mjs';
import {
  isActiveThemeState,
  isNativeThemeState,
  makeApplyExpression,
  RESTORE_EXPRESSION,
  THEME_STATE_EXPRESSION
} from './injection-plan-v13.mjs';

const [,, mode, portRaw, providedTheme] = process.argv;
const port = Number(portRaw);
const themePath = providedTheme || 'themes/active.json';
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');

const version = await getBrowserVersion(port);
if (mode === '--verify') {
  console.log(JSON.stringify({ ok: true, address: '127.0.0.1', browserId: version.id || null }));
  process.exit(0);
}
if (!['--apply', '--restore', '--state', '--assert-native'].includes(mode)) {
  throw Error('Use --verify|--apply|--restore|--state|--assert-native <port> [theme.json]');
}

const targets = (await getTargets(port)).filter(isCodexTarget);
if (!targets.length) throw Error('No Codex renderer target was found');
const readStates = () => Promise.all(targets.map(target => evaluateTarget(target, THEME_STATE_EXPRESSION)));

if (mode === '--state' || mode === '--assert-native') {
  const states = await readStates();
  console.log(JSON.stringify({ mode, targets: targets.length, states }));
  if (mode === '--assert-native' && !states.every(isNativeThemeState)) {
    throw Error('Codex renderer still contains managed theme state');
  }
  process.exit(0);
}

const expression = mode === '--restore'
  ? RESTORE_EXPRESSION
  : makeApplyExpression({
      styleSheet: fs.readFileSync(new URL('./forge-background-v13.css', import.meta.url), 'utf8'),
      variables: payloadFromThemeFile(themePath).variables
    });
await Promise.all(targets.map(target => evaluateTarget(target, expression)));
const states = await readStates();
const verified = mode === '--restore'
  ? states.every(isNativeThemeState)
  : states.every(isActiveThemeState);
if (!verified) throw Error(`${mode} did not reach the required verified renderer state`);
console.log(JSON.stringify({ mode, targets: targets.length, themePath, verified, states }));
