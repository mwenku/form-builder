@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Location '%~dp0..'; make ci"
if errorlevel 1 exit /b 1
