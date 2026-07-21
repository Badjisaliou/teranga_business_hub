$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location (Join-Path $Root "backend")
composer test
Pop-Location

Push-Location (Join-Path $Root "frontend")
npm run lint
npm run build
Pop-Location

Push-Location (Join-Path $Root "frontend-admin")
npm run lint
npm run build
Pop-Location

Write-Host "All local checks passed."
