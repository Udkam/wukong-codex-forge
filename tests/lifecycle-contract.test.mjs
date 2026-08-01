import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { commandTimeoutMs, isCodexTarget } from '../runtime/cdp-client.mjs';
import { browserIdentity, isProcessAlive, runWatcher } from '../runtime/watch.mjs';

const read = file => fs.readFileSync(file, 'utf8');
const publicScripts = {
  install: read('scripts/install-preserving.ps1'),
  launch: read('scripts/launch.ps1'),
  disable: read('scripts/disable.ps1'),
  hook: read('scripts/install-chatgpt-hook.ps1'),
  verifyAdapter: read('scripts/verify-launch-adapter.ps1'),
  start: read('scripts/start.ps1'),
  nativePets: read('scripts/install-native-pets.ps1')
};

const parsePowerShell = file => {
  const absolute = path.resolve(file).replaceAll("'", "''");
  const command =
    '$tokens=$null;$errors=$null;' +
    `[System.Management.Automation.Language.Parser]::ParseFile('${absolute}',[ref]$tokens,[ref]$errors)|Out-Null;` +
    'if($errors.Count){$errors|ForEach-Object{Write-Error $_.Message};exit 1}';
  return spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
};

test('all public and retained legacy lifecycle scripts parse', () => {
  for (const file of [
    'scripts/install-preserving.ps1',
    'scripts/launch.ps1',
    'scripts/start.ps1',
    'scripts/install-native-pets.ps1',
    'scripts/install-chatgpt-hook.ps1',
    'scripts/verify-launch-adapter.ps1',
    'scripts/disable.ps1',
    'scripts/install.ps1',
    'scripts/restore.ps1'
  ]) {
    const result = parsePowerShell(file);
    assert.equal(result.status, 0, file + ' parse failure: ' + result.stdout + result.stderr);
  }
});

