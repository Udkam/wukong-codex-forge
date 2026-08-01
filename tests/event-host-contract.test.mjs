import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  browserIdentity,
  controlPipeName,
  createHostSignals,
  deriveOfficialPaths,
  parseHostArgs,
  resolveHostPaths,
  runEventWatcher
} from '../runtime/host.mjs';
import {
  ACTIVE_PROBE_EXPRESSION,
  RESTORE_EXPRESSION,
  THEME_STATE_EXPRESSION
} from '../runtime/injection-plan-v13.mjs';

const read = file => fs.readFileSync(file, 'utf8');

const activeState = {
  stylePresent: true,
  rootClass: true,
  backgroundLayerPresent: true,
  backgroundLayerCount: 2,
  backgroundReady: true,
  backgroundActiveLayer: '0',
  surface: 'landing',
  mode: 'battle',
  scene: '0',
  backgroundActiveScene: '0',
  backgroundActiveMode: 'battle',
  backgroundActiveImage: 'url("data:image/jpeg;base64,test")',
  motifLayerPresent: false,
  visibleNativeComposerCount: 1,
  visibleThemedComposerCount: 1,
  runtimeV12: false,
  runtimeV13: true
};

const nativeState = {
  stylePresent: false,
  rootClass: false,
  markedElements: 0,
  ownedNodeCount: 0,
  backgroundLayerPresent: false,
  backgroundReady: false,
  motifLayerPresent: false,
  runtimeV4: false,
  runtimeV5: false,
  runtimeV6: false,
  runtimeV7: false,
  runtimeV8: false,
  runtimeV9: false,
  runtimeV10: false,
  runtimeV11: false,
  runtimeV12: false,
  runtimeV13: false
};

