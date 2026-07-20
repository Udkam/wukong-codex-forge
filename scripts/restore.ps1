[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)][int]$Port,
    [switch]$Uninstall,
    [string]$Destination = (Join-Path $env:LOCALAPPDATA 'WukongCodexForge')
)

$ErrorActionPreference = 'Stop'
$controlled = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge'))
$target = [IO.Path]::GetFullPath($Destination)
if (-not [string]::Equals($target, $controlled, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing uninstall: Destination is outside the explicitly controlled WukongCodexForge directory.'
}

$app = Join-Path $target 'app'
if ($Port -and (Test-Path -LiteralPath (Join-Path $app 'runtime\injector.mjs'))) {
    Push-Location $app
    try { node runtime/injector.mjs --restore $Port }
    finally { Pop-Location }
}
if (-not $Uninstall) {
    Write-Host 'Restore attempted. Close/reopen ChatGPT if a renderer retains cached styles.'
    return
}
if (-not (Test-Path -LiteralPath $target)) {
    Write-Host 'No managed runtime exists.'
    return
}

$targetItem = Get-Item -LiteralPath $target -Force
if ($targetItem.Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw 'Refusing uninstall: the controlled path is a reparse point.'
}
$statePath = Join-Path $target 'state.json'
if (-not (Test-Path -LiteralPath $statePath)) {
    throw 'Refusing uninstall: missing managed state marker.'
}
$state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
if (
    $state.managedBy -ne 'WukongCodexForge' -or
    -not [string]::Equals(
        [IO.Path]::GetFullPath($state.destination),
        $controlled,
        [StringComparison]::OrdinalIgnoreCase
    )
) {
    throw 'Refusing uninstall: state marker does not match the controlled runtime.'
}

if ($state.shortcutPath) {
    $expectedShortcut = [IO.Path]::GetFullPath(
        (Join-Path ([Environment]::GetFolderPath('Programs')) 'ChatGPT - 大圣主题.lnk')
    )
    $recordedShortcut = [IO.Path]::GetFullPath([string]$state.shortcutPath)
    if (-not [string]::Equals($recordedShortcut, $expectedShortcut, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing uninstall: managed shortcut path does not match the expected Start Menu target.'
    }
    if (Test-Path -LiteralPath $recordedShortcut) {
        Remove-Item -LiteralPath $recordedShortcut -Force
    }
}

Remove-Item -LiteralPath $target -Recurse -Force
Write-Host 'Managed Wukong Codex Forge files and launcher removed. ChatGPT itself was never modified.'
