[CmdletBinding()]
param(
    [ValidateRange(1024, 65535)][int]$Port = 9222,
    [string]$Root = (Join-Path $env:LOCALAPPDATA 'WukongCodexForge\app')
)

$ErrorActionPreference = 'Stop'
$managedRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge\app'))
$rootPath = [IO.Path]::GetFullPath($Root)
if (-not [string]::Equals($rootPath, $managedRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Launcher only runs from the managed WukongCodexForge app directory.'
}
if (-not (Test-Path -LiteralPath (Join-Path $rootPath 'runtime\watch.mjs'))) {
    throw 'Managed theme watcher is missing.'
}
if (Get-Process -Name ChatGPT -ErrorAction SilentlyContinue) {
    throw 'ChatGPT is already running. Close it, then use the Wukong theme launcher.'
}
if (Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
    throw "Loopback port $Port is already in use."
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$chatGpt = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if (-not (Test-Path -LiteralPath $chatGpt)) { throw 'ChatGPT.exe was not found inside the registered package.' }

$statePath = Join-Path (Split-Path $rootPath -Parent) 'state.json'
function Set-ManagedState([string]$value) {
    if (-not (Test-Path -LiteralPath $statePath)) { return }
    $state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($state.managedBy -ne 'WukongCodexForge') { return }
    $state.state = $value
    $state.lastLaunchAt = (Get-Date).ToString('o')
    [IO.File]::WriteAllText($statePath, ($state | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
}

Set-ManagedState 'starting'
Start-Process -FilePath $chatGpt -ArgumentList @(
    '--remote-debugging-address=127.0.0.1',
    "--remote-debugging-port=$Port"
) | Out-Null

Push-Location $rootPath
try {
    Set-ManagedState 'watching'
    & node runtime/watch.mjs $Port themes/active.json
    if ($LASTEXITCODE -ne 0) { throw "Theme watcher exited with code $LASTEXITCODE." }
}
finally {
    Pop-Location
    Set-ManagedState 'not-running'
}
