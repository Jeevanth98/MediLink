# MediLink Backend Server Launcher
# This keeps the server running continuously

$Host.UI.RawUI.WindowTitle = "MediLink Backend Server - KEEP RUNNING"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MediLink Backend Server" -ForegroundColor Green
Write-Host "   Server will run continuously" -ForegroundColor Yellow
Write-Host "   KEEP THIS WINDOW OPEN" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"

while ($true) {
    Write-Host "Starting server..." -ForegroundColor Green
    npm start
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Server stopped! Restarting in 5 seconds..." -ForegroundColor Red
    Write-Host "Press Ctrl+C to exit permanently" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    
    Start-Sleep -Seconds 5
}
