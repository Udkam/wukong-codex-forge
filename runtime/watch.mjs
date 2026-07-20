import fs from 'node:fs';
import process from 'node:process';
import { getBrowserVersion, getTargets, evaluateTarget, isCodexTarget } from './cdp-client.mjs';
import { payloadFromThemeFile } from './forge-runtime.mjs';
import { makeApplyExpression, RESTORE_EXPRESSION } from './injection-plan.mjs';

const [,, portRaw, providedTheme, disableRequest] = process.argv;
const port = Number(portRaw);
const themePath = providedTheme || 'themes/active.json';
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');

const expression = makeApplyExpression({
  styleSheet: fs.readFileSync(new URL('./forge-theme.css', import.meta.url), 'utf8'),
  variables: payloadFromThemeFile(themePath).variables
});
const probe = 'Boolean(document.getElementById("wukong-forge-style") && window.__wukongCodexForgeRuntimeV4)';
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
      await Promise.all(targets.map(target => evaluateTarget(target, RESTORE_EXPRESSION).catch(() => false)));
      console.log('Wukong style restored to native surfaces by uninstall request.');
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
    if (!connected) throw Error(`Codex CDP did not become ready: ${error.message}`);
    break;
  }
  await sleep(1700);
}

console.log('Wukong style watcher stopped with the Codex lifecycle.');
