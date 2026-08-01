[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Root,
    [switch]$Portable
)

$ErrorActionPreference = 'Stop'

function Get-PortableSha256([string]$Path) {
    $stream = [IO.File]::OpenRead($Path)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try {
        return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '')
    }
    finally {
        $algorithm.Dispose()
        $stream.Dispose()
    }
}

function Assert-DirectManagedPath([string]$Path, [string]$Label) {
    $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    if ($item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw "Refusing ChatGPT launch adapter install: ${Label} is a reparse point: $Path"
    }
}

$rootPath = [IO.Path]::GetFullPath($Root)
$packageDefinition = Join-Path $rootPath 'package.json'
$hostPath = Join-Path $rootPath 'runtime\host.mjs'
if (-not (Test-Path -LiteralPath $packageDefinition) -or -not (Test-Path -LiteralPath $hostPath)) {
    throw 'Wukong theme package is incomplete; the ChatGPT launch adapter was not installed.'
}
$themePackage = Get-Content -LiteralPath $packageDefinition -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$themePackage.name -ne 'wukong-codex-forge') {
    throw 'Wukong theme package marker is invalid.'
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$chatGpt = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
$node = Join-Path $package.InstallLocation 'app\resources\cua_node\bin\node.exe'
if (-not (Test-Path -LiteralPath $chatGpt)) { throw 'Official ChatGPT.exe was not found.' }
if (-not (Test-Path -LiteralPath $node)) { throw 'The Node runtime bundled with OpenAI.Codex was not found.' }

$programs = [Environment]::GetFolderPath('Programs')
$shortcutPath = Join-Path $programs 'ChatGPT.lnk'
$themeShortcutPath = Join-Path $programs 'ChatGPT - Wukong Theme.lnk'
$adapterRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge'))
$historyRoot = Join-Path $adapterRoot 'shortcut-backups'
$bridgeRoot = Join-Path $adapterRoot 'launcher-bridges'
$eventPath = Join-Path $adapterRoot 'shortcut-hook-events.jsonl'
Assert-DirectManagedPath -Path $programs -Label 'Start Menu Programs directory'
Assert-DirectManagedPath -Path $shortcutPath -Label 'ChatGPT Start Menu shortcut'
Assert-DirectManagedPath -Path $themeShortcutPath -Label 'explicit Wukong Start Menu shortcut'
Assert-DirectManagedPath -Path $adapterRoot -Label 'launch adapter root'
Assert-DirectManagedPath -Path $historyRoot -Label 'shortcut backup directory'
Assert-DirectManagedPath -Path $bridgeRoot -Label 'launcher bridge directory'
New-Item -ItemType Directory -Force -Path $historyRoot | Out-Null
New-Item -ItemType Directory -Force -Path $bridgeRoot | Out-Null
Assert-DirectManagedPath -Path $adapterRoot -Label 'launch adapter root'
Assert-DirectManagedPath -Path $historyRoot -Label 'shortcut backup directory'
Assert-DirectManagedPath -Path $bridgeRoot -Label 'launcher bridge directory'

$rootLiteral = $rootPath | ConvertTo-Json -Compress
$portableLiteral = if ($Portable) { 'true' } else { 'false' }
$bridgeScript = @"
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const themeRoot = $rootLiteral;
const portable = $portableLiteral;
const marker = path.join(themeRoot, 'package.json');
const host = path.join(themeRoot, 'runtime', 'host.mjs');
const appRoot = path.resolve(path.dirname(process.execPath), '..', '..', '..');
const official = path.join(appRoot, 'ChatGPT.exe');
const themeAvailable = fs.existsSync(marker) && fs.existsSync(host);
const target = themeAvailable ? process.execPath : official;
const args = themeAvailable
  ? [host, '--root', themeRoot, ...(portable ? ['--portable'] : [])]
  : [];

if (!fs.existsSync(target)) process.exit(3);
const child = spawn(target, args, {
  detached: true,
  stdio: 'ignore',
  windowsHide: themeAvailable
});
child.unref();
"@
$bridgeBytes = [Text.Encoding]::UTF8.GetBytes($bridgeScript)
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
    $bridgeId = ([BitConverter]::ToString($sha256.ComputeHash($bridgeBytes))).Replace('-', '').Substring(0, 20).ToLowerInvariant()
}
finally {
    $sha256.Dispose()
}
$bridgePath = Join-Path $bridgeRoot "chatgpt-entry-$bridgeId.mjs"
if (Test-Path -LiteralPath $bridgePath) {
    $existingBridge = [IO.File]::ReadAllText($bridgePath, [Text.Encoding]::UTF8)
    if (-not [string]::Equals($existingBridge, $bridgeScript, [StringComparison]::Ordinal)) {
        do {
            $collisionStamp = (Get-Date).ToString('yyyyMMdd-HHmmss-fffffff')
            $bridgePath = Join-Path $bridgeRoot "chatgpt-entry-$bridgeId-$collisionStamp.mjs"
        } while (Test-Path -LiteralPath $bridgePath)
    }
}
if (-not (Test-Path -LiteralPath $bridgePath)) {
    [IO.File]::WriteAllText($bridgePath, $bridgeScript, [Text.UTF8Encoding]::new($false))
}
& $node --check $bridgePath
if ($LASTEXITCODE -ne 0) {
    throw 'Generated ChatGPT Node launch bridge is invalid.'
}

