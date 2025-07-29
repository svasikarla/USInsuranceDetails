# Deployment script for US Insurance Platform (PowerShell)

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "frontend/package.json")) {
    Write-Host "❌ Error: frontend/package.json not found. Make sure you're in the project root." -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Build failed" -ForegroundColor Red
    exit 1
}

# Go back to root
Set-Location ..

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Push your changes to GitHub" -ForegroundColor White
Write-Host "2. Connect your repository to Vercel" -ForegroundColor White
Write-Host "3. Set up environment variables in Vercel dashboard" -ForegroundColor White
Write-Host "4. Deploy!" -ForegroundColor White

Write-Host ""
Write-Host "🔗 Useful links:" -ForegroundColor Cyan
Write-Host "- Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "- Deployment Guide: See DEPLOYMENT_GUIDE.md" -ForegroundColor White
