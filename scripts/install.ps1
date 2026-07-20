[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge')
)

$ErrorActionPreference = 'Stop'
$controlled = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
$target = [IO.Path]::GetFullPath($Destination)
if (-not [string]::Equals($target, $controlled, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Destination must be the managed CODEX_HOME themes\wukong-codex-forge directory.'
}
if ((Test-Path -LiteralPath $target) -and @(Get-ChildItem -LiteralPath $target -Force).Count -gt 0) {
    throw "Native theme destination already contains files: $target. Remove it first."
}

$source = Split-Path $PSScriptRoot -Parent
$configPath = Join-Path $env:USERPROFILE '.codex\config.toml'
$definition = Join-Path $source 'themes\native-wukong.json'
$codexWasRunning = @(Get-Process -Name ChatGPT -ErrorAction SilentlyContinue).Count -gt 0
if (-not (Test-Path -LiteralPath $configPath)) { throw "Codex config was not found: $configPath" }
if (-not (Test-Path -LiteralPath $definition)) { throw 'Native Wukong theme definition is missing.' }

New-Item -ItemType Directory -Force -Path $target | Out-Null
try {
    Copy-Item -LiteralPath $definition -Destination (Join-Path $target 'theme.json') -Force
    Copy-Item -LiteralPath (Join-Path $source 'themes\assets\great-sage-return.jpg') -Destination (Join-Path $target 'preview.jpg') -Force
    Copy-Item -LiteralPath (Join-Path $source 'scripts\native-theme.mjs') -Destination (Join-Path $target 'native-theme.mjs') -Force
    Copy-Item -LiteralPath (Join-Path $source 'LICENSE') -Destination (Join-Path $target 'LICENSE') -Force
    & node (Join-Path $target 'native-theme.mjs') install --config $configPath --definition (Join-Path $target 'theme.json') --destination $target
    if ($LASTEXITCODE -ne 0) { throw 'Native Codex theme install failed.' }
}
catch {
    if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
    throw
}

Write-Host "Installed native Wukong theme at $target. No launcher, port, watcher, sidebar, or Codex package file was added."
if ($codexWasRunning) {
    Write-Warning 'Codex was already running and caches desktop appearance in memory. The files are installed, but open Codex windows do not hot-apply external config changes.'
    Write-Warning 'This Codex build has no public appearance reload deep link. A later Codex launch will read the installed values.'
}
else {
    Write-Host 'Codex will read these desktop appearance settings when it starts.'
}
