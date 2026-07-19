[CmdletBinding()]param([string]$Destination=(Join-Path $env:LOCALAPPDATA 'WukongCodexForge'))
$ErrorActionPreference='Stop'
$controlled=[IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge'));$target=[IO.Path]::GetFullPath($Destination)
if(-not [string]::Equals($target,$controlled,[StringComparison]::OrdinalIgnoreCase)){throw 'Destination must be the managed LOCALAPPDATA WukongCodexForge directory.'}
if(Test-Path -LiteralPath $target){throw "Managed destination already exists: $target. Restore it first."}
$source=Split-Path $PSScriptRoot -Parent;New-Item -ItemType Directory -Force -Path $target|Out-Null;Copy-Item -LiteralPath $source -Destination (Join-Path $target 'app') -Recurse -Force
$stateJson=[pscustomobject]@{managedBy='WukongCodexForge';installedAt=(Get-Date).ToString('o');destination=$target;cdpAddress='127.0.0.1';state='not-running'}|ConvertTo-Json;[IO.File]::WriteAllText((Join-Path $target 'state.json'),$stateJson,[Text.UTF8Encoding]::new($false))
Write-Host "Installed managed copy at $target. WindowsApps, Codex config, and Wallpaper Engine were not modified."
