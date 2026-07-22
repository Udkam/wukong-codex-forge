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

$rootPath = [IO.Path]::GetFullPath($Root)
$packageDefinition = Join-Path $rootPath 'package.json'
$launcherPath = Join-Path $rootPath 'scripts\launch.ps1'
if (-not (Test-Path -LiteralPath $packageDefinition) -or -not (Test-Path -LiteralPath $launcherPath)) {
    throw 'Wukong theme package is incomplete; the ChatGPT launch adapter was not installed.'
}
$themePackage = Get-Content -LiteralPath $packageDefinition -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$themePackage.name -ne 'wukong-codex-forge') {
    throw 'Wukong theme package marker is invalid.'
}

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$chatGpt = Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if (-not (Test-Path -LiteralPath $chatGpt)) { throw 'Official ChatGPT.exe was not found.' }

$programs = [Environment]::GetFolderPath('Programs')
$shortcutPath = Join-Path $programs 'ChatGPT.lnk'
$adapterRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge'))
$historyRoot = Join-Path $adapterRoot 'shortcut-backups'
$bridgeRoot = Join-Path $adapterRoot 'launcher-bridges'
$eventPath = Join-Path $adapterRoot 'shortcut-hook-events.jsonl'
New-Item -ItemType Directory -Force -Path $historyRoot | Out-Null
New-Item -ItemType Directory -Force -Path $bridgeRoot | Out-Null

