[CmdletBinding()]param([Parameter(Mandatory)][string]$Import,[string]$Image,[string]$Root=(Join-Path $env:LOCALAPPDATA 'WukongCodexForge\app'))
$ErrorActionPreference='Stop'
$rootPath=[IO.Path]::GetFullPath($Root);$managedRoot=[IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'WukongCodexForge\app'))
if(-not [string]::Equals($rootPath,$managedRoot,[StringComparison]::OrdinalIgnoreCase)){throw 'Theme import only writes to the managed runtime copy.'}
if(-not (Test-Path -LiteralPath $Import)){throw 'Theme JSON was not found.'};Push-Location $rootPath;try{node runtime/forge-runtime.mjs --validate $Import;if($LASTEXITCODE){throw 'Theme validation failed.'}
$theme=Get-Content -LiteralPath $Import -Raw -Encoding utf8|ConvertFrom-Json
$activeDir=Join-Path $rootPath 'themes';$assetDir=Join-Path $activeDir 'assets';New-Item -ItemType Directory -Force -Path $assetDir|Out-Null
if($Image){$imagePath=[IO.Path]::GetFullPath($Image);if(-not (Test-Path -LiteralPath $imagePath)){throw 'Background image was not found.'};$item=Get-Item -LiteralPath $imagePath;if($item.Length -gt 16MB){throw 'Background image exceeds 16 MB.'};if($item.Extension.ToLowerInvariant() -notin '.png','.jpg','.jpeg','.webp'){throw 'Unsupported background image.'};$leaf='background'+$item.Extension.ToLowerInvariant();Copy-Item -LiteralPath $imagePath -Destination (Join-Path $assetDir $leaf) -Force;$theme.background.mode='local';$theme.background.source=$item.Name;$theme.background.asset=('assets/'+$leaf)}
$activePath=Join-Path $activeDir 'active.json';$json=$theme|ConvertTo-Json -Depth 8;[IO.File]::WriteAllText($activePath,$json,[Text.UTF8Encoding]::new($false))
node runtime/forge-runtime.mjs --validate (Join-Path $activeDir 'active.json');if($LASTEXITCODE){throw 'Managed theme validation failed.'}}finally{Pop-Location}
Write-Host 'Theme imported into the managed runtime. Apply it with start.ps1.'
