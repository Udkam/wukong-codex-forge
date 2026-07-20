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

foreach ($required in @(
    (Join-Path $source 'scripts\package-runtime.mjs'),
    (Join-Path $source 'scripts\native-theme.mjs'),
    (Join-Path $source 'scripts\launch.ps1')
)) {
    if (-not (Test-Path -LiteralPath $required)) { throw "Required install file is missing: $required" }
}

if (Test-Path -LiteralPath $target) {
    $targetItem = Get-Item -LiteralPath $target -Force
    if ($targetItem.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw 'Refusing install: the managed theme path is a reparse point.'
    }
}

New-Item -ItemType Directory -Force -Path $target | Out-Null
New-Item -ItemType Directory -Force -Path $historyRoot | Out-Null
New-Item -ItemType Directory -Path $releaseRoot | Out-Null

$node = (Get-Command node -ErrorAction Stop).Source
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

# Migrate the legacy color-token installer back to the user's recorded native values.
# Full pre-migration files are copied to append-only history before the key-level restore.
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
        & $node (Join-Path $source 'scripts\native-theme.mjs') restore --config $configPath --destination $target
        if ($LASTEXITCODE -ne 0) {
            throw 'Legacy native color restore failed; preserved copies are available in the managed history directory.'
        }
    }
}

$shortcutPath = $null
if (-not $NoShortcut) {
    $programs = [Environment]::GetFolderPath('Programs')
    $baseName = "Codex - Wukong Theme $version"
    $shortcutPath = Join-Path $programs ($baseName + '.lnk')
    if (Test-Path -LiteralPath $shortcutPath) {
        $shortcutPath = Join-Path $programs ("$baseName $stamp.lnk")
    }
    $powerShell = (Get-Command powershell.exe -ErrorAction Stop).Source
    $launchScript = Join-Path $appTarget 'scripts\launch.ps1'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $powerShell
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launchScript`" -Root `"$appTarget`""
    $shortcut.WorkingDirectory = $appTarget
    $shortcut.Description = 'Launch Codex with the Wukong battle-and-scenery style layer'
    $shortcut.Save()
}

Write-Host "Installed retained Wukong release $releaseId at $releaseRoot."
Write-Host 'No existing file or directory was deleted; prior releases, state, assets and research files remain in place.'
Write-Host 'WindowsApps, app.asar, ChatGPT.exe and the official Codex shortcut were not modified.'
if ($shortcutPath) { Write-Host "Created launcher: $shortcutPath" }
