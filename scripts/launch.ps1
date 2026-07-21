[CmdletBinding()]
param(
    [string]$Root = (Split-Path $PSScriptRoot -Parent),
    [switch]$Portable
)

$ErrorActionPreference = 'Stop'
$rootPath = [IO.Path]::GetFullPath($Root)
$packageDefinition = Join-Path $rootPath 'package.json'
if (-not (Test-Path -LiteralPath $packageDefinition)) {
    throw 'Theme package marker package.json is missing.'
}
$themePackage = Get-Content -LiteralPath $packageDefinition -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$themePackage.name -ne 'wukong-codex-forge') {
    throw 'Theme package marker is invalid.'
}

$managedTheme = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
if ($Portable) {
    $stateRoot = Join-Path $rootPath '.wukong-runtime'
} else {
    $managedRoot = [IO.Path]::GetFullPath((Join-Path $managedTheme 'app'))
    $managedReleases = [IO.Path]::GetFullPath((Join-Path $managedTheme 'releases'))
    $releasePrefix = $managedReleases.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    $isLegacyRoot = [string]::Equals($rootPath, $managedRoot, [StringComparison]::OrdinalIgnoreCase)
    $isReleaseRoot = $rootPath.StartsWith($releasePrefix, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path $rootPath -Leaf) -eq 'app'
    if (-not $isLegacyRoot -and -not $isReleaseRoot) {
        throw 'Managed launcher only runs from a retained Wukong release; use start-theme.cmd for portable mode.'
    }
    if ($isReleaseRoot -and -not (Test-Path -LiteralPath (Join-Path (Split-Path $rootPath -Parent) 'release.json'))) {
        throw 'Managed release marker is missing.'
    }
    $stateRoot = $managedTheme
}
foreach ($required in @('runtime\watch.mjs', 'runtime\injector.mjs', 'themes\active.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $rootPath $required))) {
        throw "Managed runtime file is missing: $required"
    }
}

foreach ($managedPath in @($rootPath, $stateRoot, (Join-Path $stateRoot 'profile'), (Join-Path $stateRoot 'requests'))) {
    if (Test-Path -LiteralPath $managedPath) {
        $item = Get-Item -LiteralPath $managedPath -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "Refusing launch: managed path is a reparse point: $managedPath"
        }
    }
}

# A named process mutex closes the double-click race without creating or deleting a lock file.
$hashAlgorithm = [Security.Cryptography.SHA256]::Create()
try {
    $stateHashBytes = $hashAlgorithm.ComputeHash([Text.Encoding]::UTF8.GetBytes($stateRoot.ToLowerInvariant()))
}
finally {
    $hashAlgorithm.Dispose()
}
$stateHash = ([BitConverter]::ToString($stateHashBytes)).Replace('-', '').Substring(0, 24)
$launchMutex = [Threading.Mutex]::new($false, "Local\WukongCodexForge-$stateHash")
$launchMutexAcquired = $launchMutex.WaitOne(0)
if (-not $launchMutexAcquired) {
    $launchMutex.Dispose()
    throw 'This Wukong theme package is already starting or watching a Codex window.'
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$chatGpt = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if (-not (Test-Path -LiteralPath $chatGpt)) { throw 'ChatGPT.exe was not found inside the registered OpenAI.Codex package.' }
$node = Join-Path $package.InstallLocation 'app\resources\cua_node\bin\node.exe'
if (-not (Test-Path -LiteralPath $node)) { throw 'The Node runtime bundled with OpenAI.Codex was not found.' }

$profilePath = Join-Path $stateRoot 'profile'
$activePortPath = Join-Path $profilePath 'DevToolsActivePort'
New-Item -ItemType Directory -Force -Path $profilePath | Out-Null
$managedProcesses = @(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and
    $_.CommandLine.IndexOf($profilePath, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and
    $_.CommandLine -notmatch '(?:^|\s)--type='
})
if ($managedProcesses.Count -gt 1) { throw 'Multiple managed Wukong Codex root processes were found; refusing an ambiguous attach.' }
$reuseManagedProcess = $managedProcesses.Count -eq 1

$sessionId = [Guid]::NewGuid().ToString('N')
$requestDirectory = Join-Path $stateRoot 'requests'
$disableRequest = Join-Path $requestDirectory ("disable-$sessionId.request")
$eventPath = Join-Path $stateRoot 'runtime-events.jsonl'
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
if ($reuseManagedProcess) {
    Write-RuntimeEvent 'reattaching' $null
    $codexProcess = Get-Process -Id $managedProcesses[0].ProcessId -ErrorAction Stop
}
else {
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
}

$deadline = [DateTime]::UtcNow.AddSeconds(45)
while ($true) {
    $portReady = (Test-Path -LiteralPath $activePortPath) -and (
        $reuseManagedProcess -or
        (Get-Item -LiteralPath $activePortPath).LastWriteTimeUtc -ge $launchStartedAt.AddSeconds(-1)
    )
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

    # The browser port can become reachable before the Codex page target exists.
    # Do not report a watching session until one renderer has accepted and verified
    # the full theme payload.
    $applyDeadline = [DateTime]::UtcNow.AddSeconds(20)
    $lastApplyOutput = @()
    while ($true) {
        $lastApplyOutput = @(& $node runtime/injector.mjs --apply $port themes/active.json 2>&1)
        if ($LASTEXITCODE -eq 0) { break }
        if ($codexProcess.HasExited) { throw 'Codex exited before the theme reached a verified renderer state.' }
        if ([DateTime]::UtcNow -ge $applyDeadline) {
            throw "Timed out waiting for a verified Codex theme surface: $($lastApplyOutput -join ' ')"
        }
        Start-Sleep -Milliseconds 350
    }
    Write-RuntimeEvent 'watching' $port
    & $node runtime/watch.mjs $port themes/active.json $disableRequest
    if ($LASTEXITCODE -ne 0) { throw "Theme watcher exited with code $LASTEXITCODE." }
}
finally {
    if (Test-Path -LiteralPath $disableRequest) {
        if ($codexProcess.HasExited) {
            Write-RuntimeEvent 'disabled-on-exit' $null
        } else {
            & $node runtime/injector.mjs --assert-native $port
            if ($LASTEXITCODE -ne 0) {
                Write-RuntimeEvent 'disable-failed' $port
                throw 'Theme watcher stopped after a disable request, but native DOM state was not verified.'
            }
            Write-RuntimeEvent 'disabled-confirmed' $port
        }
    } else {
        if (-not $codexProcess.HasExited) {
            try { & $node runtime/injector.mjs --restore $port | Out-Null }
            catch { }
        }
        Write-RuntimeEvent 'not-running' $null
    }
    Pop-Location
}

[GC]::KeepAlive($launchMutex)
$launchMutex.ReleaseMutex()
$launchMutex.Dispose()
