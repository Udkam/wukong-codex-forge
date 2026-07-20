import fs from 'node:fs';
import process from 'node:process';
import { payloadFromThemeFile } from './forge-runtime.mjs';
import { getBrowserVersion, getTargets, evaluateTarget, isCodexTarget } from './cdp-client.mjs';
import { makeApplyExpression } from './injection-plan.mjs';

const [,, portRaw, providedTheme] = process.argv;
const port = Number(portRaw);
const themePath = providedTheme || 'themes/active.json';
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');

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
const expression = makeApplyExpression({ styleSheet, variables: payload.variables, companion });
const probe = 'Boolean(document.getElementById("wukong-forge-style") && window.__wukongCodexForgeRuntimeV2)';
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
    for (const target of targets) {
      const active = await evaluateTarget(target, probe).catch(() => false);
      if (!active) await evaluateTarget(target, expression);
    }
  } catch (error) {
    if (!connected && startupFailures++ < 20) {
      await sleep(750);
      continue;
    }
    if (connected && disconnectFailures++ < 2) {
      await sleep(500);
      continue;
    }
    if (!connected) throw Error('ChatGPT CDP did not become ready: ' + error.message);
    break;
  }
  await sleep(1400);
}

console.log('Wukong theme watcher stopped with the ChatGPT lifecycle.');
