import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { nativeUiBaseline } from './runtime-fixture.mjs';

const require = createRequire(import.meta.url);

const findLocalAsar = () => {
  const explicit = process.env.CODEX_LOCAL_ASAR;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const appRoot = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'WindowsApps');
  try {
    const candidates = fs.readdirSync(appRoot, { withFileTypes: true })
      .filter(entry => (
        entry.isDirectory() &&
        /^OpenAI\.Codex_.*_x64__/.test(entry.name)
      ))
      .map(entry => path.join(appRoot, entry.name, 'app', 'resources', 'app.asar'))
      .filter(candidate => fs.existsSync(candidate))
      .sort((left, right) => (
        fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs
      ));
    return candidates[0] || null;
  } catch {
    return null;
  }
};

const loadAsar = () => {
  try {
    return require('asar');
  } catch {
    const globalModule = path.join(
      process.env.APPDATA || '',
      'npm',
      'node_modules',
      'asar'
    );
    try {
      return require(globalModule);
    } catch {
      return null;
    }
  }
};

const archive = findLocalAsar();
const asar = loadAsar();
const skipReason = !archive
  ? 'local ChatGPT.exe app.asar is unavailable'
  : !asar
    ? 'the read-only asar module is unavailable'
    : false;

const listedPathToArchivePath = listedPath => listedPath.replace(/^\\/, '');

const readMatchingAsset = (entries, pattern, requiredText) => {
  for (const listedPath of entries) {
    if (!pattern.test(listedPath)) continue;
    const content = asar.extractFile(
      archive,
      listedPathToArchivePath(listedPath)
    ).toString('utf8');
    if (content.includes(requiredText)) return content;
  }
  return null;
};

test('local ChatGPT.exe ASAR remains the authoritative native geometry contract', {
  skip: skipReason
}, () => {
  const entries = asar.listPackage(archive);
  const baseCss = readMatchingAsset(
    entries,
    /^\\webview\\assets\\app-.*\.css$/i,
    '--spacing-token-sidebar:clamp(240px, 275px'
  );
  const composerLayout = readMatchingAsset(
    entries,
    /^\\webview\\assets\\composer-layout-.*\.js$/i,
    'grid-cols-[minmax(0,auto)_auto_minmax(0,1fr)]'
  );
  const composerAdapter = readMatchingAsset(
    entries,
    /^\\webview\\assets\\codex-composer-adapter-.*\.js$/i,
    '2.75rem'
  );
  const appShell = readMatchingAsset(
    entries,
    /^\\webview\\assets\\app-shell-.*\.js$/i,
    'group/application-menu-top-bar'
  );

  assert.ok(baseCss, 'official base CSS with Codex geometry tokens must exist');
  assert.ok(composerLayout, 'official composer layout asset must exist');
  assert.ok(composerAdapter, 'official composer adapter asset must exist');
  assert.ok(appShell, 'official application-shell asset must exist');

  for (const token of [
    '--spacing:.25rem',
    '--height-toolbar:46px',
    '--height-toolbar-sm:36px',
    '--height-toolbar-pane:40px',
    '--spacing-token-sidebar:clamp(240px, 275px, min(520px, calc(100vw - 320px)))',
    '--spacing-token-button-composer:calc(var(--spacing) * 7)',
    '--radius-token-composer-single-line:calc(var(--spacing) * 5.5)',
    '--thread-content-max-width:48rem',
    '--padding-panel-base:calc(var(--spacing) * 5)',
    '--padding-row-y:calc(var(--spacing) * 1.25)',
    '--composer-inline-overhang:calc(var(--spacing) * 6)',
    '--home-composer-inline-inset:calc(var(--spacing) * 3.25)'
  ]) {
    assert.ok(baseCss.includes(token), `missing native CSS token: ${token}`);
  }

  for (const fragment of [
    'mb-1 flex-grow overflow-y-auto',
    'grid-cols-[minmax(0,auto)_auto_minmax(0,1fr)]',
    'gap-x-[5px]',
    '`mb-2`',
    '`px-2`'
  ]) {
    assert.ok(
      composerLayout.includes(fragment),
      `missing native multiline composer layout: ${fragment}`
    );
  }

  assert.ok(composerAdapter.includes('1.25rem'));
  assert.ok(composerAdapter.includes('2.75rem'));
  assert.ok(composerAdapter.includes('size:`composer`'));
  assert.ok(appShell.includes('flex items-center gap-0.5 pr-2 pl-1'));
  assert.ok(appShell.includes('px-2.5 py-1 text-base font-normal leading-none'));
  assert.ok(appShell.includes('"aria-haspopup":`menu`'));
  assert.ok(appShell.includes('"aria-expanded":'));

  assert.deepEqual(nativeUiBaseline, {
    source: 'ChatGPT.exe 26.715.2305.0 app.asar',
    rendererDeviceScaleFactor: 1.25,
    spacing: 4,
    toolbarHeight: 46,
    smallToolbarHeight: 36,
    paneToolbarHeight: 40,
    sidebarPreferredWidth: 275,
    sidebarMinWidth: 240,
    sidebarMaxWidth: 520,
    sidebarViewportReserve: 320,
    sidebarRowHeight: 30,
    sidebarRowRadius: 10,
    threadContentMaxWidth: 768,
    panelPadding: 20,
    toolbarPadding: 16,
    composerButtonSize: 28,
    composerEditorMinHeight: 44,
    composerMultilineRadius: 25,
    composerSingleLineRadius: 22
  });
});
