[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $env:LOCALAPPDATA 'WukongCodexForge'),
    [switch]$NoShortcut
)

$ErrorActionPreference = 'Stop'
$controlled = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge'))
$target = [IO.Path]::GetFullPath($Destination)
if (-not [string]::Equals($target, $controlled, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Destination must be the managed LOCALAPPDATA WukongCodexForge directory.'
}
if (Test-Path -LiteralPath $target) {
    throw "Managed destination already exists: $target. Restore it first."
}

$source = Split-Path $PSScriptRoot -Parent
New-Item -ItemType Directory -Force -Path $target | Out-Null
$appTarget = Join-Path $target 'app'
New-Item -ItemType Directory -Force -Path $appTarget | Out-Null
foreach ($directory in @('runtime', 'shared', 'scripts', 'themes', 'assets')) {
    $sourceDirectory = Join-Path $source $directory
    if (-not (Test-Path -LiteralPath $sourceDirectory)) { throw "Required runtime directory is missing: $directory" }
    Copy-Item -LiteralPath $sourceDirectory -Destination (Join-Path $appTarget $directory) -Recurse -Force
}
foreach ($file in @('package.json', 'LICENSE')) {
    Copy-Item -LiteralPath (Join-Path $source $file) -Destination (Join-Path $appTarget $file) -Force
}
$wsSource = Join-Path $source 'node_modules\ws'
if (-not (Test-Path -LiteralPath $wsSource)) {
    throw 'Runtime dependency node_modules\ws is missing. Run npm install before install.ps1.'
}
$managedModules = Join-Path $appTarget 'node_modules'
New-Item -ItemType Directory -Force -Path $managedModules | Out-Null
Copy-Item -LiteralPath $wsSource -Destination (Join-Path $managedModules 'ws') -Recurse -Force

$shortcutPath = $null
if (-not $NoShortcut) {
    $startMenu = [Environment]::GetFolderPath('Programs')
    $shortcutPath = Join-Path $startMenu 'ChatGPT - Wukong Theme.lnk'
    $powerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
    $launchScript = Join-Path $target 'app\scripts\launch.ps1'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $powerShell
    $shortcut.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$launchScript`""
    $shortcut.WorkingDirectory = Join-Path $target 'app'
    $shortcut.Description = 'Launch ChatGPT with the managed Wukong Codex theme lifecycle'
    $shortcut.Save()
}

$state = [pscustomobject]@{
    managedBy = 'WukongCodexForge'
    installedAt = (Get-Date).ToString('o')
    destination = $target
    cdpAddress = '127.0.0.1'
    state = 'not-running'
    shortcutPath = $shortcutPath
}
$stateJson = $state | ConvertTo-Json
[IO.File]::WriteAllText(
    (Join-Path $target 'state.json'),
    $stateJson,
    [Text.UTF8Encoding]::new($false)
)

Write-Host "Installed minimal managed runtime at $target. Studio, tests, Git data, WindowsApps, app.asar, and Codex config were not copied or modified."
if ($shortcutPath) { Write-Host "Created managed launcher: $shortcutPath" }
