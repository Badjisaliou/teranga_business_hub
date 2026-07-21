param(
  [switch]$Production
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"

Push-Location $Backend
if ($Production) {
  php artisan app:diagnose-readiness --production
} else {
  php artisan app:diagnose-readiness
}
Pop-Location
