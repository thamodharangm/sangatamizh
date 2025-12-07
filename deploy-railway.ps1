# 🚀 Automated Railway Deployment Script

# This script helps you deploy to Railway with minimal manual steps
# Run this in PowerShell from the project root directory

Write-Host "🚂 Railway Deployment Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend/railway.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Expected to find: backend/railway.json" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found railway.json configuration" -ForegroundColor Green
Write-Host ""

# Check if Railway CLI is installed
Write-Host "🔍 Checking Railway CLI..." -ForegroundColor Yellow
$railwayCli = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayCli) {
    Write-Host "❌ Railway CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
        Write-Host "   Please install manually: npm install -g @railway/cli" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Railway CLI installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Railway CLI is installed" -ForegroundColor Green
}

Write-Host ""

# Generate JWT secrets
Write-Host "🔑 Generating JWT Secrets..." -ForegroundColor Yellow
$jwtAccessSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
$jwtRefreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

Write-Host "✅ JWT secrets generated" -ForegroundColor Green
Write-Host ""

# Display environment variables template
Write-Host "📋 Environment Variables to Add in Railway:" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NODE_ENV=production" -ForegroundColor White
Write-Host "PORT=3000" -ForegroundColor White
Write-Host "DATABASE_URL=`${{Postgres.DATABASE_URL}}" -ForegroundColor White
Write-Host "REDIS_URL=`${{Redis.REDIS_URL}}" -ForegroundColor White
Write-Host "JWT_ACCESS_SECRET=$jwtAccessSecret" -ForegroundColor Green
Write-Host "JWT_REFRESH_SECRET=$jwtRefreshSecret" -ForegroundColor Green
Write-Host "S3_BUCKET=sangatamizh-music" -ForegroundColor White
Write-Host "S3_REGION=auto" -ForegroundColor White
Write-Host "S3_ENDPOINT=http://localhost:9000" -ForegroundColor White
Write-Host "S3_ACCESS_KEY=minioadmin" -ForegroundColor White
Write-Host "S3_SECRET_KEY=minioadmin" -ForegroundColor White
Write-Host "FRONTEND_URL=https://YOUR-FRONTEND.vercel.app" -ForegroundColor Yellow
Write-Host ""

# Save to file for reference
$envContent = @"
# Railway Backend Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

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

# Frontend Environment Variable (for Vercel)
VITE_API_URL=https://YOUR-BACKEND.up.railway.app/api
"@

$envContent | Out-File -FilePath ".railway-env-template.txt" -Encoding UTF8
Write-Host "💾 Environment variables saved to: .railway-env-template.txt" -ForegroundColor Green
Write-Host ""

# Deployment checklist
Write-Host "📝 Deployment Checklist:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Railway.json configured (V2 runtime)" -ForegroundColor Green
Write-Host "2. ✅ Dockerfile optimized for production" -ForegroundColor Green
Write-Host "3. ✅ .dockerignore added" -ForegroundColor Green
Write-Host "4. ✅ JWT secrets generated" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "----------" -ForegroundColor Yellow
Write-Host "1. Go to https://railway.app/new" -ForegroundColor White
Write-Host "2. Create new project" -ForegroundColor White
Write-Host "3. Add PostgreSQL database" -ForegroundColor White
Write-Host "4. Add Redis database" -ForegroundColor White
Write-Host "5. Deploy from GitHub repo: thamodharangm/sangatamizh-music" -ForegroundColor White
Write-Host "6. Set root directory to: backend" -ForegroundColor White
Write-Host "7. Add environment variables from .railway-env-template.txt" -ForegroundColor White
Write-Host "8. Generate domain" -ForegroundColor White
Write-Host ""

# Ask if user wants to login to Railway
Write-Host "🔐 Would you like to login to Railway CLI now? (y/n): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🔓 Opening Railway login..." -ForegroundColor Cyan
    railway login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully logged in to Railway" -ForegroundColor Green
        Write-Host ""
        
        # Ask if user wants to link project
        Write-Host "🔗 Would you like to link to an existing Railway project? (y/n): " -ForegroundColor Yellow -NoNewline
        $linkResponse = Read-Host
        
        if ($linkResponse -eq 'y' -or $linkResponse -eq 'Y') {
            Write-Host ""
            Write-Host "🔗 Linking to Railway project..." -ForegroundColor Cyan
            Set-Location backend
            railway link
            Set-Location ..
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully linked to Railway project" -ForegroundColor Green
                Write-Host ""
                Write-Host "📊 View logs with: railway logs" -ForegroundColor Cyan
                Write-Host "🚀 Deploy with: railway up" -ForegroundColor Cyan
            }
        }
    }
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "- Complete Guide: RAILWAY_DEPLOY_V2.md" -ForegroundColor White
Write-Host "- Quick Reference: RAILWAY_QUICK_REF.md" -ForegroundColor White
Write-Host "- Update Summary: RAILWAY_V2_UPDATE_SUMMARY.md" -ForegroundColor White
Write-Host ""
Write-Host "✨ Deployment helper completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Keep .railway-env-template.txt safe - it contains your JWT secrets!" -ForegroundColor Yellow
Write-Host ""
