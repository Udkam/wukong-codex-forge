[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge')
)

$ErrorActionPreference = 'Stop'
$controlled = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
$target = [IO.Path]::GetFullPath($Destination)
if (-not [string]::Equals($target, $controlled, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Destination must be the managed CODEX_HOME Wukong theme directory.'
}

$eventPath = Join-Path $target 'runtime-events.jsonl'
if (-not (Test-Path -LiteralPath $eventPath)) {
    Write-Host 'No active managed Wukong runtime was recorded; Codex is already using its normal surface.'
    return
}

$events = @(Get-Content -LiteralPath $eventPath -Encoding UTF8 | ForEach-Object {
    if ($_ -and $_.Trim()) { $_ | ConvertFrom-Json }
})
$watching = $events | Where-Object { $_.state -eq 'watching' } | Select-Object -Last 1
if (-not $watching -or -not $watching.disableRequest) {
    Write-Host 'No active managed Wukong watcher was found; retained theme files were not changed.'
    return
}

$requestPath = [IO.Path]::GetFullPath([string]$watching.disableRequest)
$requestPrefix = [IO.Path]::GetFullPath((Join-Path $target 'requests')).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $requestPath.StartsWith($requestPrefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Recorded restore request path is outside the managed requests directory.'
}
[IO.File]::WriteAllText($requestPath, 'restore', [Text.UTF8Encoding]::new($false))
Write-Host 'Requested live restoration to the normal Codex surface. All managed files and prior releases were retained.'
