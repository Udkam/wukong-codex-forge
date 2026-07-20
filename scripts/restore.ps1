[CmdletBinding()]
param(
    [switch]$Uninstall,
    [string]$Destination = (Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge')
)

$ErrorActionPreference = 'Stop'
$controlled = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
$target = [IO.Path]::GetFullPath($Destination)
if (-not [string]::Equals($target, $controlled, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Refusing uninstall: Destination is outside the managed CODEX_HOME Wukong theme directory.'
}
if (-not (Test-Path -LiteralPath $target)) {
    Write-Host 'No native Wukong theme is installed.'
    return
}

$targetItem = Get-Item -LiteralPath $target -Force
if ($targetItem.Attributes -band [IO.FileAttributes]::ReparsePoint) {
    throw 'Refusing uninstall: the managed theme path is a reparse point.'
}
$statePath = Join-Path $target 'state.json'
$enginePath = Join-Path $target 'native-theme.mjs'
if (-not (Test-Path -LiteralPath $statePath) -or -not (Test-Path -LiteralPath $enginePath)) {
    throw 'Refusing uninstall: managed native theme files are incomplete.'
}

$configPath = Join-Path $env:USERPROFILE '.codex\config.toml'
& node $enginePath restore --config $configPath --destination $target
if ($LASTEXITCODE -ne 0) { throw 'Native Codex theme restore failed.' }

if ($Uninstall) {
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Host 'Removed the native Wukong theme and restored its prior Codex appearance values.'
} else {
    Write-Host 'Restored the prior Codex appearance values; the installed theme files remain.'
}
