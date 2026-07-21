[CmdletBinding()]
param(
    [string]$Root = (Split-Path $PSScriptRoot -Parent),
    [switch]$Portable
)

$ErrorActionPreference = 'Stop'
$controlled = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
$appRoot = [IO.Path]::GetFullPath($Root)
$packageDefinition = Join-Path $appRoot 'package.json'
if (-not (Test-Path -LiteralPath $packageDefinition)) {
    throw 'Theme package marker package.json is missing.'
}
$themePackage = Get-Content -LiteralPath $packageDefinition -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$themePackage.name -ne 'wukong-codex-forge') {
    throw 'Theme package marker is invalid.'
}
$stateRoot = if ($Portable) { Join-Path $appRoot '.wukong-runtime' } else { $controlled }
$injector = Join-Path $appRoot 'runtime\injector.mjs'
if (-not (Test-Path -LiteralPath $injector)) {
    throw "Managed injector is missing: $injector"
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$node = Join-Path $package.InstallLocation 'app\resources\cua_node\bin\node.exe'
if (-not (Test-Path -LiteralPath $node)) { throw 'The Node runtime bundled with OpenAI.Codex was not found.' }

$profilePath = Join-Path $stateRoot 'profile'
$activePortPath = Join-Path $profilePath 'DevToolsActivePort'
$requestDirectory = Join-Path $stateRoot 'requests'
$eventPath = Join-Path $stateRoot 'runtime-events.jsonl'
if (-not (Test-Path -LiteralPath $stateRoot)) {
    Write-Host 'No local Wukong runtime state exists; Codex is already using its native surface.'
    return
}

foreach ($managedPath in @($appRoot, $stateRoot, $profilePath, $requestDirectory)) {
    if (Test-Path -LiteralPath $managedPath) {
        $item = Get-Item -LiteralPath $managedPath -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "Refusing disable: managed path is a reparse point: $managedPath"
        }
    }
}

function Get-ManagedWatcherProcesses {
    return @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -in @('node.exe', 'ChatGPT.exe') -and
        $_.CommandLine -and
        [regex]::IsMatch($_.CommandLine, 'runtime[\\/]watch\.mjs', [Text.RegularExpressions.RegexOptions]::IgnoreCase) -and
        $_.CommandLine.IndexOf($stateRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0
    })
}

$requestPrefix = [IO.Path]::GetFullPath($requestDirectory).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$requests = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$watchers = Get-ManagedWatcherProcesses

$latestBySession = @{}
if ($watchers.Count -gt 0 -and (Test-Path -LiteralPath $eventPath)) {
    foreach ($line in Get-Content -LiteralPath $eventPath -Encoding UTF8) {
        if (-not $line -or -not $line.Trim()) { continue }
        try { $event = $line | ConvertFrom-Json } catch { continue }
        if ($event.session) { $latestBySession[[string]$event.session] = $event }
    }
    foreach ($event in $latestBySession.Values) {
        if ($event.state -eq 'watching' -and $event.disableRequest) {
            try { $candidate = [IO.Path]::GetFullPath([string]$event.disableRequest) } catch { continue }
            if ($candidate.StartsWith($requestPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                [void]$requests.Add($candidate)
            }
        }
    }
}

foreach ($watcher in $watchers) {
    foreach ($match in [regex]::Matches([string]$watcher.CommandLine, '(?:"(?<quoted>[^"]+)"|(?<plain>\S+))')) {
        $value = if ($match.Groups['quoted'].Success) { $match.Groups['quoted'].Value } else { $match.Groups['plain'].Value }
        if (-not $value.EndsWith('.request', [StringComparison]::OrdinalIgnoreCase)) { continue }
        try { $candidate = [IO.Path]::GetFullPath($value) } catch { continue }
        if ($candidate.StartsWith($requestPrefix, [StringComparison]::OrdinalIgnoreCase)) {
            [void]$requests.Add($candidate)
        }
    }
}

foreach ($requestPath in $requests) {
    [IO.File]::AppendAllText(
        $requestPath,
        "restore requested at $((Get-Date).ToString('o'))" + [Environment]::NewLine,
        [Text.UTF8Encoding]::new($false)
    )
}

$watcherDeadline = [DateTime]::UtcNow.AddSeconds(8)
while ((Get-ManagedWatcherProcesses).Count -gt 0 -and [DateTime]::UtcNow -lt $watcherDeadline) {
    Start-Sleep -Milliseconds 250
}
if ((Get-ManagedWatcherProcesses).Count -gt 0) {
    throw 'Managed watcher did not acknowledge the restore request; native state was not claimed.'
}

$managedCodex = @(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine.IndexOf($profilePath, [StringComparison]::OrdinalIgnoreCase) -ge 0
})
$port = $null
if ($managedCodex.Count -gt 0) {
    if (-not (Test-Path -LiteralPath $activePortPath)) {
        throw 'Managed Codex is running, but its loopback theme channel file is missing.'
    }
    $portLine = [IO.File]::ReadAllLines($activePortPath, [Text.Encoding]::UTF8)[0]
    $parsedPort = 0
    if (-not [int]::TryParse($portLine, [ref]$parsedPort) -or $parsedPort -lt 1024 -or $parsedPort -gt 65535) {
        throw 'Managed Codex returned an invalid loopback theme channel port.'
    }
    $port = $parsedPort
    Push-Location $appRoot
    try {
        & $node runtime/injector.mjs --restore $port
        if ($LASTEXITCODE -ne 0) { throw 'Live native restoration failed.' }
        & $node runtime/injector.mjs --assert-native $port
        if ($LASTEXITCODE -ne 0) { throw 'Live native restoration could not be verified.' }
    }
    finally {
        Pop-Location
    }
}

$disableEvent = [ordered]@{
    at = (Get-Date).ToString('o')
    session = 'disable-' + [Guid]::NewGuid().ToString('N')
    state = 'disable-confirmed'
    port = $port
    profilePath = $profilePath
    appPath = $appRoot
    portable = [bool]$Portable
    signaledRequests = @($requests)
    retained = $true
} | ConvertTo-Json -Compress
[IO.File]::AppendAllText($eventPath, $disableEvent + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))

if ($managedCodex.Count -gt 0) {
    Write-Host 'The managed Codex window was restored to verified native DOM state and left open.'
} else {
    Write-Host 'No managed Codex window is running; future normal Codex launches remain native.'
}
Write-Host 'All theme releases, assets, logs and request records were retained.'