test('formal lifecycle bridge is Node-hosted, event-driven and non-PowerShell', () => {
  const host = read('runtime/host.mjs');
  const hook = read('scripts/install-chatgpt-hook.ps1');
  const bridge = hook.match(/\$bridgeScript = @"([\s\S]*?)"@/)?.[1] || '';

  assert.match(host, /Target\.setDiscoverTargets/);
  assert.match(host, /Target\.setAutoAttach/);
  assert.match(host, /Page\.frameNavigated/);
  assert.match(host, /Runtime\.executionContextCreated/);
  assert.doesNotMatch(host, /setInterval\s*\(/);
  assert.doesNotMatch(host, /powershell(?:\.exe)?|runtime[\\/]watch\.mjs|Start-Sleep/i);

  assert.match(bridge, /import fs from 'node:fs'/);
  assert.match(bridge, /spawn\(target, args/);
  assert.match(bridge, /runtime', 'host\.mjs/);
  assert.doesNotMatch(bridge, /powershell(?:\.exe)?|launch\.ps1|watch\.mjs|Get-CimInstance|Start-Process/i);
  assert.match(hook, /\$expectedTarget = \$node/);
  assert.match(hook, /chatgpt-entry-\$bridgeId\.mjs/);
  assert.match(hook, /& \$node --check \$bridgePath/);
  assert.match(hook, /\$expectedArguments = "`"\$bridgePath`""/);
});

test('event host arguments, official path derivation and pipe ownership are deterministic', () => {
  assert.deepEqual(parseHostArgs(['--root', 'C:\\theme']), {
    portable: false,
    signalDisable: false,
    root: 'C:\\theme'
  });
  assert.deepEqual(parseHostArgs(['--root', 'C:\\theme', '--portable', '--signal-disable']), {
    portable: true,
    signalDisable: true,
    root: 'C:\\theme'
  });
  assert.throws(() => parseHostArgs(['--portable']), /--root DIR/);
  assert.throws(() => parseHostArgs(['--root', 'C:\\theme', '--unknown']), /Unknown or incomplete/);

  const official = deriveOfficialPaths('C:\\Program Files\\WindowsApps\\OpenAI.Codex_test\\app\\resources\\cua_node\\bin\\node.exe');
  assert.equal(official.chatGpt, path.resolve('C:\\Program Files\\WindowsApps\\OpenAI.Codex_test\\app\\ChatGPT.exe'));
  const resolved = resolveHostPaths({
    root: 'C:\\theme',
    env: { USERPROFILE: 'C:\\Users\\Test', APPDATA: 'C:\\Users\\Test\\AppData\\Roaming' }
  });
  assert.equal(resolved.profilePath, path.resolve('C:\\Users\\Test\\AppData\\Roaming\\Codex\\web\\Codex'));
  assert.equal(controlPipeName(resolved.stateRoot), controlPipeName(resolved.stateRoot.toUpperCase()));
  assert.match(controlPipeName(resolved.stateRoot), /^\\\\\.\\pipe\\WukongCodexForge-[0-9a-f]{24}$/);
  assert.match(browserIdentity({
    Browser: 'Codex/test',
    webSocketDebuggerUrl: 'ws://127.0.0.1:17777/devtools/browser/stable'
  }), /Codex\/test/);
  assert.throws(() => browserIdentity({ webSocketDebuggerUrl: 'ws://example.com/devtools/browser/a' }), /non-loopback/);
});

test('event watcher applies once, verifies active state, and restores before disable completes', async () => {
  const runRoot = path.join(os.tmpdir(), `wukong-event-host-${process.pid}-${Date.now()}`);
  fs.mkdirSync(runRoot, { recursive: false });
  const markerPath = path.join(runRoot, 'package.json');
  fs.writeFileSync(markerPath, '{"name":"wukong-codex-forge"}\n', { encoding: 'utf8', flag: 'wx' });

  const target = { id: 'page-1', type: 'page', url: 'app://codex/index.html' };
  const commands = [];
  let themed = false;
  let applyCount = 0;
  let restoreCount = 0;
  let closeCount = 0;
  const signals = createHostSignals();
  const never = new Promise(() => {});

  const result = await runEventWatcher({
    port: 17777,
    expression: 'APPLY',
    disableRequest: '',
    rootPid: process.pid,
    markerPath,
    signals,
    rootExit: never,
    onReady: () => { void signals.requestDisable(); },
    dependencies: {
      getBrowserVersion: async () => ({
        Browser: 'Codex/test',
        webSocketDebuggerUrl: 'ws://127.0.0.1:17777/devtools/browser/stable'
      }),
      getTargets: async () => [target],
      isCodexTarget: () => true,
      connectBrowserEvents: async () => ({
        closed: never,
        command: async (method, params) => { commands.push({ method, params }); return {}; },
        close: () => { closeCount += 1; }
      }),
      evaluateTarget: async (_target, expression) => {
        if (expression === 'APPLY') {
          applyCount += 1;
          themed = true;
          return true;
        }
        if (expression === ACTIVE_PROBE_EXPRESSION) return themed;
        if (expression === RESTORE_EXPRESSION) {
          restoreCount += 1;
          themed = false;
          return true;
        }
        if (expression === THEME_STATE_EXPRESSION) return themed ? activeState : nativeState;
        throw Error(`Unexpected expression: ${expression.slice(0, 24)}`);
      },
      targetSettleMs: 0,
      log: () => {}
    }
  });

  assert.equal(result.reason, 'disabled-verified');
  assert.equal(result.targets, 1);
  assert.equal(result.deferredNative, false);
  assert.equal(applyCount, 1);
  assert.equal(restoreCount, 1);
  assert.equal(themed, false);
  assert.ok(closeCount >= 1);
  assert.deepEqual(commands.map(entry => entry.method), [
    'Target.setDiscoverTargets',
    'Target.setAutoAttach'
  ]);
});

test('disable fails closed when native restoration cannot be verified', async () => {
  const runRoot = path.join(os.tmpdir(), `wukong-event-host-fail-${process.pid}-${Date.now()}`);
  fs.mkdirSync(runRoot, { recursive: false });
  const markerPath = path.join(runRoot, 'package.json');
  fs.writeFileSync(markerPath, '{"name":"wukong-codex-forge"}\n', { encoding: 'utf8', flag: 'wx' });
  const signals = createHostSignals();
  const never = new Promise(() => {});
  let disablePromise;

  const result = await runEventWatcher({
    port: 17778,
    expression: 'APPLY',
    disableRequest: '',
    rootPid: process.pid,
    markerPath,
    signals,
    rootExit: never,
    onReady: () => { disablePromise = signals.requestDisable(); },
    dependencies: {
      getBrowserVersion: async () => ({
        Browser: 'Codex/test',
        webSocketDebuggerUrl: 'ws://127.0.0.1:17778/devtools/browser/stable'
      }),
      getTargets: async () => [{ id: 'page-1', type: 'page', url: 'app://codex/index.html' }],
      isCodexTarget: () => true,
      connectBrowserEvents: async () => ({
        closed: never,
        command: async () => ({}),
        close: () => {}
      }),
      evaluateTarget: async (_target, expression) => {
        if (expression === ACTIVE_PROBE_EXPRESSION) return true;
        if (expression === THEME_STATE_EXPRESSION) return activeState;
        if (expression === RESTORE_EXPRESSION) throw Error('restore refused');
        return true;
      },
      targetSettleMs: 0,
      log: () => {}
    }
  });

  assert.equal(result.reason, 'native-restore-failed');
  assert.match(result.error, /restore refused/);
  await assert.rejects(disablePromise, /restore refused/);
});

test('event watcher retries a deferred large apply and reports bounded renderer phases', async () => {
  const runRoot = path.join(os.tmpdir(), `wukong-event-host-retry-${process.pid}-${Date.now()}`);
  fs.mkdirSync(runRoot, { recursive: false });
  const markerPath = path.join(runRoot, 'package.json');
  fs.writeFileSync(markerPath, '{"name":"wukong-codex-forge"}\n', { encoding: 'utf8', flag: 'wx' });
  const signals = createHostSignals();
  const never = new Promise(() => {});
  const phases = [];
  let applyCount = 0;
  let themed = false;

  const result = await runEventWatcher({
    port: 17779,
    expression: 'APPLY',
    disableRequest: '',
    rootPid: process.pid,
    markerPath,
    signals,
    rootExit: never,
    onReady: () => { signals.requestTerminate(); },
    onProgress: progress => phases.push(progress.phase),
    dependencies: {
      getBrowserVersion: async () => ({
        Browser: 'Codex/test',
        webSocketDebuggerUrl: 'ws://127.0.0.1:17779/devtools/browser/stable'
      }),
      getTargets: async () => [{ id: 'page-1', type: 'page', url: 'app://codex/index.html' }],
      isCodexTarget: () => true,
      connectBrowserEvents: async () => ({
        closed: never,
        command: async () => ({}),
        close: () => {}
      }),
      evaluateTarget: async (_target, expression) => {
        if (expression === 'APPLY') {
          applyCount += 1;
          if (applyCount === 1) throw Error('renderer navigated during apply');
          themed = true;
          return true;
        }
        if (expression === ACTIVE_PROBE_EXPRESSION) return themed;
        if (expression === THEME_STATE_EXPRESSION) return themed ? activeState : nativeState;
        if (expression === RESTORE_EXPRESSION) {
          themed = false;
          return true;
        }
        throw Error(`Unexpected expression: ${expression.slice(0, 24)}`);
      },
      targetSettleMs: 0,
      delay: async () => {},
      log: () => {}
    }
  });

  assert.equal(result.reason, 'terminated-verified');
  assert.equal(applyCount, 2);
  assert.ok(phases.includes('renderer-applying'));
  assert.ok(phases.includes('reconcile-deferred'));
  assert.ok(phases.includes('renderer-verified'));
});

test('event watcher remains dormant until a delayed renderer appears', async () => {
  const runRoot = path.join(os.tmpdir(), `wukong-event-host-delayed-${process.pid}-${Date.now()}`);
  fs.mkdirSync(runRoot, { recursive: false });
  const markerPath = path.join(runRoot, 'package.json');
  fs.writeFileSync(markerPath, '{"name":"wukong-codex-forge"}\n', { encoding: 'utf8', flag: 'wx' });
  const signals = createHostSignals();
  const never = new Promise(() => {});
  const target = { id: 'page-delayed', type: 'page', url: 'app://codex/index.html' };
  let rendererVisible = false;
  let themed = false;
  let browserEvent;

  const resultPromise = runEventWatcher({
    port: 17780,
    expression: 'APPLY',
    disableRequest: '',
    rootPid: process.pid,
    markerPath,
    signals,
    rootExit: never,
    onReady: () => { signals.requestTerminate(); },
    dependencies: {
      getBrowserVersion: async () => ({
        Browser: 'Codex/test',
        webSocketDebuggerUrl: 'ws://127.0.0.1:17780/devtools/browser/stable'
      }),
      getTargets: async () => rendererVisible ? [target] : [],
      isCodexTarget: () => true,
      connectBrowserEvents: async (_endpoint, onEvent) => {
        browserEvent = onEvent;
        return {
          closed: never,
          command: async () => ({}),
          close: () => {}
        };
      },
      evaluateTarget: async (_target, expression) => {
        if (expression === 'APPLY') {
          themed = true;
          return true;
        }
        if (expression === ACTIVE_PROBE_EXPRESSION) return themed;
        if (expression === THEME_STATE_EXPRESSION) return themed ? activeState : nativeState;
        if (expression === RESTORE_EXPRESSION) {
          themed = false;
          return true;
        }
        throw Error(`Unexpected expression: ${expression.slice(0, 24)}`);
      },
      targetSettleMs: 0,
      log: () => {}
    }
  });

  await new Promise(resolve => setImmediate(resolve));
  assert.equal(themed, false);
  rendererVisible = true;
  browserEvent({ method: 'Target.targetCreated', params: { targetInfo: target } }, { command: async () => ({}) });
  const result = await resultPromise;

  assert.equal(result.reason, 'terminated-verified');
  assert.equal(themed, false);
});
