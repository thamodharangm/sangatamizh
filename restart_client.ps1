# Restart Client-v2 Development Server
# This script helps restart the client-v2 after environment changes

Write-Host "🔄 Restarting client-v2 development server..." -ForegroundColor Cyan

# Stop any running client-v2 processes
$processes = Get-Process | Where-Object {
    $_.ProcessName -eq "node" -and 
    $_.Path -like "*client-v2*"
}

if ($processes) {
    Write-Host "⏹️  Stopping existing client-v2 processes..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Navigate to client-v2 and start dev server
Write-Host "▶️  Starting client-v2 dev server..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\client-v2"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "✅ Client-v2 restarted successfully!" -ForegroundColor Green
Write-Host "📍 Server should be running at http://localhost:5174" -ForegroundColor Cyan
