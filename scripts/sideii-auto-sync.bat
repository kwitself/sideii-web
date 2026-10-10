@echo off
setlocal
cd /d "%~dp0.."
title SIDEII AUTO-SYNC v2
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0sideii-auto-sync.ps1" %*