$expectedTarget = $node
$expectedArguments = "`"$bridgePath`""
if ($expectedArguments.Length -ge 900) {
    throw 'ChatGPT launch adapter arguments exceed the safe Windows shortcut limit.'
}

$shell = New-Object -ComObject WScript.Shell
function Test-ShortcutCurrent([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $false }
    $current = $shell.CreateShortcut($Path)
    return (
        [string]::Equals([IO.Path]::GetFullPath($current.TargetPath), [IO.Path]::GetFullPath($expectedTarget), [StringComparison]::OrdinalIgnoreCase) -and
        [string]::Equals($current.Arguments, $expectedArguments, [StringComparison]::Ordinal)
    )
}

function Install-PreservedShortcut([string]$Path, [string]$BackupPrefix, [string]$Description) {
    $alreadyCurrent = Test-ShortcutCurrent -Path $Path
    $backupPath = $null
    if (-not $alreadyCurrent) {
        if (Test-Path -LiteralPath $Path) {
            $stamp = (Get-Date).ToString('yyyyMMdd-HHmmss-fffffff')
            $backupPath = Join-Path $historyRoot "$BackupPrefix-$stamp.lnk"
            Copy-Item -LiteralPath $Path -Destination $backupPath
        }
        $shortcut = $shell.CreateShortcut($Path)
        $shortcut.TargetPath = $expectedTarget
        $shortcut.Arguments = $expectedArguments
        $shortcut.WorkingDirectory = $env:USERPROFILE
        $shortcut.IconLocation = "$chatGpt,0"
        $shortcut.Description = $Description
        $shortcut.WindowStyle = 7
        $shortcut.Save()
    }
    return [pscustomobject]@{
        changed = -not $alreadyCurrent
        backup = $backupPath
    }
}

$defaultShortcut = Install-PreservedShortcut `
    -Path $shortcutPath `
    -BackupPrefix 'ChatGPT-before-wukong' `
    -Description 'ChatGPT - Wukong Codex Forge launch adapter'
$explicitShortcut = Install-PreservedShortcut `
    -Path $themeShortcutPath `
    -BackupPrefix 'ChatGPT-Wukong-Theme-before-current' `
    -Description 'ChatGPT - Wukong Theme (current retained release)'

$event = [ordered]@{
    at = (Get-Date).ToString('o')
    managedBy = 'WukongCodexForgeLaunchAdapter'
    shortcutPath = $shortcutPath
    themeShortcutPath = $themeShortcutPath
    themeRoot = $rootPath
    portable = [bool]$Portable
    bridgePath = $bridgePath
    bridgeHash = Get-PortableSha256 $bridgePath
    bridgeHost = 'CodexEmbeddedNode'
    lifecycleHost = 'runtime\host.mjs'
    eventDriven = $true
    shortcutArgumentsLength = $expectedArguments.Length
    changed = [bool]($defaultShortcut.changed -or $explicitShortcut.changed)
    defaultShortcutChanged = [bool]$defaultShortcut.changed
    explicitShortcutChanged = [bool]$explicitShortcut.changed
    preservedBackup = $defaultShortcut.backup
    preservedExplicitBackup = $explicitShortcut.backup
    shortcutHash = Get-PortableSha256 $shortcutPath
    themeShortcutHash = Get-PortableSha256 $themeShortcutPath
} | ConvertTo-Json -Compress
[IO.File]::AppendAllText($eventPath, $event + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))

Write-Host "ChatGPT launch adapter is active at $shortcutPath"
Write-Host "The unambiguous themed entry is active at $themeShortcutPath"
if ($defaultShortcut.backup) { Write-Host "The prior shortcut was preserved at $($defaultShortcut.backup)" }
if ($explicitShortcut.backup) { Write-Host "The prior themed entry was preserved at $($explicitShortcut.backup)" }
