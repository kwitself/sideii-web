@echo off
setlocal
cd /d "%~dp0.."
title SIDEII AUTO-SYNC v2

rem Start Next dev server only if port 3000 is not already listening.
powershell.exe -NoProfile -Command "$p=Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if($p){exit 0}else{exit 1}"
if errorlevel 1 (
  echo Starting SIDE:II DEV server...
  start "SIDEII DEV" cmd /k "cd /d ""%CD%"" && title SIDEII DEV && npm run dev"
) else (
  echo SIDE:II DEV already running on port 3000.
)

rem Keep auto-sync in this window.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0sideii-auto-sync.ps1" %*
