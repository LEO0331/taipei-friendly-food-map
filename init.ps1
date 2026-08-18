$ErrorActionPreference = 'Stop'

Write-Host '=== Harness Initialization ==='
Write-Host '=== npm.cmd run build ==='
npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host '=== npm.cmd test ==='
npm.cmd test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host '=== Verification Complete ==='
