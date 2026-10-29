@echo off
setlocal enabledelayedexpansion
title Configurador de Firewall - RD POS

:: Verificar permisos de Administrador y auto-elevar si es necesario
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando permisos de Administrador de Windows...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

echo ===================================================
echo   Configurador de Reglas de Windows Firewall - RD
echo ===================================================
echo.

:: 1. Regla para el Puerto 4000 TCP
echo [1/4] Agregando regla para el Puerto 4000 (TCP)...
netsh advfirewall firewall delete rule name="RD POS (Puerto 4000)" >nul 2>&1
netsh advfirewall firewall add rule name="RD POS (Puerto 4000)" dir=in action=allow protocol=TCP localport=4000 profile=any >nul

:: 2. Regla para el ejecutable empaquetado (out\rd-win32-x64\rd.exe)
set "OUT_EXE=%~dp0..\out\rd-win32-x64\rd.exe"
if exist "%OUT_EXE%" (
    echo [2/4] Agregando regla para ejecutable en: %OUT_EXE%
    netsh advfirewall firewall delete rule name="RD POS (Out Executable)" >nul 2>&1
    netsh advfirewall firewall add rule name="RD POS (Out Executable)" dir=in action=allow program="%OUT_EXE%" profile=any >nul
)

:: 3. Regla para el launcher en AppData\Local\rd\rd.exe
set "APPDATA_EXE=%LOCALAPPDATA%\rd\rd.exe"
if exist "%APPDATA_EXE%" (
    echo [3/4] Agregando regla para launcher en: %APPDATA_EXE%
    netsh advfirewall firewall delete rule name="RD POS (AppData rd.exe)" >nul 2>&1
    netsh advfirewall firewall add rule name="RD POS (AppData rd.exe)" dir=in action=allow program="%APPDATA_EXE%" profile=any >nul
)

:: 4. Reglas para todas las versiones instaladas en AppData\Local\rd\app-*\rd.exe
echo [4/4] Buscando versiones instaladas en AppData\Local\rd...
for /d %%D in ("%LOCALAPPDATA%\rd\app-*") do (
    if exist "%%D\rd.exe" (
        echo   - Habilitando: %%~nxD\rd.exe
        netsh advfirewall firewall delete rule name="RD POS (%%~nxD)" >nul 2>&1
        netsh advfirewall firewall add rule name="RD POS (%%~nxD)" dir=in action=allow program="%%D\rd.exe" profile=any >nul
    )
)

echo.
echo ===================================================
echo  [EXITO] Firewall configurado correctamente.
echo  Reglas agregadas para:
echo   - Puerto 4000 TCP
echo   - Ejecutable en out\rd-win32-x64\rd.exe
echo   - Launcher y versiones en AppData\Local\rd\
echo ===================================================
echo.
pause
