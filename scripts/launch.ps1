[CmdletBinding()]
param(
    [string]$Root = (Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge\app')
)

$ErrorActionPreference = 'Stop'
$managedTheme = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
$managedRoot = [IO.Path]::GetFullPath((Join-Path $managedTheme 'app'))
$managedReleases = [IO.Path]::GetFullPath((Join-Path $managedTheme 'releases'))
$rootPath = [IO.Path]::GetFullPath($Root)
$isLegacyRoot = [string]::Equals($rootPath, $managedRoot, [StringComparison]::OrdinalIgnoreCase)
$releasePrefix = $managedReleases.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$isReleaseRoot = $rootPath.StartsWith($releasePrefix, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $rootPath -Leaf) -eq 'app'
if (-not $isLegacyRoot -and -not $isReleaseRoot) {
    throw 'Launcher only runs from a managed Wukong Codex Forge app or release directory.'
}
if ($isReleaseRoot -and -not (Test-Path -LiteralPath (Join-Path (Split-Path $rootPath -Parent) 'release.json'))) {
    throw 'Managed release marker is missing.'
}
foreach ($required in @('runtime\watch.mjs', 'runtime\injector.mjs', 'themes\active.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $rootPath $required))) {
        throw "Managed runtime file is missing: $required"
    }
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$chatGpt = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if (-not (Test-Path -LiteralPath $chatGpt)) { throw 'ChatGPT.exe was not found inside the registered OpenAI.Codex package.' }
$node = (Get-Command node -ErrorAction Stop).Source

$profilePath = Join-Path $managedTheme 'profile'
$activePortPath = Join-Path $profilePath 'DevToolsActivePort'
New-Item -ItemType Directory -Force -Path $profilePath | Out-Null
$managedProcesses = @(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine.IndexOf($profilePath, [StringComparison]::OrdinalIgnoreCase) -ge 0
})
if ($managedProcesses.Count -gt 0) { throw 'A managed Wukong Codex instance is already running.' }

$sessionId = [Guid]::NewGuid().ToString('N')
$requestDirectory = Join-Path $managedTheme 'requests'
$disableRequest = Join-Path $requestDirectory ("disable-$sessionId.request")
$eventPath = Join-Path $managedTheme 'runtime-events.jsonl'
New-Item -ItemType Directory -Force -Path $requestDirectory | Out-Null

function Write-RuntimeEvent([string]$value, [Nullable[int]]$port) {
    $event = [ordered]@{
        at = (Get-Date).ToString('o')
        session = $sessionId
        state = $value
        port = $port
        appPath = $rootPath
        profilePath = $profilePath
        disableRequest = $disableRequest
    } | ConvertTo-Json -Compress
    [IO.File]::AppendAllText($eventPath, $event + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
}

$launchStartedAt = [DateTime]::UtcNow
Write-RuntimeEvent 'starting' $null
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
    if ($null -eq $previousUserDataPath) { [Environment]::SetEnvironmentVariable('CODEX_ELECTRON_USER_DATA_PATH', $null, 'Process') }
    else { $env:CODEX_ELECTRON_USER_DATA_PATH = $previousUserDataPath }
}

$deadline = [DateTime]::UtcNow.AddSeconds(45)
while ($true) {
    $portReady = (Test-Path -LiteralPath $activePortPath) -and ((Get-Item -LiteralPath $activePortPath).LastWriteTimeUtc -ge $launchStartedAt.AddSeconds(-1))
    if ($portReady) { break }
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
    Write-RuntimeEvent 'watching' $port
    & $node runtime/watch.mjs $port themes/active.json $disableRequest
    if ($LASTEXITCODE -ne 0) { throw "Theme watcher exited with code $LASTEXITCODE." }
}
finally {
    if (Test-Path -LiteralPath $disableRequest) {
        Write-RuntimeEvent 'disabled' $null
    } else {
        if (-not $codexProcess.HasExited) {
            try { & $node runtime/injector.mjs --restore $port | Out-Null }
            catch { }
        }
        Write-RuntimeEvent 'not-running' $null
    }
    Pop-Location
}