test('live capture closes only an explicitly owned transient debug session', () => {
  const capture = read('scripts/capture-live-playwright.mjs');
  assert.match(capture, /close-debug-after-capture/);
  assert.match(capture, /debug-root-pid/);
  assert.match(capture, /debug-owner-pid/);
  assert.match(capture, /disable-\[0-9a-f\]\{32\}/i);
  assert.match(capture, /SystemInfo\.getProcessInfo/);
  assert.match(capture, /Transient cleanup PID mismatch/);
  assert.match(capture, /aside\.app-shell-left-panel/);
  assert.match(capture, /\.composer-surface-chrome/);
  assert.match(capture, /root\.dataset\.forgeBackgroundReady === 'true'/);
  assert.match(capture, /overlay\?\.dataset\.forgeReady === 'true'/);
  assert.ok(
    capture.indexOf('aside.app-shell-left-panel') < capture.indexOf('page.screenshot'),
    'capture must wait for the native shell before taking evidence'
  );
  assert.match(capture, /Browser\.close/);
  assert.match(
    capture,
    /execFileAsync\('taskkill\.exe', \['\/PID', String\(pid\), '\/T', '\/F'\]/
  );
  assert.ok(
    capture.indexOf('SystemInfo.getProcessInfo') <
      capture.indexOf('terminateVerifiedDebugTree(debugRootPid)'),
    'the exact-tree fallback must remain behind the CDP browser PID proof'
  );
  assert.match(capture, /verifiedTreeFallback/);
  assert.match(capture, /rootReleased/);
  assert.match(capture, /ownerReleased/);
  assert.match(capture, /portReleased/);
  assert.match(capture, /const cleanupTransientDebug = async reason/);
  assert.match(capture, /watcherConfirmed/);
  assert.match(capture, /captureError/);
  assert.match(capture, /open-task-candidates/);
  assert.match(capture, /require-queue-goal/);
  assert.match(capture, /dismiss-full-access-warning/);
  assert.match(capture, /root\.dataset\.forgeSurface === 'thread'/);
  assert.match(capture, /root\.dataset\.forgeMode === 'scenery'/);
  assert.match(capture, /querySelectorAll\('\.forge-composer-panel'\)\.length >= 2/);
  assert.match(capture, /querySelectorAll\('\.forge-composer-queue-item'\)\.length >= 1/);
  assert.match(capture, /taskSelectionProof/);
  assert.match(capture, /selectedTask/);
  assert.match(
    capture,
    /catch \(error\) \{[\s\S]*cleanupTransientDebug\('capture-failed'\)/
  );
  assert.match(capture, /flag:\s*'wx'/);
  assert.doesNotMatch(
    capture,
    /Stop-Process|process\.kill\([^,]+,\s*['"]SIGKILL/i
  );
  assert.doesNotMatch(capture, /['"]\/IM['"]/i);
});

test('V31 real capture failure evidence proves automatic owned cleanup', () => {
  const evidence = JSON.parse(read(
    'artifacts/test-runs/v31-live-capture-failure-contract-20260801/acceptance.json'
  ));
  assert.equal(evidence.schemaVersion, 1);
  assert.match(evidence.source, /real Codex renderer/i);
  assert.equal(evidence.expectedFailure.captureExitCode, 1);
  assert.equal(evidence.expectedFailure.errorName, 'TimeoutError');
  assert.equal(evidence.expectedFailure.screenshotCreated, false);
  assert.match(evidence.rawReportPolicy, /retained locally only/i);
  assert.match(evidence.rawReportSha256, /^[0-9A-F]{64}$/);
  assert.equal(evidence.cleanup.reason, 'capture-failed');
  assert.equal(evidence.cleanup.nativeRestoreObserved, true);
  assert.equal(evidence.cleanup.watcherConfirmed, true);
  assert.equal(evidence.cleanup.rootReleased, true);
  assert.equal(evidence.cleanup.launcherReleased, true);
  assert.equal(evidence.cleanup.portReleased, true);
  assert.equal(evidence.cleanup.remainingProjectProcesses, 0);
  assert.match(evidence.acceptanceBoundary, /failure cleanup only/i);
  assert.match(evidence.acceptanceBoundary, /not queue/i);
  assert.match(evidence.acceptanceBoundary, /final lifecycle/i);
});

test('public entries route only to the preserving and verified-disable lifecycle', () => {
  const installEntry = read('install-theme.cmd');
  const removeEntry = read('remove-theme.cmd');
  const startEntry = read('start-theme.cmd');
  const stopEntry = read('stop-theme.cmd');

  assert.match(installEntry, /scripts\\install-preserving\.ps1/i);
  assert.doesNotMatch(installEntry, /scripts\\install\.ps1/i);
  assert.match(removeEntry, /scripts\\disable\.ps1/i);
  assert.doesNotMatch(removeEntry, /scripts\\restore\.ps1|-Uninstall/i);
  assert.match(startEntry, /scripts\\start\.ps1/i);
  assert.match(stopEntry, /scripts\\disable\.ps1/i);
  assert.doesNotMatch(stopEntry, /-Portable/i);
  assert.doesNotMatch(removeEntry, /-Portable/i);
  assert.match(publicScripts.disable, /\$PSBoundParameters\.ContainsKey\('Portable'\)/);
  assert.match(publicScripts.disable, /\$releaseMarker/);

  for (const [name, script] of Object.entries({ install: publicScripts.install, launch: publicScripts.launch, disable: publicScripts.disable })) {
    assert.match(script, /Get-AppxPackage -Name 'OpenAI\.Codex'/, `${name} does not resolve the official Codex package`);
    assert.match(script, /app\\resources\\cua_node\\bin\\node\.exe/, `${name} does not use Codex's embedded Node runtime`);
    assert.doesNotMatch(script, /Get-Command\s+node(?:\.exe)?\b/i, `${name} depends on an external Node installation`);
    assert.doesNotMatch(script, /\bRemove-Item\b|\bMove-Item\b|\.Delete\(|rmSync|unlinkSync|rmdirSync/, `${name} contains a destructive file operation`);
    assert.doesNotMatch(script, /Stop-Process|taskkill/i, `${name} terminates a Codex process`);
    assert.doesNotMatch(
      script,
      /(?:Set-Content|Add-Content|Out-File|WriteAllText|AppendAllText|Copy-Item|Move-Item|Remove-Item)[^\r\n]*(?:app\.asar|WindowsApps|ChatGPT\.exe)/i,
      `${name} writes an official Codex program path`
    );
    assert.doesNotMatch(
      script,
      /(?:-Destination\s+\$configPath|WriteAllText\(\s*\$configPath|AppendAllText\(\s*\$configPath|(?:Set-Content|Add-Content|Out-File)[^\r\n]*\$configPath)/i,
      `${name} writes the official Codex config`
    );
  }

  for (const [name, script] of Object.entries(publicScripts)) {
    assert.doesNotMatch(script, /\bRemove-Item\b|\bMove-Item\b|\.Delete\(|rmSync|unlinkSync|rmdirSync/, `${name} contains a destructive file operation`);
    assert.doesNotMatch(script, /Stop-Process|taskkill/i, `${name} terminates a Codex process`);
  }

  assert.doesNotMatch(publicScripts.install, /(?:upgrade|apply|restore)\s+--config|&\s*\$node\s+\$engine/i);
  assert.match(publicScripts.install, /releases/);
  assert.match(publicScripts.install, /release\.json/);
  assert.match(publicScripts.install, /history/);
  assert.match(publicScripts.launch, /--remote-debugging-address=127\.0\.0\.1/);
  assert.match(publicScripts.launch, /--remote-debugging-port=0/);
  assert.match(publicScripts.launch, /CODEX_ELECTRON_USER_DATA_PATH/);
  assert.match(publicScripts.launch, /\.wukong-runtime/);
  assert.match(publicScripts.launch, /profileMode = 'native-default'/);
  assert.match(publicScripts.launch, /GetFolderPath\('ApplicationData'\)[\s\S]*Codex\\web\\Codex/);
  assert.match(publicScripts.launch, /if \(\$Portable\)[\s\S]*--user-data-dir=[\s\S]*else \{[\s\S]*--remote-debugging-port=0/);
  assert.match(publicScripts.launch, /already running without the managed loopback theme channel/);
  assert.match(
    publicScripts.launch,
    /foreach \(\$managedPath in @\(\$rootPath, \$stateRoot,/,
    'launch does not reject a reparse-point package root'
  );
  assert.match(publicScripts.launch, /System\.Threading\.Mutex|Threading\.Mutex/);
  assert.match(publicScripts.launch, /WaitOne\(0\)/);
  assert.match(publicScripts.launch, /AddSeconds\(20\)/);
  assert.match(publicScripts.launch, /\$verifyDeadline = \[DateTime\]::UtcNow\.AddSeconds\(20\)/);
  assert.match(publicScripts.launch, /Timed out verifying the Codex loopback theme channel/);
  assert.match(publicScripts.launch, /\$ErrorActionPreference = 'Continue'/);
  assert.match(publicScripts.launch, /\$verifyExitCode = \$LASTEXITCODE/);
  assert.match(publicScripts.launch, /\$applyExitCode = \$LASTEXITCODE/);
  assert.match(publicScripts.launch, /\$ErrorActionPreference = \$priorErrorActionPreference/);
  assert.match(publicScripts.launch, /\$injectorPath = Join-Path \$rootPath 'runtime\\injector\.mjs'/);
  assert.match(publicScripts.launch, /\$watcherPath = Join-Path \$rootPath 'runtime\\watch\.mjs'/);
  assert.match(publicScripts.launch, /\$themePath = Join-Path \$rootPath 'themes\\active\.json'/);
  assert.match(publicScripts.launch, /& \$node \$injectorPath --apply \$port \$themePath/);
  assert.match(publicScripts.launch, /& \$node \$watcherPath \$port \$themePath \$disableRequest \$codexProcess\.Id/);
  assert.match(publicScripts.launch, /Wait-ForManagedMainWindow -ManagedProcessId \$codexProcess\.Id/);
  assert.match(publicScripts.launch, /if \(\$reuseManagedProcess\)[\s\S]*CODEX_ELECTRON_USER_DATA_PATH = \$profilePath[\s\S]*Start-Process -FilePath \$chatGpt/);
  assert.ok(
    publicScripts.launch.indexOf('& $node $injectorPath --apply $port $themePath') <
      publicScripts.launch.indexOf("Write-RuntimeEvent 'watching'"),
    'launch records watching before the first renderer has verified the active theme'
  );
  assert.match(publicScripts.disable, /\.wukong-runtime/);
  assert.match(publicScripts.install, /install-chatgpt-hook\.ps1/);
  assert.match(publicScripts.install, /appTarget 'scripts\\install-native-pets\.ps1'/);
  assert.match(publicScripts.hook, /BackupPrefix 'ChatGPT-before-wukong'/);
  assert.match(publicScripts.hook, /Copy-Item -LiteralPath \$Path -Destination \$backupPath/);
  assert.match(publicScripts.hook, /CreateShortcut\(\$Path\)/);
  assert.match(publicScripts.hook, /launcher-bridges/);
  assert.match(publicScripts.hook, /LOCALAPPDATA[^\r\n]*WukongCodexForge/);
  assert.match(publicScripts.hook, /Assert-DirectManagedPath/);
  assert.match(publicScripts.hook, /Start Menu Programs directory/);
  assert.match(publicScripts.hook, /ChatGPT Start Menu shortcut/);
  assert.match(publicScripts.hook, /launch adapter root/);
  assert.match(publicScripts.hook, /shortcut backup directory/);
  assert.match(publicScripts.hook, /launcher bridge directory/);
  assert.match(publicScripts.hook, /ReparsePoint/);
  assert.match(publicScripts.hook, /runtime\\host\.mjs/);
  assert.match(publicScripts.hook, /chatgpt-entry-\$bridgeId\.mjs/);
  assert.match(publicScripts.hook, /WriteAllText\(\$bridgePath, \$bridgeScript/);
  assert.match(publicScripts.hook, /Text\.UTF8Encoding\]::new\(\$false\)/);
  assert.match(publicScripts.hook, /function Get-PortableSha256/);
  assert.match(publicScripts.hook, /\[IO\.File\]::OpenRead\(\$Path\)/);
  assert.doesNotMatch(publicScripts.hook, /Get-FileHash/);
  assert.match(publicScripts.hook, /\$expectedTarget = \$node/);
  assert.match(publicScripts.hook, /\$expectedArguments = "`"\$bridgePath`""/);
  assert.match(publicScripts.hook, /\$expectedArguments\.Length -ge 900/);
  assert.match(publicScripts.hook, /& \$node --check \$bridgePath/);
  assert.match(publicScripts.hook, /const themeAvailable = fs\.existsSync\(marker\) && fs\.existsSync\(host\)/);
  assert.match(publicScripts.hook, /const target = themeAvailable \? process\.execPath : official/);
  assert.match(publicScripts.hook, /spawn\(target, args/);
  assert.doesNotMatch(publicScripts.hook, /EncodedCommand|WindowsPowerShell|Get-CimInstance|runtime\[\\\\\/\]watch\\\.mjs/);
  assert.doesNotMatch(publicScripts.hook, /ShowWindowAsync|SetForegroundWindow|user32\.dll/i);
  assert.match(publicScripts.hook, /Generated ChatGPT Node launch bridge is invalid/);
  assert.match(publicScripts.start, /install-chatgpt-hook\.ps1/);
  assert.match(publicScripts.start, /install-native-pets\.ps1/);
  assert.match(publicScripts.start, /launch\.ps1/);
  assert.match(publicScripts.nativePets, /New-Item -ItemType Junction/);
  assert.match(publicScripts.nativePets, /spriteVersionNumber 2/);
  assert.match(publicScripts.nativePets, /native-pet-links\.jsonl/);
  assert.match(publicScripts.nativePets, /Get-WebpDimensions/);
  assert.match(publicScripts.nativePets, /1536x2288/);
  assert.match(publicScripts.nativePets, /validation\.json/);
  assert.match(publicScripts.nativePets, /package-proof\.json/);
  assert.match(publicScripts.nativePets, /transparent_rgb_residue_pixels/);
  assert.match(publicScripts.nativePets, /Assert-NoReparseSegments/);
  assert.ok(
    publicScripts.nativePets.indexOf('$plans = @()') < publicScripts.nativePets.indexOf('New-Item -ItemType Junction'),
    'native pet junction creation begins before package preflight finishes'
  );
  assert.doesNotMatch(publicScripts.nativePets, /Remove-Item|Move-Item|Copy-Item[^\r\n]*-Force/);
  assert.match(publicScripts.nativePets, /payloadName[\s\S]*spritesheet\.webp/);
  assert.match(publicScripts.nativePets, /source-pet\.json/);
  assert.match(publicScripts.nativePets, /managed-upgrade/);
  assert.match(publicScripts.nativePets, /versioned-linked-payload/);
  assert.doesNotMatch(publicScripts.nativePets, /Copy-Item[^\r\n]*spritesheet\.webp/);

  const packager = read('scripts/package-runtime.mjs');
  assert.doesNotMatch(packager, /node_modules/);
  assert.doesNotMatch(packager, /runtime\/ws-client(?:-node)?\.mjs/);
  assert.doesNotMatch(read('runtime/cdp-client.mjs'), /from '\.\/ws-client(?:-node)?\.mjs'/);
  assert.match(read('runtime/cdp-client.mjs'), /export const commandTarget = rawCommandTarget/);
  assert.deepEqual(JSON.parse(read('package.json')).dependencies, {});
  assert.doesNotMatch(read('package-lock.json'), /"node_modules\/ws"|"ws"\s*:/);
});

test('disable is fail-closed and records success only after native-state verification', () => {
  const disable = publicScripts.disable;
  const launch = publicScripts.launch;
  const injector = read('runtime/injector.mjs');

  assert.match(disable, /Get-ManagedLifecycleProcesses/);
  assert.match(disable, /runtime\[\\\\\/\]\(\?:host\|watch\)\\\.mjs/);
  assert.match(disable, /--signal-disable/);
  assert.match(disable, /Event lifecycle host did not restore native state/);
  assert.match(disable, /Managed lifecycle host did not acknowledge the restore request; native state was not claimed/);
  assert.match(disable, /runtime\/injector\.mjs --restore \$port/);
  assert.match(disable, /runtime\/injector\.mjs --assert-native \$port/);
  assert.match(disable, /Live native restoration could not be verified/);
  assert.match(disable, /state = 'disable-confirmed'/);
  assert.ok(
    disable.indexOf('runtime/injector.mjs --assert-native $port') < disable.indexOf("state = 'disable-confirmed'"),
    'disable success is recorded before native state is verified'
  );
  assert.match(launch, /\$injectorPath --assert-native \$port/);
  assert.match(launch, /Write-RuntimeEvent 'disable-failed'/);
  assert.match(injector, /--assert-native/);
  assert.match(injector, /states\.every\(isNativeThemeState\)/);
});

test('retained legacy entry files delegate before archived mutation history', () => {
  for (const [file, delegate] of [
    ['scripts/install.ps1', 'install-preserving.ps1'],
    ['scripts/restore.ps1', 'disable.ps1']
  ]) {
    const script = read(file);
    const archiveIndex = script.indexOf('<# Archived legacy implementation');
    assert.ok(archiveIndex > 0, `${file} is missing retained non-executable history`);
    const livePrefix = script.slice(0, archiveIndex);
    assert.match(livePrefix, new RegExp(delegate.replace('.', '\\.')));
    assert.match(livePrefix, /\breturn\b/);
    assert.doesNotMatch(livePrefix, /\bRemove-Item\b|\bMove-Item\b|Stop-Process|taskkill/i);
  }
});

test('renderer target selection defaults to Codex app pages and gates local development explicitly', () => {
  assert.equal(isCodexTarget({ type: 'page', url: 'app://codex/index.html' }), true);
  assert.equal(isCodexTarget({ type: 'page', title: 'Codex', url: 'app://-/index.html' }), true);
  assert.equal(isCodexTarget({ type: 'page', title: 'Other', url: 'app://-/index.html' }), false);
  assert.equal(isCodexTarget({ type: 'page', url: 'http://127.0.0.1:3000/' }), false);
  assert.equal(isCodexTarget(
    { type: 'page', url: 'http://127.0.0.1:3000/' },
    { allowLocalDevelopment: true }
  ), true);
  assert.equal(isCodexTarget({ type: 'page', url: 'https://example.com/' }), false);
  assert.equal(isCodexTarget({ type: 'worker', url: 'app://codex/index.html' }), false);
});

test('large runtime expressions receive a bounded 45 second transport window', () => {
  assert.equal(commandTimeoutMs('Runtime.evaluate', { expression: 'x'.repeat(1_000_001) }), 45000);
  assert.equal(commandTimeoutMs('Runtime.evaluate', { expression: 'x' }), 12000);
  assert.equal(commandTimeoutMs('Page.captureScreenshot'), 20000);
  assert.match(read('runtime/cdp-client.mjs'), /awaitPromise:\s*true/);
});

test('renderer refreshes are structural, throttled, and layout-loop free', () => {
  const runtime = read('runtime/injection-plan-v13.mjs');
  assert.match(runtime, /const naturalDelay = Math\.max\(140, 520 - elapsed\)/);
  assert.match(runtime, /timerDueAt/);
  assert.match(runtime, /scheduleRefresh\(0\)/);
  assert.match(runtime, /state\.routeTimers\.forEach\(timer => clearTimeout\(timer\)\)/);
  assert.match(runtime, /state\.routeTimers\.clear\(\)/);
  assert.match(runtime, /new MutationObserver\(/);
  const observerConfig = runtime.match(/observer\.observe\(document\.body,\s*(\{[\s\S]*?\})\s*\);/)?.[1] || '';
  assert.match(observerConfig, /childList:\s*true/);
  assert.match(observerConfig, /subtree:\s*true/);
  assert.match(observerConfig, /attributes:\s*true/);
  assert.match(observerConfig, /attributeFilter:\s*\[/);
  assert.match(observerConfig, /'hidden'/);
  assert.match(observerConfig, /'inert'/);
  assert.doesNotMatch(observerConfig, /'class'|'style'|'data-forge-/);
  assert.match(runtime, /nodeTouchesThemeStructure/);
  assert.match(runtime, /nodeIsWithinThemeStructure/);
  assert.match(runtime, /data-local-conversation-final-assistant/);
  assert.match(runtime, /new ResizeObserver\(/);
  assert.match(runtime, /setResizeTargets/);
  assert.match(runtime, /observedResizeTargets/);
  assert.doesNotMatch(runtime, /characterData:\s*true/);
  assert.doesNotMatch(runtime, /window\.addEventListener\('scroll', scheduleRefresh/);
  assert.match(runtime, /visualViewport\?\.addEventListener\('resize', scheduleRefresh/);
  assert.doesNotMatch(runtime, /visualViewport\?\.addEventListener\('scroll', scheduleRefresh/);
  assert.match(runtime, /addEventListener\('keydown', scheduleComposerKeyboardSubmit/);
  assert.doesNotMatch(runtime, /addEventListener\('input', scheduleRefresh/);
  assert.match(runtime, /history\.pushState = function/);
  assert.match(runtime, /preloadBackground/);
  assert.match(runtime, /transitionInFlight/);

  const watcher = read('runtime/watch.mjs');
  assert.doesNotMatch(watcher, /emptyTargetPasses|targets\.length\s*>=?\s*8/);
  assert.match(watcher, /if \(!rootAlive\)/);
  assert.match(watcher, /rootIsAlive\(rootPid\)/);
  assert.match(watcher, /WUKONG_BROWSER_IDENTITY_CHANGED/);
  assert.match(watcher, /if \(!targets\.length\)[\s\S]*await pause\(intervalMs\)[\s\S]*continue/);
});

test('watcher survives an unlimited renderer-free tray interval and reapplies to the next page', async () => {
  const target = { type: 'page', url: 'app://codex/index.html' };
  let targetReads = 0;
  let applyCount = 0;
  let rootAlive = true;
  let pauses = 0;
  const result = await runWatcher({
    port: 17777,
    themePath: 'unused.json',
    disableRequest: '',
    rootPid: process.pid,
    expression: 'APPLY',
    intervalMs: 1,
    dependencies: {
      getBrowserVersion: async () => ({ Browser: 'Codex/test', webSocketDebuggerUrl: 'ws://127.0.0.1:17777/devtools/browser/stable' }),
      getTargets: async () => (++targetReads <= 12 ? [] : [target]),
      evaluateTarget: async (_target, expression) => {
        if (expression === 'APPLY') {
          applyCount += 1;
          rootAlive = false;
          return true;
        }
        return false;
      },
      isCodexTarget: () => true,
      isProcessAlive: () => rootAlive,
      sleep: async () => { pauses += 1; },
      log: () => {}
    }
  });
  assert.equal(
    pauses,
    13,
    'twelve renderer-free polls plus one paced poll after the first successful reapply'
  );
  assert.equal(applyCount, 1);
  assert.equal(result.reason, 'root-exited');
});

test('watcher binds the loopback endpoint to one browser identity', async () => {
  let versionReads = 0;
  await assert.rejects(() => runWatcher({
    port: 17778,
    themePath: 'unused.json',
    disableRequest: '',
    rootPid: process.pid,
    expression: 'APPLY',
    intervalMs: 1,
    dependencies: {
      getBrowserVersion: async () => ({
        Browser: 'Codex/test',
        webSocketDebuggerUrl: `ws://127.0.0.1:17778/devtools/browser/${++versionReads}`
      }),
      getTargets: async () => [],
      isProcessAlive: () => true,
      sleep: async () => {},
      log: () => {}
    }
  }), /different browser instance/);
});

test('watcher process and browser identity helpers reject ambiguous ownership', () => {
  assert.equal(isProcessAlive(process.pid), true);
  assert.match(
    browserIdentity({ Browser: 'Codex/test', webSocketDebuggerUrl: 'ws://127.0.0.1:17779/devtools/browser/a' }),
    /Codex\/test/
  );
  assert.throws(() => browserIdentity({ webSocketDebuggerUrl: 'ws://example.com/devtools/browser/a' }), /non-loopback/);
});

test('watcher can disable cleanly while the native window is closed to tray', async () => {
  const runRoot = path.resolve('artifacts', 'test-runs', `watcher-disable-no-renderer-${process.pid}-${Date.now()}`);
  fs.mkdirSync(runRoot, { recursive: true });
  const request = path.join(runRoot, 'disable.request');
  fs.writeFileSync(request, 'test request\n', { encoding: 'utf8', flag: 'wx' });
  const result = await runWatcher({
    port: 17780,
    themePath: 'unused.json',
    disableRequest: request,
    rootPid: process.pid,
    expression: 'APPLY',
    intervalMs: 1,
    dependencies: {
      getBrowserVersion: async () => ({ Browser: 'Codex/test', webSocketDebuggerUrl: 'ws://127.0.0.1:17780/devtools/browser/stable' }),
      getTargets: async () => [],
      isProcessAlive: () => true,
      log: () => {}
    }
  });
  const confirmation = JSON.parse(fs.readFileSync(`${request}.confirmed.json`, 'utf8'));
  assert.equal(result.reason, 'disabled-no-renderer');
  assert.equal(confirmation.targets, 0);
  assert.equal(confirmation.deferredNative, true);
});
