# Railway Deployment Setup Script
Write-Host "`n🚂 Railway Deployment Setup" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Generate JWT secrets
Write-Host "🔑 Generating JWT Secrets...`n" -ForegroundColor Yellow
$jwtAccessSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
$jwtRefreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

Write-Host "✅ JWT Secrets Generated!`n" -ForegroundColor Green

# Create environment variables file
$envContent = @"
# ========================================
# RAILWAY BACKEND ENVIRONMENT VARIABLES
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ========================================

NODE_ENV=production
PORT=3000
DATABASE_URL=`${{Postgres.DATABASE_URL}}
REDIS_URL=`${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=$jwtAccessSecret
JWT_REFRESH_SECRET=$jwtRefreshSecret
S3_BUCKET=sangatamizh-music
S3_REGION=auto
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
FRONTEND_URL=https://YOUR-FRONTEND.vercel.app

# ========================================
# VERCEL FRONTEND ENVIRONMENT VARIABLE
# ========================================

VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api
"@

$envContent | Out-File -FilePath "railway-env-vars.txt" -Encoding UTF8

Write-Host "💾 Environment variables saved to: railway-env-vars.txt`n" -ForegroundColor Green

# Display the variables
Write-Host "📋 COPY THESE TO RAILWAY:" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan
Write-Host $envContent -ForegroundColor White

Write-Host "`n✅ Setup Complete!`n" -ForegroundColor Green
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open railway-env-vars.txt" -ForegroundColor White
Write-Host "2. Go to https://railway.app/new" -ForegroundColor White
Write-Host "3. Follow the deployment guide`n" -ForegroundColor White
