[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $env:LOCALAPPDATA 'WukongCodexForge'),
    [switch]$CreateShortcut
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
Copy-Item -LiteralPath $source -Destination (Join-Path $target 'app') -Recurse -Force

$shortcutPath = $null
if ($CreateShortcut) {
    $startMenu = [Environment]::GetFolderPath('Programs')
    $shortcutPath = Join-Path $startMenu 'ChatGPT - 大圣主题.lnk'
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

Write-Host "Installed managed copy at $target. WindowsApps, app.asar, and Codex config were not modified."
if ($shortcutPath) { Write-Host "Created managed launcher: $shortcutPath" }
