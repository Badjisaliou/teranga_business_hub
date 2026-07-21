param(
  [switch]$SkipInstall,
  [switch]$FreshDatabase
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Admin = Join-Path $Root "frontend-admin"

function Ensure-EnvFile {
  param(
    [string]$Path,
    [string]$ExamplePath
  )

  if (!(Test-Path $Path)) {
    Copy-Item $ExamplePath $Path
    Write-Host "Created $Path"
  }
}

function Set-EnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  $line = "$Key=$Value"
  $content = if (Test-Path $Path) { Get-Content $Path } else { @() }
  $escaped = [regex]::Escape($Key)
  if ($content | Where-Object { $_ -match "^$escaped=" }) {
    $content = $content | ForEach-Object { if ($_ -match "^$escaped=") { $line } else { $_ } }
  } else {
    $content += $line
  }
  Set-Content -Path $Path -Value $content
}

function Backup-SqliteDatabase {
  $databasePath = Join-Path $Backend "database\database.sqlite"
  if (Test-Path $databasePath) {
    $backupDir = Join-Path $Root ".local\backups"
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = Join-Path $backupDir "database.sqlite.$timestamp.bak"
    Copy-Item $databasePath $backupPath
    Write-Host "Backed up existing SQLite database to $backupPath"
  }
}

function Test-BackendColumn {
  param(
    [string]$Table,
    [string]$Column
  )

  Push-Location $Backend
  $result = php artisan tinker --execute="echo Schema::hasColumn('$Table', '$Column') ? 'yes' : 'no';" 2>$null
  $exitCode = $LASTEXITCODE
  Pop-Location

  return ($exitCode -eq 0 -and (($result -join "") -match "yes"))
}

Write-Host "Preparing local Teranga Business Hub environment..."

Ensure-EnvFile -Path (Join-Path $Backend ".env") -ExamplePath (Join-Path $Backend ".env.example")
Ensure-EnvFile -Path (Join-Path $Frontend ".env.local") -ExamplePath (Join-Path $Frontend ".env.local.example")
Ensure-EnvFile -Path (Join-Path $Admin ".env.local") -ExamplePath (Join-Path $Admin ".env.local.example")

$BackendEnv = Join-Path $Backend ".env"
Set-EnvValue -Path $BackendEnv -Key "APP_URL" -Value "http://127.0.0.1:8000"
Set-EnvValue -Path $BackendEnv -Key "FRONTEND_URL" -Value "http://localhost:3000"
Set-EnvValue -Path $BackendEnv -Key "ADMIN_FRONTEND_URL" -Value "http://localhost:3001"
Set-EnvValue -Path $BackendEnv -Key "PAYDUNYA_ENABLED" -Value "false"
Set-EnvValue -Path $BackendEnv -Key "PAYDUNYA_MODE" -Value "test"
Set-EnvValue -Path $BackendEnv -Key "PAYDUNYA_AUTO_CONFIRM_DEV" -Value "true"
Set-EnvValue -Path $BackendEnv -Key "PAYDUNYA_RETURN_URL" -Value "http://localhost:3000/paiement/retour"
Set-EnvValue -Path $BackendEnv -Key "PAYDUNYA_CANCEL_URL" -Value "http://localhost:3000/paiement/annule"
Set-EnvValue -Path $BackendEnv -Key "PAYDUNYA_CALLBACK_URL" -Value "http://127.0.0.1:8000/api/webhook/paydunya"
Set-EnvValue -Path $BackendEnv -Key "CLOUDINARY_ENABLED" -Value "false"
Set-EnvValue -Path $BackendEnv -Key "CLOUDINARY_FOLDER" -Value "teranga-business-hub/profile-photos"
Set-EnvValue -Path $BackendEnv -Key "WHATSAPP_ENABLED" -Value "false"
Set-EnvValue -Path $BackendEnv -Key "WHATSAPP_PHONE_NUMBER_ID" -Value ""
Set-EnvValue -Path $BackendEnv -Key "WHATSAPP_ACCESS_TOKEN" -Value ""
Set-EnvValue -Path $BackendEnv -Key "WHATSAPP_TEMPLATE_LANGUAGE" -Value "fr"
Set-EnvValue -Path $BackendEnv -Key "WHATSAPP_REGISTRATION_TEMPLATE" -Value ""
Set-EnvValue -Path $BackendEnv -Key "WHATSAPP_PASSWORD_RESET_TEMPLATE" -Value ""

Set-EnvValue -Path (Join-Path $Frontend ".env.local") -Key "NEXT_PUBLIC_API_BASE_URL" -Value "http://127.0.0.1:8000"
Set-EnvValue -Path (Join-Path $Admin ".env.local") -Key "NEXT_PUBLIC_API_BASE_URL" -Value "http://127.0.0.1:8000"

if (!$SkipInstall) {
  if (!(Test-Path (Join-Path $Backend "vendor"))) {
    Push-Location $Backend
    composer install
    Pop-Location
  }

  if (!(Test-Path (Join-Path $Frontend "node_modules"))) {
    Push-Location $Frontend
    npm install
    Pop-Location
  }

  if (!(Test-Path (Join-Path $Admin "node_modules"))) {
    Push-Location $Admin
    npm install
    Pop-Location
  }
}

Push-Location $Backend
$AppKeyLine = Get-Content (Join-Path $Backend ".env") | Where-Object { $_ -match "^APP_KEY=" } | Select-Object -First 1
if (!$AppKeyLine -or $AppKeyLine -eq "APP_KEY=") {
  php artisan key:generate --force
}

if ($FreshDatabase) {
  Backup-SqliteDatabase
  php artisan migrate:fresh --force
} else {
  php artisan migrate --force
  if (!(Test-BackendColumn -Table "users" -Column "matricule")) {
    Write-Host "Local SQLite schema is outdated. Rebuilding it from migrations..."
    Backup-SqliteDatabase
    php artisan migrate:fresh --force
  }
}

php artisan db:seed --force
Pop-Location

Write-Host ""
Write-Host "Local setup complete."
Write-Host "Admin login: test@example.com / password"
Write-Host "Run: .\scripts\local-start.ps1"
