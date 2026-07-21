import fs from 'node:fs';
import process from 'node:process';
import { getBrowserVersion, getTargets, evaluateTarget, isCodexTarget } from './cdp-client.mjs';
import { payloadFromThemeFile } from './forge-runtime.mjs';
import {
  isNativeThemeState,
  makeApplyExpression,
  RESTORE_EXPRESSION,
  THEME_STATE_EXPRESSION
} from './injection-plan.mjs';

const [,, portRaw, providedTheme, disableRequest] = process.argv;
const port = Number(portRaw);
const themePath = providedTheme || 'themes/active.json';
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');

const expression = makeApplyExpression({
  styleSheet: fs.readFileSync(new URL('./forge-theme.css', import.meta.url), 'utf8'),
  variables: payloadFromThemeFile(themePath).variables
});
const probe = 'Boolean(document.getElementById("wukong-forge-style") && window.__wukongCodexForgeRuntimeV9)';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let stopping = false;
let connected = false;
let startupFailures = 0;
let disconnectFailures = 0;
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; });

while (!stopping) {
  try {
    await getBrowserVersion(port);
    connected = true;
    startupFailures = 0;
    disconnectFailures = 0;
    const targets = (await getTargets(port)).filter(isCodexTarget);
    if (disableRequest && fs.existsSync(disableRequest)) {
      if (!targets.length) throw Error('Disable requested, but no Codex renderer target was found');
      await Promise.all(targets.map(target => evaluateTarget(target, RESTORE_EXPRESSION)));
      const states = await Promise.all(targets.map(target => evaluateTarget(target, THEME_STATE_EXPRESSION)));
      if (!states.every(isNativeThemeState)) throw Error('Disable requested, but native renderer state was not verified');
      const confirmation = `${disableRequest}.confirmed.json`;
      if (!fs.existsSync(confirmation)) {
        fs.writeFileSync(confirmation, JSON.stringify({ at: new Date().toISOString(), port, targets: targets.length, states }) + '\n', {
          encoding: 'utf8',
          flag: 'wx'
        });
      } else {
        JSON.parse(fs.readFileSync(confirmation, 'utf8'));
      }
      console.log(`Wukong style restored and verified on ${targets.length} native surface(s).`);
      break;
    }
    for (const target of targets) {
      const active = await evaluateTarget(target, probe).catch(() => false);
      if (!active) await evaluateTarget(target, expression);
    }
  } catch (error) {
    if (!connected && startupFailures++ < 24) {
      await sleep(700);
      continue;
    }
    if (connected && disconnectFailures++ < 2) {
      await sleep(500);
      continue;
    }
    if (disableRequest && fs.existsSync(disableRequest)) {
      throw Error(`Requested native restoration failed: ${error.message}`);
    }
    if (!connected) throw Error(`Codex CDP did not become ready: ${error.message}`);
    break;
  }
  await sleep(1700);
}

console.log('Wukong style watcher stopped with the Codex lifecycle.');
