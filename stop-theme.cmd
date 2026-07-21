@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\disable.ps1" -Root "%~dp0." -Portable
if errorlevel 1 pause
