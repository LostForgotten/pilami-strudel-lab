@echo off
setlocal
cd /d "%~dp0"
echo Installation Pilami Ableton Link - Windows
echo.
REM Clear any earlier compiler flag that can become malformed.
set "CL="
echo [1/3] Installation des dependances sans compilation...
call npm install --ignore-scripts
if errorlevel 1 goto :fail
echo [2/3] Correction de la configuration C++ du module Ableton Link...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0corriger-cpp.ps1"
if errorlevel 1 goto :fail
echo [3/3] Compilation du module natif...
call npm rebuild @ktamas77/abletonlink --foreground-scripts
if errorlevel 1 goto :fail
echo.
echo Installation terminee. Lance 02-demarrer-windows.cmd
pause
exit /b 0
:fail
echo.
echo ERREUR pendant l'installation. Copie les dernieres lignes.
pause
exit /b 1
