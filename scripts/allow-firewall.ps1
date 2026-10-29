# Script de PowerShell para habilitar reglas en Windows Defender Firewall
# Requiere ejecutarse como Administrador

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Configurador de Firewall - RD POS System" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Regla para puerto 4000
Write-Host "[1/4] Habilitando puerto 4000 TCP..." -ForegroundColor Yellow
Remove-NetFirewallRule -DisplayName "RD POS (Puerto 4000)" 2>$null
New-NetFirewallRule -DisplayName "RD POS (Puerto 4000)" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -Profile Any | Out-Null

# 2. Regla para ejecutable local en out\rd-win32-x64\rd.exe
$outExe = Join-Path (Get-Location).Path "out\rd-win32-x64\rd.exe"
if (Test-Path $outExe) {
    Write-Host "[2/4] Habilitando ejecutable: $outExe" -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "RD POS (Out Executable)" 2>$null
    New-NetFirewallRule -DisplayName "RD POS (Out Executable)" -Direction Inbound -Program $outExe -Action Allow -Profile Any | Out-Null
}

# 3. Regla para launcher AppData\Local\rd\rd.exe
$launcherExe = Join-Path $env:LOCALAPPDATA "rd\rd.exe"
if (Test-Path $launcherExe) {
    Write-Host "[3/4] Habilitando launcher: $launcherExe" -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "RD POS (AppData rd.exe)" 2>$null
    New-NetFirewallRule -DisplayName "RD POS (AppData rd.exe)" -Direction Inbound -Program $launcherExe -Action Allow -Profile Any | Out-Null
}

# 4. Reglas para todas las versiones instaladas
Write-Host "[4/4] Buscando versiones instaladas en AppData\Local\rd..." -ForegroundColor Yellow
Get-ChildItem -Path "$env:LOCALAPPDATA\rd" -Filter "rd.exe" -Recurse | ForEach-Object {
    Write-Host "  - Habilitando: $($_.FullName)" -ForegroundColor Green
    Remove-NetFirewallRule -DisplayName "RD POS - $($_.FullName)" 2>$null
    New-NetFirewallRule -DisplayName "RD POS - $($_.FullName)" -Direction Inbound -Program $_.FullName -Action Allow -Profile Any | Out-Null
}

Write-Host "`n[EXITO] Todas las reglas de firewall fueron aplicadas correctamente." -ForegroundColor Green

