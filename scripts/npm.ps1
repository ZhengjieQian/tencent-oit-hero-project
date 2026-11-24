param([Parameter(ValueFromRemainingArguments = $true)][string[]]$NpmArgs)
$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$Runtime = Join-Path $Root '.tools/node-v24.22.3'
$NodeExe = Join-Path $Runtime 'node.exe'
$NpmCmd = Join-Path $Runtime 'node_modules/npm/bin/npm.cmd'

if (!(Test-Path $NodeExe) -or !(Test-Path $NpmCmd)) {
  Write-Host 'Project-local Node.js is not ready. Run .\scripts\start-interview.ps1 once first.' -ForegroundColor Red
  exit 1
}

$env:PATH = "$Runtime;$env:PATH"
Set-Location $Root
& $NpmCmd @NpmArgs
exit $LASTEXITCODE
