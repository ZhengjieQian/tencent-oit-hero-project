$ErrorActionPreference = 'Stop'
$Version = 'v24.22.3'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Tools = Join-Path $Root '.tools'
$Runtime = Join-Path $Tools "node-$Version"

function Stop-WithMessage([string]$Message) {
  Write-Error "Setup error: $Message"
  exit 1
}

if ($env:PROCESSOR_ARCHITECTURE -notin @('AMD64', 'ARM64')) {
  Stop-WithMessage "Unsupported Windows architecture '$env:PROCESSOR_ARCHITECTURE'. Install Node.js 24 manually."
}
$Platform = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'win-arm64' } else { 'win-x64' }
$ArchiveName = "node-$Version-$Platform.zip"
$NodeExe = Join-Path $Runtime 'node.exe'
$NpmCli = Join-Path $Runtime 'node_modules/npm/bin/npm-cli.js'
$NpmCmd = Join-Path $Runtime 'node_modules/npm/bin/npm.cmd'
New-Item -ItemType Directory -Force -Path $Tools | Out-Null

if (!(Test-Path $NodeExe) -or !(Test-Path $NpmCli)) {
  if (Test-Path $Runtime) { Remove-Item -Recurse -Force $Runtime }
  $Temp = Join-Path $Tools ([System.IO.Path]::GetRandomFileName())
  New-Item -ItemType Directory -Path $Temp | Out-Null
  try {
    $Base = "https://nodejs.org/dist/$Version"
    $Archive = Join-Path $Temp $ArchiveName
    $Checksums = Join-Path $Temp 'SHASUMS256.txt'
    Write-Host "Downloading verified Node.js $Version for $Platform..."
    Invoke-WebRequest -UseBasicParsing -Uri "$Base/$ArchiveName" -OutFile $Archive
    Invoke-WebRequest -UseBasicParsing -Uri "$Base/SHASUMS256.txt" -OutFile $Checksums
    $Line = Get-Content $Checksums | Where-Object { $_ -match "^[0-9a-fA-F]{64}\s+$([regex]::Escape($ArchiveName))$" } | Select-Object -First 1
    if (!$Line) { Stop-WithMessage "Official checksum list does not contain $ArchiveName." }
    $Expected = ($Line -split '\s+')[0].ToLowerInvariant()
    $Actual = (Get-FileHash -Algorithm SHA256 $Archive).Hash.ToLowerInvariant()
    if ($Expected -ne $Actual) { Stop-WithMessage 'Node archive checksum mismatch; the download was discarded.' }
    Expand-Archive -Path $Archive -DestinationPath $Temp
    Move-Item -Path (Join-Path $Temp "node-$Version-$Platform") -Destination $Runtime
  }
  catch {
    if ($_.Exception.Message -like 'Setup error:*') { throw }
    Stop-WithMessage "Could not download or unpack Node.js. Check the network and retry, or install Node.js 24 manually. $($_.Exception.Message)"
  }
  finally {
    if (Test-Path $Temp) { Remove-Item -Recurse -Force $Temp }
  }
}

if (!(Test-Path $NodeExe) -or !(Test-Path $NpmCli)) { Stop-WithMessage "Cached Node runtime is incomplete. Remove .tools/node-$Version and retry." }
$RuntimeVersion = & $NodeExe --version
if ($RuntimeVersion -ne $Version) { Stop-WithMessage "Cached Node runtime version is unexpected. Remove .tools/node-$Version and retry." }
$env:PATH = "$Runtime;$env:PATH"
$LockHash = (Get-FileHash -Algorithm SHA256 (Join-Path $Root 'package-lock.json')).Hash.ToLowerInvariant()
$Marker = Join-Path $Tools 'npm-install-lock-sha256'
$Previous = if (Test-Path $Marker) { (Get-Content $Marker -Raw).Trim() } else { '' }
if (!(Test-Path (Join-Path $Root 'node_modules')) -or $LockHash -ne $Previous) {
  Write-Host 'Installing locked project dependencies...'
  Push-Location $Root
  try { & $NpmCmd ci; if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Dependency installation failed. Check the network and retry.' } }
  finally { Pop-Location }
  Set-Content -NoNewline -Path $Marker -Value $LockHash
}

if (!(Get-Command docker -ErrorAction SilentlyContinue)) { Stop-WithMessage 'Docker Desktop is required for the local PostgreSQL database. Install and start Docker Desktop, then retry.' }
Push-Location $Root
try { & docker compose up -d --wait postgres; if ($LASTEXITCODE -ne 0) { Stop-WithMessage 'Could not start PostgreSQL. Make sure Docker Desktop is running and port 5432 is available.' } }
finally { Pop-Location }

Set-Location $Root
Write-Host 'Starting interview app. Open http://127.0.0.1:5173/ . Press Ctrl+C to stop.'
& $NpmCmd run dev
exit $LASTEXITCODE
