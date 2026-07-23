[CmdletBinding()]
param(
    [string]$Root = (Split-Path $PSScriptRoot -Parent)
)

$ErrorActionPreference = 'Stop'
$rootPath = [IO.Path]::GetFullPath($Root)
$releaseMarker = Join-Path (Split-Path $rootPath -Parent) 'release.json'
$portable = -not (Test-Path -LiteralPath $releaseMarker)

& (Join-Path $rootPath 'scripts\install-native-pets.ps1') -Root $rootPath
& (Join-Path $rootPath 'scripts\install-chatgpt-hook.ps1') -Root $rootPath -Portable:$portable
& (Join-Path $rootPath 'scripts\verify-launch-adapter.ps1') -Root $rootPath
& (Join-Path $rootPath 'scripts\launch.ps1') -Root $rootPath -Portable:$portable
