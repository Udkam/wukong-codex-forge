@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-preserving.ps1"
if errorlevel 1 pause
