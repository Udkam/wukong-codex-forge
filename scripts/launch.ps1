[CmdletBinding()]
param(
    [string]$Root = (Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge\app')
)

$ErrorActionPreference = 'Stop'
$managedTheme = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
$managedRoot = [IO.Path]::GetFullPath((Join-Path $managedTheme 'app'))
$rootPath = [IO.Path]::GetFullPath($Root)
if (-not [string]::Equals($rootPath, $managedRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Launcher only runs from the managed Wukong Codex Forge app directory.'
}
foreach ($required in @('runtime\watch.mjs', 'runtime\injector.mjs', 'themes\active.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $rootPath $required))) {
        throw "Managed runtime file is missing: $required"
    }
}
if (Get-Process -Name ChatGPT -ErrorAction SilentlyContinue) {
    throw 'Codex is already running. Close it before using the Wukong theme launcher.'
}

$statePath = Join-Path $managedTheme 'state.json'
$state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($state.managedBy -ne 'WukongCodexForgeNativeTheme' -or $state.runtime.managedBy -ne 'WukongCodexForgeRuntime') {
    throw 'Managed theme state marker is invalid.'
}
if (-not [string]::Equals([IO.Path]::GetFullPath([string]$state.destination), $managedTheme, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Managed theme state destination is invalid.'
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$chatGpt = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if (-not (Test-Path -LiteralPath $chatGpt)) { throw 'ChatGPT.exe was not found inside the registered OpenAI.Codex package.' }
$node = (Get-Command node -ErrorAction Stop).Source

$profilePath = Join-Path $managedTheme 'profile'
$activePortPath = Join-Path $profilePath 'DevToolsActivePort'
$disableRequest = Join-Path $managedTheme 'disable.request'
New-Item -ItemType Directory -Force -Path $profilePath | Out-Null
if (Test-Path -LiteralPath $activePortPath) { Remove-Item -LiteralPath $activePortPath -Force }
if (Test-Path -LiteralPath $disableRequest) { Remove-Item -LiteralPath $disableRequest -Force }

function Set-ManagedRuntimeState([string]$value, [Nullable[int]]$port) {
    $current = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($current.managedBy -ne 'WukongCodexForgeNativeTheme' -or $current.runtime.managedBy -ne 'WukongCodexForgeRuntime') { return }
    $current.runtime.state = $value
    $current.runtime.lastLaunchAt = (Get-Date).ToString('o')
    $current.runtime.port = $port
    [IO.File]::WriteAllText($statePath, ($current | ConvertTo-Json -Depth 12), [Text.UTF8Encoding]::new($false))
}

Set-ManagedRuntimeState 'starting' $null
$previousUserDataPath = $env:CODEX_ELECTRON_USER_DATA_PATH
try {
    $env:CODEX_ELECTRON_USER_DATA_PATH = $profilePath
    $codexProcess = Start-Process -FilePath $chatGpt -ArgumentList @(
        '--remote-debugging-address=127.0.0.1',
        '--remote-debugging-port=0',
        "--user-data-dir=`"$profilePath`""
    ) -PassThru
}
finally {
    if ($null -eq $previousUserDataPath) { Remove-Item Env:CODEX_ELECTRON_USER_DATA_PATH -ErrorAction SilentlyContinue }
    else { $env:CODEX_ELECTRON_USER_DATA_PATH = $previousUserDataPath }
}

$deadline = [DateTime]::UtcNow.AddSeconds(45)
while (-not (Test-Path -LiteralPath $activePortPath)) {
    if ($codexProcess.HasExited) { throw 'Codex exited before its local theme channel became ready.' }
    if ([DateTime]::UtcNow -ge $deadline) { throw 'Timed out waiting for the local Codex theme channel.' }
    Start-Sleep -Milliseconds 250
}
$portLine = [IO.File]::ReadAllLines($activePortPath, [Text.Encoding]::UTF8)[0]
$port = 0
if (-not [int]::TryParse($portLine, [ref]$port) -or $port -lt 1024 -or $port -gt 65535) {
    throw 'Codex returned an invalid loopback theme channel port.'
}

Push-Location $rootPath
try {
    & $node runtime/injector.mjs --verify $port
    if ($LASTEXITCODE -ne 0) { throw 'Codex loopback theme channel verification failed.' }
    Set-ManagedRuntimeState 'watching' $port
    & $node runtime/watch.mjs $port themes/active.json $disableRequest
    if ($LASTEXITCODE -ne 0) { throw "Theme watcher exited with code $LASTEXITCODE." }
}
finally {
    if (Test-Path -LiteralPath $disableRequest) {
        Set-ManagedRuntimeState 'disabled' $null
    } else {
        if (-not $codexProcess.HasExited) {
            try { & $node runtime/injector.mjs --restore $port | Out-Null }
            catch { }
        }
        Set-ManagedRuntimeState 'not-running' $null
    }
    Pop-Location
}
