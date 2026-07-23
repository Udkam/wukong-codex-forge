[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Root
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

function Assert-DirectPath([string]$Path, [string]$Label) {
    $item = Get-Item -LiteralPath $Path -Force -ErrorAction Stop
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Launch adapter verification refused a reparse point for ${Label}: $Path"
    }
}

$rootPath = [IO.Path]::GetFullPath($Root)
$markerPath = Join-Path $rootPath 'package.json'
$launcherPath = Join-Path $rootPath 'scripts\launch.ps1'
if (-not (Test-Path -LiteralPath $markerPath) -or -not (Test-Path -LiteralPath $launcherPath)) {
    throw 'Launch adapter verification failed: retained theme root is incomplete.'
}
Assert-DirectPath -Path $rootPath -Label 'theme root'
Assert-DirectPath -Path $markerPath -Label 'package marker'
Assert-DirectPath -Path $launcherPath -Label 'launcher'
$marker = Get-Content -LiteralPath $markerPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$marker.name -ne 'wukong-codex-forge') {
    throw 'Launch adapter verification failed: package marker name is invalid.'
}

$programs = [Environment]::GetFolderPath('Programs')
$shortcutPath = Join-Path $programs 'ChatGPT.lnk'
$themeShortcutPath = Join-Path $programs 'ChatGPT - Wukong Theme.lnk'
$adapterRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge'))
$eventPath = Join-Path $adapterRoot 'shortcut-hook-events.jsonl'
foreach ($path in @($shortcutPath, $themeShortcutPath, $eventPath)) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Launch adapter verification failed: required path is missing: $path"
    }
    Assert-DirectPath -Path $path -Label 'adapter evidence'
}

$shell = New-Object -ComObject WScript.Shell
$defaultShortcut = $shell.CreateShortcut($shortcutPath)
$themeShortcut = $shell.CreateShortcut($themeShortcutPath)
$expectedTarget = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
foreach ($entry in @(
    [pscustomobject]@{ Name = 'ChatGPT'; Shortcut = $defaultShortcut },
    [pscustomobject]@{ Name = 'ChatGPT - Wukong Theme'; Shortcut = $themeShortcut }
)) {
    if (-not [string]::Equals(
        [IO.Path]::GetFullPath($entry.Shortcut.TargetPath),
        [IO.Path]::GetFullPath($expectedTarget),
        [StringComparison]::OrdinalIgnoreCase
    )) {
        throw "Launch adapter verification failed: $($entry.Name) target is not the retained bridge host."
    }
}
if (-not [string]::Equals($defaultShortcut.Arguments, $themeShortcut.Arguments, [StringComparison]::Ordinal)) {
    throw 'Launch adapter verification failed: default and explicit theme entries point to different bridges.'
}
$bridgeMatch = [regex]::Match($defaultShortcut.Arguments, '-File\s+"([^"]+)"')
if (-not $bridgeMatch.Success) {
    throw 'Launch adapter verification failed: shortcut does not contain a quoted bridge path.'
}
$bridgePath = [IO.Path]::GetFullPath($bridgeMatch.Groups[1].Value)
if (-not (Test-Path -LiteralPath $bridgePath)) {
    throw "Launch adapter verification failed: bridge is missing: $bridgePath"
}
Assert-DirectPath -Path $bridgePath -Label 'launcher bridge'
$bridge = [IO.File]::ReadAllText($bridgePath, [Text.Encoding]::UTF8)
$rootMatch = [regex]::Match($bridge, "(?m)^\`$themeRoot = '((?:''|[^'])*)'\s*$")
if (-not $rootMatch.Success) {
    throw 'Launch adapter verification failed: bridge theme root declaration is missing.'
}
$bridgeRoot = [IO.Path]::GetFullPath($rootMatch.Groups[1].Value.Replace("''", "'"))
if (-not [string]::Equals($bridgeRoot, $rootPath, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Launch adapter verification failed: bridge root is stale. Expected $rootPath; found $bridgeRoot"
}

$eventLines = @(Get-Content -LiteralPath $eventPath -Encoding UTF8 | Where-Object { $_.Trim() })
if ($eventLines.Count -eq 0) {
    throw 'Launch adapter verification failed: hook event log is empty.'
}
$latestEvent = $eventLines[-1] | ConvertFrom-Json
if (-not [string]::Equals(
    [IO.Path]::GetFullPath([string]$latestEvent.themeRoot),
    $rootPath,
    [StringComparison]::OrdinalIgnoreCase
)) {
    throw 'Launch adapter verification failed: latest hook event points to a stale release.'
}
if (
    -not [string]::Equals([string]$latestEvent.shortcutPath, $shortcutPath, [StringComparison]::OrdinalIgnoreCase) -or
    -not [string]::Equals([string]$latestEvent.themeShortcutPath, $themeShortcutPath, [StringComparison]::OrdinalIgnoreCase)
) {
    throw 'Launch adapter verification failed: hook event shortcut paths do not match current entries.'
}

$result = [ordered]@{
    verified = $true
    version = [string]$marker.version
    themeRoot = $rootPath
    shortcutPath = $shortcutPath
    themeShortcutPath = $themeShortcutPath
    bridgePath = $bridgePath
    bridgeHash = Get-PortableSha256 $bridgePath
    defaultShortcutHash = Get-PortableSha256 $shortcutPath
    themeShortcutHash = Get-PortableSha256 $themeShortcutPath
    latestHookAt = [string]$latestEvent.at
}
$result | ConvertTo-Json -Compress
