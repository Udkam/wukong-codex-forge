import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('public install and disable entry points preserve every existing file', () => {
  const install = read('scripts/install-preserving.ps1');
  const launch = read('scripts/launch.ps1');
  const disable = read('scripts/disable.ps1');
  const hook = read('scripts/install-chatgpt-hook.ps1');
  const verifyAdapter = read('scripts/verify-launch-adapter.ps1');
  const start = read('scripts/start.ps1');
  const nativePets = read('scripts/install-native-pets.ps1');
  const prepareNativePets = read('scripts/prepare-native-pets.mjs');
  const installCmd = read('install-theme.cmd');
  const removeCmd = read('remove-theme.cmd');
  const startCmd = read('start-theme.cmd');
  const stopCmd = read('stop-theme.cmd');

  for (const [name, script] of Object.entries({ install, launch, disable, hook, verifyAdapter, start, nativePets })) {
    assert.doesNotMatch(script, /\bRemove-Item\b|\bMove-Item\b|\.Delete\(|rmSync|unlinkSync|rmdirSync/, `${name} contains a destructive file operation`);
  }
  assert.match(install, /releases/);
  assert.match(install, /release\.json/);
  assert.match(install, /history/);
  assert.match(install, /runtime-only theme never writes config\.toml/);
  assert.doesNotMatch(install, /-Destination\s+\$configPath|(?:WriteAllText|AppendAllText)\(\s*\$configPath|(?:upgrade|apply|restore)\s+--config/i);
  assert.match(launch, /runtime-events\.jsonl/);
  assert.match(disable, /retained = \$true/);
  assert.match(disable, /All theme releases, assets, logs and request records were retained/);
  assert.match(installCmd, /install-preserving\.ps1/);
  assert.match(removeCmd, /disable\.ps1/);
  assert.doesNotMatch(removeCmd, /restore\.ps1|-Uninstall/);
  assert.match(startCmd, /start\.ps1/);
  assert.match(start, /install-native-pets\.ps1/);
  assert.match(nativePets, /New-Item -ItemType Junction/);
  assert.match(nativePets, /native-pet-links\.jsonl/);
  assert.doesNotMatch(nativePets, /Remove-Item|Move-Item|Copy-Item[^\r\n]*-Force/);
  assert.match(nativePets, /payloadName[\s\S]*spritesheet\.webp/);
  assert.match(nativePets, /source-pet\.json/);
  assert.match(nativePets, /managed-upgrade/);
  assert.match(nativePets, /history/);
  assert.doesNotMatch(nativePets, /Copy-Item[^\r\n]*spritesheet\.webp/);
  assert.match(nativePets, /1536x2288/);
  assert.match(nativePets, /validation\.json/);
  assert.match(nativePets, /package-proof\.json/);
  assert.match(nativePets, /transparent_rgb_residue_pixels/);
  assert.ok(nativePets.indexOf('$plans = @()') < nativePets.indexOf('New-Item -ItemType Junction'), 'native pets are linked before all packages pass preflight');
  assert.doesNotMatch(prepareNativePets, /rmSync|unlinkSync|rmdirSync|\.rm\(|\.unlink\(/);
  assert.match(prepareNativePets, /flag: 'wx'/);
  assert.match(stopCmd, /disable\.ps1/);
  assert.doesNotMatch(stopCmd, /-Portable/);
  assert.doesNotMatch(removeCmd, /-Portable/);
  assert.match(disable, /\$PSBoundParameters\.ContainsKey\('Portable'\)/);
  assert.match(install, /install-chatgpt-hook\.ps1/);
  assert.match(install, /verify-launch-adapter\.ps1/);
  assert.match(start, /verify-launch-adapter\.ps1/);
  assert.match(install, /appTarget 'scripts\\install-native-pets\.ps1'/);
  assert.match(hook, /BackupPrefix 'ChatGPT-before-wukong'/);
  assert.match(hook, /Copy-Item -LiteralPath \$Path -Destination \$backupPath/);
  assert.match(hook, /ChatGPT - Wukong Theme\.lnk/);
  assert.match(hook, /preservedExplicitBackup/);
  assert.match(hook, /launcher-bridges/);
  assert.match(hook, /LOCALAPPDATA[^\r\n]*WukongCodexForge/);
  assert.match(hook, /Assert-DirectManagedPath/);
  assert.match(hook, /Start Menu Programs directory/);
  assert.match(hook, /ChatGPT Start Menu shortcut/);
  assert.match(hook, /launch adapter root/);
  assert.match(hook, /shortcut backup directory/);
  assert.match(hook, /launcher bridge directory/);
  assert.match(hook, /ReparsePoint/);
  assert.match(launch, /profileMode = 'native-default'/);
  assert.match(launch, /GetFolderPath\('ApplicationData'\)[\s\S]*Codex\\web\\Codex/);
  assert.match(hook, /function Get-PortableSha256/);
  assert.doesNotMatch(hook, /Get-FileHash/);
  assert.match(hook, /-File `"\$bridgePath`"/);
  assert.match(hook, /\$expectedArguments\.Length -ge 900/);
  assert.doesNotMatch(hook, /EncodedCommand/);
  assert.match(hook, /\$managed\.Count -eq 1 -and `\$watching\.Count -ge 1/);
  assert.match(hook, /if \(\(Test-Path -LiteralPath `\$launcher\)/);
  assert.match(verifyAdapter, /default and explicit theme entries point to different bridges/);
  assert.match(verifyAdapter, /bridge root is stale/);
  assert.match(verifyAdapter, /latest hook event points to a stale release/);
  assert.match(verifyAdapter, /"verified"\s*=\s*\$true|verified = \$true/);
});

test('managed lifecycle uses Codex embedded Node and no WebSocket dependency tree', () => {
  for (const file of ['scripts/install-preserving.ps1', 'scripts/launch.ps1', 'scripts/disable.ps1']) {
    const script = read(file);
    assert.match(script, /app\\resources\\cua_node\\bin\\node\.exe/, `${file} does not use Codex embedded Node`);
    assert.doesNotMatch(script, /Get-Command\s+node(?:\.exe)?\b/i, `${file} still requires external Node`);
  }
  assert.doesNotMatch(read('scripts/package-runtime.mjs'), /node_modules/);
  assert.doesNotMatch(read('scripts/package-runtime.mjs'), /runtime\/ws-client(?:-node)?\.mjs/);
  assert.doesNotMatch(read('runtime/cdp-client.mjs'), /from '\.\/ws-client(?:-node)?\.mjs'/);
  assert.match(read('runtime/cdp-client.mjs'), /export const commandTarget = rawCommandTarget/);
  assert.deepEqual(JSON.parse(read('package.json')).dependencies, {});
  assert.doesNotMatch(read('package-lock.json'), /"node_modules\/ws"|"ws"\s*:/);
});

test('V13 watcher repairs complete background state and proves native restoration before reporting success', () => {
  const watcher = read('runtime/watch.mjs');
  const launch = read('scripts/launch.ps1');
  const disable = read('scripts/disable.ps1');
  const injector = read('runtime/injector.mjs');

  assert.match(watcher, /ACTIVE_PROBE_EXPRESSION/);
  assert.match(watcher, /forge-background-v13\.css/);
  assert.match(read('runtime/injection-plan-v13.mjs'), /__wukongCodexForgeRuntimeV13/);
  assert.match(read('runtime/injection-plan-v13.mjs'), /backgroundActiveImage/);
  assert.doesNotMatch(watcher, /emptyTargetPasses/);
  assert.match(watcher, /rootIsAlive\(rootPid\)/);
  assert.match(launch, /& \$node \$watcherPath \$port \$themePath \$disableRequest \$codexProcess\.Id/);
  assert.match(launch, /Wait-ForManagedMainWindow -ManagedProcessId \$codexProcess\.Id/);
  assert.match(watcher, /states\.every\(isNativeThemeState\)/);
  assert.match(watcher, /\.confirmed\.json/);
  assert.match(disable, /Managed watcher did not acknowledge the restore request; native state was not claimed/);
  assert.match(disable, /--assert-native \$port/);
  assert.match(disable, /Live native restoration could not be verified/);
  assert.match(injector, /mode === '--assert-native'/);
  assert.match(injector, /Codex renderer still contains managed theme state/);
  assert.ok(
    disable.indexOf('--assert-native $port') < disable.indexOf("state = 'disable-confirmed'"),
    'disable-confirmed is emitted before native-state verification'
  );
});
