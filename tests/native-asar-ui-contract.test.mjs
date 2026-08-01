import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { nativeUiBaseline } from './runtime-fixture.mjs';

const require = createRequire(import.meta.url);
const provenance = JSON.parse(fs.readFileSync(
  new URL('../docs/native-asar-provenance.json', import.meta.url),
  'utf8'
));

const sha256FileBounded = filePath => {
  const hash = createHash('sha256');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  const handle = fs.openSync(filePath, 'r');
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(handle, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(handle);
  }
  return hash.digest('hex').toUpperCase();
};

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
  const packageDirectory = path.dirname(path.dirname(path.dirname(archive)));
  const packageDirectoryName = path.basename(packageDirectory);
  assert.equal(provenance.schemaVersion, 1);
  assert.equal(
    path.relative(packageDirectory, archive).replaceAll('\\', '/'),
    provenance.asarRelativePath,
    'native Codex app.asar relative path drifted; re-audit the installed package layout'
  );
  assert.equal(
    packageDirectoryName,
    provenance.packageDirectoryName,
    'native Codex package drifted; re-audit app.asar before changing theme selectors or geometry'
  );
  assert.equal(
    fs.statSync(archive).size,
    provenance.sizeBytes,
    'native Codex app.asar size drifted; re-audit before updating the provenance lock'
  );
  assert.equal(
    sha256FileBounded(archive),
    provenance.sha256,
    'native Codex app.asar hash drifted; do not reuse the previous UI baseline'
  );

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
  const conversationThread = readMatchingAsset(
    entries,
    /^\\webview\\assets\\local-conversation-thread-.*\.js$/i,
    'data-thread-find-composer'
  );
  const composerChrome = readMatchingAsset(
    entries,
    /^\\webview\\assets\\composer-layout-.*\.js$/i,
    'composer-surface-chrome'
  );
  const markdownEditor = readMatchingAsset(
    entries,
    /^\\webview\\assets\\markdown-.*\.js$/i,
    'ProseMirror'
  );
  const appShell = readMatchingAsset(
    entries,
    /^\\webview\\assets\\app-shell-.*\.js$/i,
    'group/application-menu-top-bar'
  );
  const navList = readMatchingAsset(
    entries,
    /^\\webview\\assets\\nav-list-.*\.js$/i,
    '"aria-current":'
  );
  const worktreeInitRow = readMatchingAsset(
    entries,
    /^\\webview\\assets\\worktree-init-row-.*\.js$/i,
    '"aria-disabled":'
  );
  const taskRowStatusIndicator = readMatchingAsset(
    entries,
    /^\\webview\\assets\\task-row-status-indicator-.*\.js$/i,
    '--vscode-textLink-foreground'
  );
  const spinner = readMatchingAsset(
    entries,
    /^\\webview\\assets\\spinner-.*\.js$/i,
    'animate-spin'
  );
  const threadSummaryPanel = readMatchingAsset(
    entries,
    /^\\webview\\assets\\thread-summary-panel-components-.*\.js$/i,
    'data-pip-obstacle'
  );

  assert.ok(baseCss, 'official base CSS with Codex geometry tokens must exist');
  assert.ok(composerLayout, 'official composer layout asset must exist');
  assert.ok(composerAdapter, 'official composer adapter asset must exist');
  assert.ok(conversationThread, 'official composer root asset must exist');
  assert.ok(composerChrome, 'official composer chrome asset must exist');
  assert.ok(markdownEditor, 'official ProseMirror textbox asset must exist');
  assert.ok(appShell, 'official application-shell asset must exist');
  assert.ok(navList, 'official navigation-list state asset must exist');
  assert.ok(worktreeInitRow, 'official worktree task-row asset must exist');
  assert.ok(
    taskRowStatusIndicator,
    'official task-row status-indicator asset must exist'
  );
  assert.ok(spinner, 'official native spinner asset must exist');
  assert.ok(
    threadSummaryPanel,
    'official thread-summary panel component asset must exist'
  );

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
  assert.ok(conversationThread.includes('data-thread-find-composer'));
  assert.ok(composerChrome.includes('composer-surface-chrome'));
  assert.ok(markdownEditor.includes('ProseMirror'));
  assert.ok(markdownEditor.includes('role:`textbox`'));
  assert.ok(
    composerAdapter.includes('inert:'),
    'native composer interaction lock must remain an adapter-owned dynamic state'
  );
  assert.ok(appShell.includes('flex items-center gap-0.5 pr-2 pl-1'));
  assert.ok(appShell.includes('px-2.5 py-1 text-base font-normal leading-none'));
  assert.ok(appShell.includes('"aria-haspopup":`menu`'));
  assert.ok(appShell.includes('"aria-expanded":'));

  for (const fragment of [
    'disabled:cursor-not-allowed',
    '"aria-current":',
    'disabled:'
  ]) {
    assert.ok(
      navList.includes(fragment),
      `missing native navigation state contract: ${fragment}`
    );
  }
  assert.match(
    navList,
    /\?`page`:void 0/,
    'active navigation items must expose aria-current="page"'
  );

  for (const fragment of [
    'dataAttributes:',
    'role:`button`',
    'tabIndex:',
    '"aria-disabled":',
    '"aria-current":'
  ]) {
    assert.ok(
      worktreeInitRow.includes(fragment),
      `missing native task-row state contract: ${fragment}`
    );
  }
  assert.match(
    worktreeInitRow,
    /\{\.\.\.\w+,className:[^{}]+role:`button`,tabIndex:[^,]+,"aria-disabled":[^,]+,"aria-current":/,
    'task-row data attributes and interactive ARIA state must share the row'
  );

  assert.match(
    taskRowStatusIndicator,
    /\(\w+\.unreadCount\?\?0\)>0/,
    'native task status must render unread counts'
  );
  assert.match(
    taskRowStatusIndicator,
    /\w+\.type===`loading`/,
    'native task status must render the loading/running indicator'
  );
  assert.match(
    taskRowStatusIndicator,
    /\w+\.unread===!0/,
    'native task status must render the unread dot'
  );
  assert.ok(
    taskRowStatusIndicator.includes('var(--vscode-textLink-foreground)'),
    'native unread states must inherit the text-link foreground token'
  );
  assert.ok(
    taskRowStatusIndicator.includes(
      'backgroundColor:`color-mix(in srgb, var(--vscode-textLink-foreground) 18%, transparent)`'
    ),
    'native unread count must derive its surface from the text-link token'
  );
  assert.ok(
    taskRowStatusIndicator.includes(
      'boxShadow:`inset 0 0 0 1px color-mix(in srgb, var(--vscode-textLink-foreground) 72%, transparent)`'
    ),
    'native unread count must derive its outline from the text-link token'
  );

  assert.ok(
    spinner.includes('animate-spin'),
    'native loading indicator must preserve its spinner animation class'
  );
  assert.match(
    spinner,
    /width:24,height:24,viewBox:`0 0 24 24`/,
    'native loading indicator must preserve its 24 by 24 SVG geometry'
  );

  for (const fragment of [
    'data-pip-obstacle',
    'width:300',
    'relative flex max-h-full min-h-0 flex-col overflow-hidden rounded-3xl bg-token-dropdown-background pt-2.5',
    'thread-summary-panel-item',
    'thread-summary-panel-item-button',
    'thread-summary-panel-item-trigger',
    'thread-summary-panel-icon-button'
  ]) {
    assert.ok(
      threadSummaryPanel.includes(fragment),
      `missing native environment-panel contract: ${fragment}`
    );
  }

  assert.deepEqual(nativeUiBaseline, {
    source: `ChatGPT.exe ${provenance.packageVersion} app.asar`,
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
