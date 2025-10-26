@echo off
title MediLink Backend Server - DO NOT CLOSE
cd /d "%~dp0backend"
echo ========================================
echo   MediLink Backend Server
echo   Server will run continuously
echo   KEEP THIS WINDOW OPEN
echo ========================================
echo.
:start
npm start
echo.
echo ========================================
echo   Server stopped! Restarting in 3 seconds...
echo   Press Ctrl+C to exit permanently
echo ========================================
timeout /t 3 /nobreak
goto start
