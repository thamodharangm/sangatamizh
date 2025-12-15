# Sangatamizh Music - Restart Script
# This script restarts both backend and frontend servers

Write-Host "🔄 Restarting Sangatamizh Music Services..." -ForegroundColor Cyan
Write-Host ""

# Stop all node processes
Write-Host "⏹️  Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\sangatamizh\backend'; npm start"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🚀 Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\sangatamizh\client-v2'; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Services Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3002" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5174" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to open frontend in browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:5174"
