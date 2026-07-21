$ErrorActionPreference = "Continue"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Pids = Join-Path $Root ".local\pids"

if (!(Test-Path $Pids)) {
  Write-Host "No local PID directory found."
  exit 0
}

Get-ChildItem $Pids -Filter "*.pid" | ForEach-Object {
  $Name = $_.BaseName
  $PidValue = Get-Content $_.FullName -ErrorAction SilentlyContinue
  if ($PidValue) {
    $Process = Get-Process -Id ([int]$PidValue) -ErrorAction SilentlyContinue
    if ($Process) {
      Stop-Process -Id $Process.Id -Force
      Write-Host "$Name stopped (PID $($Process.Id))."
    } else {
      Write-Host "$Name was not running."
    }
  }
  Remove-Item $_.FullName -Force
}

$Ports = @(8000, 3000, 3001)
foreach ($Port in $Ports) {
  $Lines = netstat -ano | Select-String ":$Port\s"
  foreach ($Line in $Lines) {
    $Parts = ($Line.ToString() -split "\s+") | Where-Object { $_ -ne "" }
    if ($Parts.Length -lt 5 -or $Parts[3] -ne "LISTENING") {
      continue
    }

    $PortPid = [int]$Parts[4]
    $Process = Get-Process -Id $PortPid -ErrorAction SilentlyContinue
    if ($Process) {
      Stop-Process -Id $Process.Id -Force
      Write-Host "port $Port stopped (PID $($Process.Id))."
    }
  }
}
