[CmdletBinding()]
param(
    [string]$Root = (Split-Path $PSScriptRoot -Parent),
    [string]$CodexHome = ''
)

$ErrorActionPreference = 'Stop'

function Get-PortableSha256([string]$Path) {
    $stream = [IO.File]::OpenRead($Path)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try {
        return ([BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $stream.Dispose()
        $algorithm.Dispose()
    }
}

function Get-BytesSha256([byte[]]$Bytes) {
    $algorithm = [Security.Cryptography.SHA256]::Create()
    try {
        return ([BitConverter]::ToString($algorithm.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $algorithm.Dispose()
    }
}

function Get-WebpDimensions([string]$Path) {
    $bytes = [IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -lt 30) { throw "Hatch Pet atlas is not a complete WebP file: $Path" }
    $ascii = [Text.Encoding]::ASCII
    if ($ascii.GetString($bytes, 0, 4) -ne 'RIFF' -or $ascii.GetString($bytes, 8, 4) -ne 'WEBP') {
        throw "Hatch Pet atlas is not WebP: $Path"
    }

    $declaredLength = [uint64]([BitConverter]::ToUInt32($bytes, 4)) + 8
    if ($declaredLength -ne [uint64]$bytes.Length) {
        throw "Hatch Pet atlas has an invalid RIFF length: $Path"
    }

    $codec = $ascii.GetString($bytes, 12, 4)
    $chunkLength = [uint64]([BitConverter]::ToUInt32($bytes, 16))
    $paddedChunkEnd = [uint64]20 + $chunkLength + ($chunkLength % 2)
    if ($paddedChunkEnd -gt [uint64]$bytes.Length) {
        throw "Hatch Pet atlas has a truncated ${codec} chunk: $Path"
    }
    if ($codec -eq 'VP8X') {
        if ($chunkLength -lt 10) { throw "Hatch Pet VP8X atlas header is incomplete: $Path" }
        $width = 1 + $bytes[24] + ($bytes[25] -shl 8) + ($bytes[26] -shl 16)
        $height = 1 + $bytes[27] + ($bytes[28] -shl 8) + ($bytes[29] -shl 16)
    }
    elseif ($codec -eq 'VP8L') {
        if ($chunkLength -lt 5) { throw "Hatch Pet VP8L atlas header is incomplete: $Path" }
        if ($bytes[20] -ne 0x2f) { throw "Hatch Pet VP8L atlas header is invalid: $Path" }
        $width = 1 + $bytes[21] + (($bytes[22] -band 0x3f) -shl 8)
        $height = 1 + (($bytes[22] -shr 6) -bor ($bytes[23] -shl 2) -bor (($bytes[24] -band 0x0f) -shl 10))
    }
    elseif ($codec -eq 'VP8 ') {
        if ($chunkLength -lt 10) { throw "Hatch Pet VP8 atlas frame header is incomplete: $Path" }
        if ($bytes[23] -ne 0x9d -or $bytes[24] -ne 0x01 -or $bytes[25] -ne 0x2a) {
            throw "Hatch Pet VP8 atlas frame header is invalid: $Path"
        }
        $width = ($bytes[26] -bor ($bytes[27] -shl 8)) -band 0x3fff
        $height = ($bytes[28] -bor ($bytes[29] -shl 8)) -band 0x3fff
    }
    else {
        throw "Unsupported Hatch Pet WebP codec ${codec}: $Path"
    }

    return [pscustomobject]@{
        format = 'WEBP'
        codec = $codec.Trim()
        width = [int]$width
        height = [int]$height
    }
}

function Assert-DirectFile([string]$Path, [string]$Label) {
    $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    if (-not $item -or $item.PSIsContainer) { throw "${Label} is missing: $Path" }
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Refusing a linked ${Label}: $Path"
    }
    return $item
}

function Assert-NoReparseSegments([string]$Path, [string]$Label) {
    $fullPath = [IO.Path]::GetFullPath($Path)
    $pathRoot = [IO.Path]::GetPathRoot($fullPath)
    $cursor = $pathRoot
    $relative = $fullPath.Substring($pathRoot.Length)
    foreach ($segment in @($relative.Split([IO.Path]::DirectorySeparatorChar, [StringSplitOptions]::RemoveEmptyEntries))) {
        $cursor = Join-Path $cursor $segment
        $item = Get-Item -LiteralPath $cursor -Force -ErrorAction SilentlyContinue
        if (-not $item) { break }
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            throw "${Label} passes through a reparse point: $cursor"
        }
    }
}

function Test-InstalledPetContent(
    [string]$Path,
    [hashtable]$ExpectedHashes,
    [string]$DerivedManifestHash,
    [string]$PayloadName
) {
    $directoryItem = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    if (-not $directoryItem -or -not $directoryItem.PSIsContainer -or ($directoryItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        return $false
    }

    $installedManifestPath = Join-Path $Path 'pet.json'
    $sourceManifestPath = Join-Path $Path 'source-pet.json'
    $validationPath = Join-Path $Path 'validation.json'
    $proofPath = Join-Path $Path 'package-proof.json'
    foreach ($directPath in @($installedManifestPath, $sourceManifestPath, $validationPath, $proofPath)) {
        $item = Get-Item -LiteralPath $directPath -Force -ErrorAction SilentlyContinue
        if (-not $item -or $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { return $false }
    }

    if ((Get-PortableSha256 $installedManifestPath) -ne $DerivedManifestHash) { return $false }
    if ((Get-PortableSha256 $sourceManifestPath) -ne [string]$ExpectedHashes['pet.json']) { return $false }
    if ((Get-PortableSha256 $validationPath) -ne [string]$ExpectedHashes['validation.json']) { return $false }
    if ((Get-PortableSha256 $proofPath) -ne [string]$ExpectedHashes['package-proof.json']) { return $false }

    $payloadPath = Join-Path $Path $PayloadName
    $payloadItem = Get-Item -LiteralPath $payloadPath -Force -ErrorAction SilentlyContinue
    if (-not $payloadItem -or -not $payloadItem.PSIsContainer -or -not ($payloadItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        return $false
    }
    $targets = @($payloadItem.Target)
    if ($targets.Count -ne 1 -or [string]::IsNullOrWhiteSpace([string]$targets[0])) { return $false }
    $payloadAtlas = Join-Path $payloadPath 'spritesheet.webp'
    if (-not (Test-Path -LiteralPath $payloadAtlas -PathType Leaf)) { return $false }
    if ((Get-PortableSha256 $payloadAtlas) -ne [string]$ExpectedHashes['spritesheet.webp']) { return $false }
    return $true
}

function Test-LegacyCopiedPetContent(
    [string]$Path,
    [hashtable]$ExpectedHashes
) {
    $directoryItem = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    if (-not $directoryItem -or -not $directoryItem.PSIsContainer -or ($directoryItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        return $false
    }
    foreach ($name in $ExpectedHashes.Keys) {
        $filePath = Join-Path $Path $name
        $item = Get-Item -LiteralPath $filePath -Force -ErrorAction SilentlyContinue
        if (-not $item -or $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { return $false }
        if ((Get-PortableSha256 $filePath) -ne [string]$ExpectedHashes[$name]) { return $false }
    }
    return $true
}

function Get-ExistingPetDisposition(
    [string]$Path,
    [string]$PetId,
    [hashtable]$ExpectedHashes,
    [string]$DerivedManifestHash,
    [string]$PayloadName
) {
    $item = Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
    if (-not $item) { return 'absent' }
    if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) { return 'conflict' }
    if (Test-InstalledPetContent $Path $ExpectedHashes $DerivedManifestHash $PayloadName) { return 'same' }
    if (Test-LegacyCopiedPetContent $Path $ExpectedHashes) { return 'legacy-copy' }

    $installedManifestPath = Join-Path $Path 'pet.json'
    $sourceManifestPath = Join-Path $Path 'source-pet.json'
    $validationPath = Join-Path $Path 'validation.json'
    $proofPath = Join-Path $Path 'package-proof.json'
    foreach ($directPath in @($installedManifestPath, $sourceManifestPath, $validationPath, $proofPath)) {
        $directItem = Get-Item -LiteralPath $directPath -Force -ErrorAction SilentlyContinue
        if (-not $directItem -or $directItem.PSIsContainer -or ($directItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            return 'conflict'
        }
    }
    try {
        $installedManifest = Get-Content -LiteralPath $installedManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $sourceManifest = Get-Content -LiteralPath $sourceManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
        $installedProof = Get-Content -LiteralPath $proofPath -Raw -Encoding UTF8 | ConvertFrom-Json
    }
    catch {
        return 'conflict'
    }
    if (
        [string]$installedManifest.id -ne $PetId -or
        [string]$sourceManifest.id -ne $PetId -or
        [string]$installedProof.petId -ne $PetId
    ) {
        return 'conflict'
    }
    $retainedPayloads = @(
        Get-ChildItem -LiteralPath $Path -Directory -Force -ErrorAction SilentlyContinue | Where-Object {
            ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -and
            $_.Name -match '^payload(?:-[a-f0-9]{12,64})?$'
        }
    )
    if ($retainedPayloads.Count -eq 0) { return 'conflict' }
    return 'managed-upgrade'
}

$rootPath = [IO.Path]::GetFullPath($Root)
$packagesRoot = Join-Path $rootPath 'pets'
if (-not (Test-Path -LiteralPath $packagesRoot -PathType Container)) {
    throw 'The packaged Hatch Pet directory is missing.'
}

if ([string]::IsNullOrWhiteSpace($CodexHome)) {
    $configuredHome = [Environment]::GetEnvironmentVariable('CODEX_HOME', 'Process')
    if ([string]::IsNullOrWhiteSpace($configuredHome)) {
        $CodexHome = Join-Path $env:USERPROFILE '.codex'
    }
    else {
        $CodexHome = $configuredHome
    }
}
$codexHomePath = [IO.Path]::GetFullPath($CodexHome)
$petsRoot = Join-Path $codexHomePath 'pets'
$runtimeRoot = Join-Path $rootPath '.wukong-runtime'
$eventPath = Join-Path $runtimeRoot 'native-pet-links.jsonl'

foreach ($managedPath in @($rootPath, $packagesRoot, $codexHomePath, $petsRoot, $runtimeRoot)) {
    Assert-NoReparseSegments $managedPath 'Native pet install path'
    $managedItem = Get-Item -LiteralPath $managedPath -Force -ErrorAction SilentlyContinue
    if ($managedItem -and ($managedItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw "Refusing native pet install through a reparse-point root: $managedPath"
    }
}
$eventItem = Get-Item -LiteralPath $eventPath -Force -ErrorAction SilentlyContinue
if ($eventItem -and (($eventItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -or $eventItem.PSIsContainer)) {
    throw "Refusing a linked or non-file native pet event log: $eventPath"
}

$releasedPetIds = @(
    'little-bajie-v3-inart'
)
$packages = @(
    foreach ($releasedPetId in $releasedPetIds) {
        $releasedPackagePath = Join-Path $packagesRoot $releasedPetId
        $releasedPackage = Get-Item -LiteralPath $releasedPackagePath -Force -ErrorAction SilentlyContinue
        if (-not $releasedPackage -or -not $releasedPackage.PSIsContainer) {
            throw "Released Hatch Pet package is missing: $releasedPetId"
        }
        $releasedPackage
    }
)

$plans = @()
foreach ($package in $packages) {
    if ($package.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Refusing a reparse-point source pet package: $($package.FullName)"
    }

    $manifestPath = Join-Path $package.FullName 'pet.json'
    $atlasPath = Join-Path $package.FullName 'spritesheet.webp'
    $validationPath = Join-Path $package.FullName 'validation.json'
    $proofPath = Join-Path $package.FullName 'package-proof.json'
    $manifestItem = Assert-DirectFile $manifestPath 'Hatch Pet manifest'
    $atlasItem = Assert-DirectFile $atlasPath 'Hatch Pet atlas'
    Assert-DirectFile $validationPath 'Hatch Pet validation record' | Out-Null
    Assert-DirectFile $proofPath 'Hatch Pet package proof' | Out-Null

    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $petId = [string]$manifest.id
    if ($petId -notmatch '^[a-z0-9][a-z0-9-]{2,63}$') { throw "Invalid Hatch Pet id: $petId" }
    if ($package.Name -ne $petId) { throw "Pet package folder and manifest id differ: $($package.Name) / $petId" }
    if ([int]$manifest.spriteVersionNumber -ne 2) { throw "Hatch Pet must use spriteVersionNumber 2: $petId" }
    if ([string]$manifest.spritesheetPath -ne 'spritesheet.webp') { throw "Hatch Pet must use a local spritesheet.webp: $petId" }
    if ([string]::IsNullOrWhiteSpace([string]$manifest.displayName) -or [string]::IsNullOrWhiteSpace([string]$manifest.description)) {
        throw "Hatch Pet displayName and description are required: $petId"
    }
    if ($atlasItem.Length -lt 1024) { throw "Hatch Pet atlas is unexpectedly small: $atlasPath" }

    $dimensions = Get-WebpDimensions $atlasPath
    if ($dimensions.width -ne 1536 -or $dimensions.height -ne 2288) {
        throw "Hatch Pet v2 atlas must be 1536x2288: $atlasPath is $($dimensions.width)x$($dimensions.height)"
    }

    $validation = Get-Content -LiteralPath $validationPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($validation.ok -ne $true -or [string]$validation.format -ne 'WEBP' -or [string]$validation.mode -ne 'RGBA' -or
        [int]$validation.columns -ne 8 -or [int]$validation.rows -ne 11 -or [int]$validation.sprite_version_number -ne 2 -or
        [int]$validation.width -ne 1536 -or [int]$validation.height -ne 2288 -or
        [long]$validation.transparent_rgb_residue_pixels -ne 0 -or @($validation.errors).Count -ne 0) {
        throw "Hatch Pet validation record does not prove a clean v2 atlas: $validationPath"
    }

    $manifestHash = Get-PortableSha256 $manifestPath
    $atlasHash = Get-PortableSha256 $atlasPath
    $validationHash = Get-PortableSha256 $validationPath
    $proofHash = Get-PortableSha256 $proofPath
    $proof = Get-Content -LiteralPath $proofPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ([int]$proof.schemaVersion -ne 1 -or [string]$proof.petId -ne $petId -or
        ([string]$proof.manifestSha256).ToLowerInvariant() -ne $manifestHash -or
        ([string]$proof.atlasSha256).ToLowerInvariant() -ne $atlasHash -or
        ([string]$proof.validationSha256).ToLowerInvariant() -ne $validationHash -or
        [string]$proof.atlas.format -ne 'WEBP' -or [int]$proof.atlas.width -ne 1536 -or [int]$proof.atlas.height -ne 2288 -or
        [int]$proof.atlas.columns -ne 8 -or [int]$proof.atlas.rows -ne 11 -or [int]$proof.atlas.spriteVersionNumber -ne 2) {
        throw "Hatch Pet package proof is invalid or stale: $proofPath"
    }

    $sourcePath = [IO.Path]::GetFullPath($package.FullName)
    # Official Codex filters custom pets with Dirent.isDirectory(), so the top-level
    # discovery folder must be direct. Every atlas gets an append-only, hash-versioned
    # nested payload junction. Upgrades point pet.json at the new payload while the old
    # junction and every prior metadata byte remain available as retained evidence.
    $installId = "${petId}-wukong-forge"
    $linkPath = Join-Path $petsRoot $installId
    $expectedHashes = @{
        'pet.json' = $manifestHash
        'spritesheet.webp' = $atlasHash
        'validation.json' = $validationHash
        'package-proof.json' = $proofHash
    }
    $payloadName = 'payload-' + $atlasHash.Substring(0, 16)
    $derivedManifest = [ordered]@{
        id = $petId
        displayName = [string]$manifest.displayName
        description = [string]$manifest.description
        spriteVersionNumber = 2
        spritesheetPath = "$payloadName/spritesheet.webp"
    }
    $derivedManifestText = ($derivedManifest | ConvertTo-Json -Depth 8) + [Environment]::NewLine
    $derivedManifestBytes = [Text.UTF8Encoding]::new($false).GetBytes($derivedManifestText)
    $derivedManifestHash = Get-BytesSha256 $derivedManifestBytes
    $disposition = Get-ExistingPetDisposition $linkPath $petId $expectedHashes $derivedManifestHash $payloadName
    if ($disposition -eq 'conflict') {
        throw "A different retained pet already uses discovery directory id $installId. No existing path was changed; publish the new content under a new discovery/install directory id."
    }

    $plans += [pscustomobject]@{
        petId = $petId
        installId = $installId
        sourcePath = $sourcePath
        linkPath = $linkPath
        disposition = $disposition
        expectedHashes = $expectedHashes
        derivedManifestText = $derivedManifestText
        derivedManifestHash = $derivedManifestHash
        manifestSha256 = $manifestHash
        atlasSha256 = $atlasHash
        validationSha256 = $validationHash
        proofSha256 = $proofHash
        payloadName = $payloadName
    }
}

$duplicateLink = $plans | Group-Object linkPath | Where-Object Count -gt 1 | Select-Object -First 1
if ($duplicateLink) { throw "Multiple Hatch Pet packages selected the same destination: $($duplicateLink.Name)" }

New-Item -ItemType Directory -Force -Path $codexHomePath | Out-Null
New-Item -ItemType Directory -Force -Path $petsRoot | Out-Null
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
foreach ($createdRoot in @($codexHomePath, $petsRoot, $runtimeRoot)) {
    Assert-NoReparseSegments $createdRoot 'Native pet install path'
}

function Ensure-VersionedPayload([string]$ParentPath, [pscustomobject]$Plan) {
    $payloadPath = Join-Path $ParentPath $Plan.payloadName
    $existingPayload = Get-Item -LiteralPath $payloadPath -Force -ErrorAction SilentlyContinue
    if (-not $existingPayload) {
        New-Item -ItemType Junction -Path $payloadPath -Target $Plan.sourcePath | Out-Null
    }
    elseif (
        -not $existingPayload.PSIsContainer -or
        -not ($existingPayload.Attributes -band [IO.FileAttributes]::ReparsePoint) -or
        -not (Test-Path -LiteralPath (Join-Path $payloadPath 'spritesheet.webp') -PathType Leaf) -or
        (Get-PortableSha256 (Join-Path $payloadPath 'spritesheet.webp')) -ne [string]$Plan.expectedHashes['spritesheet.webp']
    ) {
        throw "The retained versioned payload conflicts with the requested atlas: $payloadPath"
    }
    return $payloadPath
}

foreach ($plan in $plans) {
    if ($plan.disposition -eq 'absent') {
        $stagePath = Join-Path $petsRoot ('.wukong-pet-payload-stage-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $stagePath | Out-Null
        Copy-Item -LiteralPath (Join-Path $plan.sourcePath 'pet.json') -Destination (Join-Path $stagePath 'source-pet.json') -ErrorAction Stop
        Copy-Item -LiteralPath (Join-Path $plan.sourcePath 'validation.json') -Destination (Join-Path $stagePath 'validation.json') -ErrorAction Stop
        Copy-Item -LiteralPath (Join-Path $plan.sourcePath 'package-proof.json') -Destination (Join-Path $stagePath 'package-proof.json') -ErrorAction Stop
        [IO.File]::WriteAllText(
            (Join-Path $stagePath 'pet.json'),
            [string]$plan.derivedManifestText,
            [Text.UTF8Encoding]::new($false)
        )
        New-Item -ItemType Junction -Path (Join-Path $stagePath $plan.payloadName) -Target $plan.sourcePath | Out-Null
        if (-not (Test-InstalledPetContent $stagePath $plan.expectedHashes $plan.derivedManifestHash $plan.payloadName)) {
            throw "The payload-junction stage failed validation and was preserved for audit: $stagePath"
        }
        [IO.Directory]::Move($stagePath, $plan.linkPath)
        $action = 'linked-versioned-payload'
    }
    elseif ($plan.disposition -eq 'legacy-copy') {
        # Preserve the previously installed manifest byte-for-byte before deriving the
        # official-discovery manifest. The old copied atlas also remains in place as
        # append-only audit evidence, but pet.json no longer points to it.
        $sourceManifestPath = Join-Path $plan.linkPath 'source-pet.json'
        $existingSourceManifest = Get-Item -LiteralPath $sourceManifestPath -Force -ErrorAction SilentlyContinue
        if (-not $existingSourceManifest) {
            Copy-Item -LiteralPath (Join-Path $plan.linkPath 'pet.json') -Destination $sourceManifestPath -ErrorAction Stop
        }
        elseif ($existingSourceManifest.PSIsContainer -or ($existingSourceManifest.Attributes -band [IO.FileAttributes]::ReparsePoint) -or
            (Get-PortableSha256 $sourceManifestPath) -ne [string]$plan.expectedHashes['pet.json']) {
            throw "The retained source manifest conflicts with migration evidence: $sourceManifestPath"
        }

        Ensure-VersionedPayload $plan.linkPath $plan | Out-Null

        [IO.File]::WriteAllText(
            (Join-Path $plan.linkPath 'pet.json'),
            [string]$plan.derivedManifestText,
            [Text.UTF8Encoding]::new($false)
        )
        if (-not (Test-InstalledPetContent $plan.linkPath $plan.expectedHashes $plan.derivedManifestHash $plan.payloadName)) {
            throw "The retained copied package migration failed validation and all intermediate evidence was preserved: $($plan.linkPath)"
        }
        $action = 'migrated-retained-copy'
    }
    elseif ($plan.disposition -eq 'managed-upgrade') {
        $historyRoot = Join-Path $plan.linkPath 'history'
        $historyRootItem = Get-Item -LiteralPath $historyRoot -Force -ErrorAction SilentlyContinue
        if ($historyRootItem -and (-not $historyRootItem.PSIsContainer -or ($historyRootItem.Attributes -band [IO.FileAttributes]::ReparsePoint))) {
            throw "The retained pet history path is not a direct directory: $historyRoot"
        }
        if (-not $historyRootItem) { New-Item -ItemType Directory -Path $historyRoot | Out-Null }

        $priorManifestPath = Join-Path $plan.linkPath 'pet.json'
        $priorManifestHash = Get-PortableSha256 $priorManifestPath
        $historyId = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmssfff') +
            '-' + $priorManifestHash.Substring(0, 12) +
            '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
        $historyPath = Join-Path $historyRoot $historyId
        New-Item -ItemType Directory -Path $historyPath | Out-Null
        foreach ($metadataName in @('pet.json', 'source-pet.json', 'validation.json', 'package-proof.json')) {
            Copy-Item -LiteralPath (Join-Path $plan.linkPath $metadataName) -Destination (Join-Path $historyPath $metadataName) -ErrorAction Stop
        }

        $payloadPath = Ensure-VersionedPayload $plan.linkPath $plan
        $upgradeRecord = [ordered]@{
            at = (Get-Date).ToString('o')
            petId = $plan.petId
            priorManifestSha256 = $priorManifestHash
            nextManifestSha256 = $plan.derivedManifestHash
            nextAtlasSha256 = $plan.atlasSha256
            nextPayload = $plan.payloadName
            nextPayloadPath = $payloadPath
            sourcePath = $plan.sourcePath
            retainedMetadata = @('pet.json', 'source-pet.json', 'validation.json', 'package-proof.json')
        }
        [IO.File]::WriteAllText(
            (Join-Path $historyPath 'upgrade.json'),
            (($upgradeRecord | ConvertTo-Json -Depth 8) + [Environment]::NewLine),
            [Text.UTF8Encoding]::new($false)
        )

        # pet.json is written last. Until that final write succeeds, Codex keeps
        # resolving the prior payload; every replaced metadata byte already exists
        # in the append-only history directory above.
        [IO.File]::WriteAllBytes(
            (Join-Path $plan.linkPath 'source-pet.json'),
            [IO.File]::ReadAllBytes((Join-Path $plan.sourcePath 'pet.json'))
        )
        [IO.File]::WriteAllBytes(
            (Join-Path $plan.linkPath 'validation.json'),
            [IO.File]::ReadAllBytes((Join-Path $plan.sourcePath 'validation.json'))
        )
        [IO.File]::WriteAllBytes(
            (Join-Path $plan.linkPath 'package-proof.json'),
            [IO.File]::ReadAllBytes((Join-Path $plan.sourcePath 'package-proof.json'))
        )
        [IO.File]::WriteAllText(
            (Join-Path $plan.linkPath 'pet.json'),
            [string]$plan.derivedManifestText,
            [Text.UTF8Encoding]::new($false)
        )
        if (-not (Test-InstalledPetContent $plan.linkPath $plan.expectedHashes $plan.derivedManifestHash $plan.payloadName)) {
            throw "The append-only pet upgrade did not validate; prior metadata and payloads remain at $historyPath"
        }
        $action = 'upgraded-retained-payload'
    }
    else {
        $action = 'already-present'
    }

    $record = [ordered]@{
        at = (Get-Date).ToString('o')
        petId = $plan.petId
        installId = $plan.installId
        action = $action
        installMode = 'versioned-linked-payload'
        linkPath = $plan.linkPath
        sourcePath = $plan.sourcePath
        payloadName = $plan.payloadName
        manifestSha256 = $plan.manifestSha256
        atlasSha256 = $plan.atlasSha256
        validationSha256 = $plan.validationSha256
        proofSha256 = $plan.proofSha256
        spriteVersionNumber = 2
    }
    [IO.File]::AppendAllText(
        $eventPath,
        (($record | ConvertTo-Json -Compress) + [Environment]::NewLine),
        [Text.UTF8Encoding]::new($false)
    )
    Write-Host "Hatch Pet $($plan.petId): $action at $($plan.linkPath)"
}

Write-Host 'Native Hatch Pet packages use direct Codex discovery folders with hash-versioned payload junctions. Prior payloads and metadata histories remain in place; no existing file was deleted or moved.'
