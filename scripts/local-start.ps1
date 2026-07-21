$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Admin = Join-Path $Root "frontend-admin"
$Local = Join-Path $Root ".local"
$Logs = Join-Path $Local "logs"
$Pids = Join-Path $Local "pids"

New-Item -ItemType Directory -Force -Path $Logs | Out-Null
New-Item -ItemType Directory -Force -Path $Pids | Out-Null

function Start-LocalProcess {
  param(
    [string]$Name,
    [string]$WorkDir,
    [string]$FilePath,
    [string[]]$ArgumentList
  )

  $LogPath = Join-Path $Logs "$Name.log"
  $PidPath = Join-Path $Pids "$Name.pid"
  Set-Content -Path $LogPath -Value "Started $Name at $(Get-Date)"
  $Process = Start-Process `
    -FilePath $FilePath `
    -ArgumentList $ArgumentList `
    -WorkingDirectory $WorkDir `
    -WindowStyle Hidden `
    -PassThru

  Set-Content -Path $PidPath -Value $Process.Id
  Write-Host "$Name started (PID $($Process.Id))."
}

Write-Host "Starting local services..."
Start-LocalProcess -Name "backend" -WorkDir $Backend -FilePath "php" -ArgumentList @("artisan", "serve", "--host=127.0.0.1", "--port=8000")
Start-LocalProcess -Name "frontend" -WorkDir $Frontend -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "-p", "3000")
Start-LocalProcess -Name "frontend-admin" -WorkDir $Admin -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "-p", "3001")

Write-Host ""
Write-Host "Backend:        http://127.0.0.1:8000"
Write-Host "Frontend:       http://localhost:3000"
Write-Host "Admin frontend: http://localhost:3001"
Write-Host "Admin login:    test@example.com / password"
Write-Host ""
Write-Host "Stop services with: .\scripts\local-stop.ps1"
