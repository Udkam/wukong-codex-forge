[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'),
    [switch]$NoShortcut
)

$ErrorActionPreference = 'Stop'
$controlled = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.codex\themes\wukong-codex-forge'))
$target = [IO.Path]::GetFullPath($Destination)
if (-not [string]::Equals($target, $controlled, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Destination must be the managed CODEX_HOME themes\wukong-codex-forge directory.'
}

$source = Split-Path $PSScriptRoot -Parent
$packageJson = Get-Content -LiteralPath (Join-Path $source 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$version = [string]$packageJson.version
$stamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$releaseId = "$version-$stamp"
$releaseRoot = Join-Path (Join-Path $target 'releases') $releaseId
$appTarget = Join-Path $releaseRoot 'app'
$historyRoot = Join-Path $target 'history'
$releasesRoot = Join-Path $target 'releases'
$requestsRoot = Join-Path $target 'requests'
$profileRoot = Join-Path $target 'profile'

foreach ($required in @(
    (Join-Path $source 'scripts\package-runtime.mjs'),
    (Join-Path $source 'scripts\native-theme.mjs'),
    (Join-Path $source 'scripts\launch.ps1'),
    (Join-Path $source 'scripts\install-native-pets.ps1'),
    (Join-Path $source 'scripts\install-chatgpt-hook.ps1')
)) {
    if (-not (Test-Path -LiteralPath $required)) { throw "Required install file is missing: $required" }
}

foreach ($managedPath in @($target, $historyRoot, $releasesRoot, $requestsRoot, $profileRoot)) {
    if (Test-Path -LiteralPath $managedPath) {
        $targetItem = Get-Item -LiteralPath $managedPath -Force
        if ($targetItem.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "Refusing install: managed path is a reparse point: $managedPath"
        }
    }
}

New-Item -ItemType Directory -Force -Path $target | Out-Null
New-Item -ItemType Directory -Force -Path $historyRoot | Out-Null
New-Item -ItemType Directory -Path $releaseRoot | Out-Null

$package = Get-AppxPackage -Name 'OpenAI.Codex' | Select-Object -First 1
if (-not $package) { throw 'Official OpenAI.Codex Store package was not found.' }
$node = Join-Path $package.InstallLocation 'app\resources\cua_node\bin\node.exe'
if (-not (Test-Path -LiteralPath $node)) { throw 'The Node runtime bundled with OpenAI.Codex was not found.' }
$packager = Join-Path $source 'scripts\package-runtime.mjs'
& $node $packager --source $source --destination $appTarget
if ($LASTEXITCODE -ne 0) {
    throw "Managed runtime packaging failed; the incomplete release was retained at $releaseRoot."
}

$release = [ordered]@{
    managedBy = 'WukongCodexForgeAppendOnlyRelease'
    version = $version
    releaseId = $releaseId
    installedAt = (Get-Date).ToString('o')
    appPath = $appTarget
    sourcePath = $source
}
[IO.File]::WriteAllText(
    (Join-Path $releaseRoot 'release.json'),
    (($release | ConvertTo-Json -Depth 8) + [Environment]::NewLine),
    [Text.UTF8Encoding]::new($false)
)

& (Join-Path $appTarget 'scripts\install-native-pets.ps1') -Root $appTarget

if (-not $NoShortcut) {
    & (Join-Path $source 'scripts\install-chatgpt-hook.ps1') -Root $appTarget
}

# Preserve evidence from any legacy color-token installation without changing the user's
# current Codex configuration. The runtime-only theme never writes config.toml.
$legacyStatePath = Join-Path $target 'state.json'
$configPath = Join-Path $env:USERPROFILE '.codex\config.toml'
$priorRuntimeOnlyMigration = @(
    Get-ChildItem -LiteralPath $historyRoot -Filter 'config-before-runtime-only-*.toml' -File -ErrorAction SilentlyContinue
).Count -gt 0
if (-not $priorRuntimeOnlyMigration -and (Test-Path -LiteralPath $legacyStatePath) -and (Test-Path -LiteralPath $configPath)) {
    $legacyState = Get-Content -LiteralPath $legacyStatePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($legacyState.managedBy -eq 'WukongCodexForgeNativeTheme') {
        Copy-Item -LiteralPath $configPath -Destination (Join-Path $historyRoot "config-before-runtime-only-$stamp.toml")
        Copy-Item -LiteralPath $legacyStatePath -Destination (Join-Path $historyRoot "state-before-runtime-only-$stamp.json")
        Write-Warning 'Legacy theme state was detected and preserved. The runtime-only installer did not change config.toml.'
    }
}

Write-Host "Installed retained Wukong release $releaseId at $releaseRoot."
Write-Host 'No existing file or directory was deleted; prior releases, state, assets and research files remain in place.'
Write-Host 'WindowsApps, app.asar and ChatGPT.exe were not modified.'
Write-Host 'No external Node.js or npm installation is required; the launcher uses the runtime bundled with OpenAI.Codex.'
Write-Host "Start this release with: $appTarget\start-theme.cmd"
if (-not $NoShortcut) {
    Write-Host 'The user Start Menu ChatGPT shortcut now uses the retained launch adapter; its prior content was copied to append-only history first.'
    Write-Host 'If this release directory is absent, the adapter falls back to the current official ChatGPT.exe.'
}
