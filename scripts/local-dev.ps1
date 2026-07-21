param(
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

if ($SkipInstall) {
  & (Join-Path $Root "scripts\local-setup.ps1") -SkipInstall
} else {
  & (Join-Path $Root "scripts\local-setup.ps1")
}
& (Join-Path $Root "scripts\local-start.ps1")