$escapedRoot = $rootPath.Replace("'", "''")
$portableSwitch = if ($Portable) { ' -Portable' } else { '' }
$managedProfile = if ($Portable) {
    Join-Path $rootPath '.wukong-runtime\profile'
} else {
    [IO.Path]::GetFullPath((Join-Path ([Environment]::GetFolderPath('ApplicationData')) 'Codex\web\Codex'))
}
$escapedProfile = $managedProfile.Replace("'", "''")
$portableLiteral = if ($Portable) { '$true' } else { '$false' }
$managedPredicate = if ($Portable) {
    "`$_.CommandLine.IndexOf(`$profile, [StringComparison]::OrdinalIgnoreCase) -ge 0"
} else {
    "`$_.CommandLine -notmatch '(?:^|\s)--user-data-dir(?:=|\s)'"
}
$bridgeScript = @"
`$ErrorActionPreference = 'Stop'
`$themeRoot = '$escapedRoot'
`$launcher = Join-Path `$themeRoot 'scripts\launch.ps1'
`$marker = Join-Path `$themeRoot 'package.json'
`$profile = '$escapedProfile'
`$portable = $portableLiteral
`$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
`$official = if (`$package) { Join-Path `$package.InstallLocation 'app\ChatGPT.exe' } else { `$null }
function Invoke-OfficialManagedActivation {
    if (`$portable) {
        `$previousUserDataPath = `$env:CODEX_ELECTRON_USER_DATA_PATH
        try {
            `$env:CODEX_ELECTRON_USER_DATA_PATH = `$profile
            Start-Process -FilePath `$official -ArgumentList @("--user-data-dir=```"`$profile```"", 'codex://launch') | Out-Null
        }
        finally {
            if (`$null -eq `$previousUserDataPath) { [Environment]::SetEnvironmentVariable('CODEX_ELECTRON_USER_DATA_PATH', `$null, 'Process') }
            else { `$env:CODEX_ELECTRON_USER_DATA_PATH = `$previousUserDataPath }
        }
    } else {
        Start-Process -FilePath `$official -ArgumentList 'codex://launch' | Out-Null
    }
}
function Wait-ForManagedMainWindow([int]`$ManagedProcessId, [int]`$Seconds) {
    `$deadline = [DateTime]::UtcNow.AddSeconds(`$Seconds)
    while ([DateTime]::UtcNow -lt `$deadline) {
        `$managedProcess = Get-Process -Id `$ManagedProcessId -ErrorAction SilentlyContinue
        if (`$managedProcess -and `$managedProcess.MainWindowHandle -ne 0) { return `$true }
        Start-Sleep -Milliseconds 250
    }
    return `$false
}
`$managed = @(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue | Where-Object {
    `$_.CommandLine -and
    `$_.CommandLine -notmatch '(?:^|\s)--type=' -and
    $managedPredicate
})
`$watching = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    `$_.CommandLine -and `$_.CommandLine.IndexOf(`$themeRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0 -and `$_.CommandLine -match 'runtime[\\/]watch\.mjs'
})
if (`$managed.Count -eq 1 -and `$watching.Count -ge 1 -and `$official -and (Test-Path -LiteralPath `$official)) {
    Invoke-OfficialManagedActivation
    if (Wait-ForManagedMainWindow -ManagedProcessId `$managed[0].ProcessId -Seconds 6) { exit 0 }
    Invoke-OfficialManagedActivation
    if (Wait-ForManagedMainWindow -ManagedProcessId `$managed[0].ProcessId -Seconds 6) { exit 0 }
    exit 4
}
if ((Test-Path -LiteralPath `$launcher) -and (Test-Path -LiteralPath `$marker)) {
    try {
        & `$launcher -Root `$themeRoot$portableSwitch
        exit 0
    }
    catch {
        `$managed = @(Get-CimInstance Win32_Process -Filter "Name='ChatGPT.exe'" -ErrorAction SilentlyContinue | Where-Object {
            `$_.CommandLine -and
            `$_.CommandLine -notmatch '(?:^|\s)--type=' -and
            $managedPredicate
        })
        if (`$managed.Count -gt 0 -and `$official -and (Test-Path -LiteralPath `$official)) {
            Invoke-OfficialManagedActivation
            exit 1
        }
    }
}
if (-not `$package) { exit 2 }
if (-not (Test-Path -LiteralPath `$official)) { exit 3 }
Start-Process -FilePath `$official | Out-Null
"@
$bridgeTokens = $null
$bridgeErrors = $null
[Management.Automation.Language.Parser]::ParseInput($bridgeScript, [ref]$bridgeTokens, [ref]$bridgeErrors) | Out-Null
if ($bridgeErrors.Count -gt 0) {
    throw "Generated ChatGPT launch bridge is invalid: $($bridgeErrors[0].Message)"
}
$bridgeBytes = [Text.Encoding]::UTF8.GetBytes($bridgeScript)
$sha256 = [Security.Cryptography.SHA256]::Create()
try {
    $bridgeId = ([BitConverter]::ToString($sha256.ComputeHash($bridgeBytes))).Replace('-', '').Substring(0, 20).ToLowerInvariant()
}
finally {
    $sha256.Dispose()
}
$bridgePath = Join-Path $bridgeRoot "chatgpt-entry-$bridgeId.ps1"
if (Test-Path -LiteralPath $bridgePath) {
    $existingBridge = [IO.File]::ReadAllText($bridgePath, [Text.Encoding]::UTF8)
    if (-not [string]::Equals($existingBridge, $bridgeScript, [StringComparison]::Ordinal)) {
        do {
            $collisionStamp = (Get-Date).ToString('yyyyMMdd-HHmmss-fffffff')
            $bridgePath = Join-Path $bridgeRoot "chatgpt-entry-$bridgeId-$collisionStamp.ps1"
        } while (Test-Path -LiteralPath $bridgePath)
    }
}
if (-not (Test-Path -LiteralPath $bridgePath)) {
    [IO.File]::WriteAllText($bridgePath, $bridgeScript, [Text.UTF8Encoding]::new($true))
}

$expectedTarget = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$expectedArguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$bridgePath`""
if ($expectedArguments.Length -ge 900) {
    throw 'ChatGPT launch adapter arguments exceed the safe Windows shortcut limit.'
}

$shell = New-Object -ComObject WScript.Shell
$alreadyCurrent = $false
if (Test-Path -LiteralPath $shortcutPath) {
    $current = $shell.CreateShortcut($shortcutPath)
    $alreadyCurrent = (
        [string]::Equals([IO.Path]::GetFullPath($current.TargetPath), [IO.Path]::GetFullPath($expectedTarget), [StringComparison]::OrdinalIgnoreCase) -and
        [string]::Equals($current.Arguments, $expectedArguments, [StringComparison]::Ordinal)
    )
}

$backupPath = $null
if (-not $alreadyCurrent) {
    if (Test-Path -LiteralPath $shortcutPath) {
        $stamp = (Get-Date).ToString('yyyyMMdd-HHmmss-fffffff')
        $backupPath = Join-Path $historyRoot "ChatGPT-before-wukong-$stamp.lnk"
        Copy-Item -LiteralPath $shortcutPath -Destination $backupPath
    }
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $expectedTarget
    $shortcut.Arguments = $expectedArguments
    $shortcut.WorkingDirectory = $env:USERPROFILE
    $shortcut.IconLocation = "$chatGpt,0"
    $shortcut.Description = 'ChatGPT - Wukong Codex Forge launch adapter'
    $shortcut.WindowStyle = 7
    $shortcut.Save()
}

$event = [ordered]@{
    at = (Get-Date).ToString('o')
    managedBy = 'WukongCodexForgeLaunchAdapter'
    shortcutPath = $shortcutPath
    themeRoot = $rootPath
    portable = [bool]$Portable
    bridgePath = $bridgePath
    bridgeHash = Get-PortableSha256 $bridgePath
    shortcutArgumentsLength = $expectedArguments.Length
    changed = -not $alreadyCurrent
    preservedBackup = $backupPath
    shortcutHash = Get-PortableSha256 $shortcutPath
} | ConvertTo-Json -Compress
[IO.File]::AppendAllText($eventPath, $event + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))

Write-Host "ChatGPT launch adapter is active at $shortcutPath"
if ($backupPath) { Write-Host "The prior shortcut was preserved at $backupPath" }
