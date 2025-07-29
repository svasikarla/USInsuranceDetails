# Backend Deployment Script for US Insurance Platform (PowerShell)

Write-Host "🚀 Backend Deployment Helper" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "backend/requirements.txt")) {
    Write-Host "❌ Error: backend/requirements.txt not found. Make sure you're in the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Choose your deployment platform:" -ForegroundColor Cyan
Write-Host "1. Railway (Recommended)" -ForegroundColor White
Write-Host "2. Render" -ForegroundColor White
Write-Host "3. Heroku" -ForegroundColor White
Write-Host "4. DigitalOcean App Platform" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    1 {
        Write-Host "🚂 Railway Deployment" -ForegroundColor Yellow
        Write-Host "=====================" -ForegroundColor Yellow
        Write-Host "1. Go to https://railway.app" -ForegroundColor White
        Write-Host "2. Sign up/login with GitHub" -ForegroundColor White
        Write-Host "3. Click 'New Project' → 'Deploy from GitHub repo'" -ForegroundColor White
        Write-Host "4. Select your repository" -ForegroundColor White
        Write-Host "5. Set Root Directory to 'backend'" -ForegroundColor White
        Write-Host "6. Add environment variables:" -ForegroundColor White
        Write-Host "   - DATABASE_URL" -ForegroundColor Gray
        Write-Host "   - GOOGLE_API_KEY" -ForegroundColor Gray
        Write-Host "   - SUPABASE_URL" -ForegroundColor Gray
        Write-Host "   - SUPABASE_KEY" -ForegroundColor Gray
        Write-Host "   - FRONTEND_URL (your Vercel URL)" -ForegroundColor Gray
        Write-Host "7. Deploy!" -ForegroundColor White
    }
    2 {
        Write-Host "🎨 Render Deployment" -ForegroundColor Yellow
        Write-Host "===================" -ForegroundColor Yellow
        Write-Host "1. Go to https://render.com" -ForegroundColor White
        Write-Host "2. Click 'New +' → 'Web Service'" -ForegroundColor White
        Write-Host "3. Connect your GitHub repository" -ForegroundColor White
        Write-Host "4. Configure:" -ForegroundColor White
        Write-Host "   - Root Directory: backend" -ForegroundColor Gray
        Write-Host "   - Build Command: pip install -r requirements.txt" -ForegroundColor Gray
        Write-Host "   - Start Command: uvicorn app.main:app --host 0.0.0.0 --port `$PORT" -ForegroundColor Gray
        Write-Host "5. Add environment variables (same as Railway)" -ForegroundColor White
        Write-Host "6. Deploy!" -ForegroundColor White
    }
    3 {
        Write-Host "🟣 Heroku Deployment" -ForegroundColor Yellow
        Write-Host "===================" -ForegroundColor Yellow
        Write-Host "Prerequisites: Install Heroku CLI" -ForegroundColor White
        Write-Host ""
        Write-Host "Commands to run:" -ForegroundColor White
        Write-Host "heroku login" -ForegroundColor Gray
        Write-Host "heroku create your-app-name" -ForegroundColor Gray
        Write-Host "heroku buildpacks:set https://github.com/timanovsky/subdir-heroku-buildpack" -ForegroundColor Gray
        Write-Host "heroku buildpacks:add heroku/python" -ForegroundColor Gray
        Write-Host "heroku config:set PROJECT_PATH=backend" -ForegroundColor Gray
        Write-Host "heroku config:set DATABASE_URL=your_database_url" -ForegroundColor Gray
        Write-Host "heroku config:set GOOGLE_API_KEY=your_google_ai_key" -ForegroundColor Gray
        Write-Host "heroku config:set FRONTEND_URL=your_frontend_url" -ForegroundColor Gray
        Write-Host "git push heroku main" -ForegroundColor Gray
    }
    4 {
        Write-Host "🌊 DigitalOcean App Platform" -ForegroundColor Yellow
        Write-Host "===========================" -ForegroundColor Yellow
        Write-Host "1. Go to https://cloud.digitalocean.com/apps" -ForegroundColor White
        Write-Host "2. Click 'Create App'" -ForegroundColor White
        Write-Host "3. Connect your GitHub repository" -ForegroundColor White
        Write-Host "4. Configure:" -ForegroundColor White
        Write-Host "   - Source Directory: backend" -ForegroundColor Gray
        Write-Host "   - Build Command: pip install -r requirements.txt" -ForegroundColor Gray
        Write-Host "   - Run Command: uvicorn app.main:app --host 0.0.0.0 --port `$PORT" -ForegroundColor Gray
        Write-Host "5. Add environment variables" -ForegroundColor White
        Write-Host "6. Deploy!" -ForegroundColor White
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📝 Environment Variables Needed:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://user:pass@host:port/db" -ForegroundColor Gray
Write-Host "GOOGLE_API_KEY=your_google_ai_key" -ForegroundColor Gray
Write-Host "SUPABASE_URL=your_supabase_project_url" -ForegroundColor Gray
Write-Host "SUPABASE_KEY=your_supabase_anon_key" -ForegroundColor Gray
Write-Host "FRONTEND_URL=https://your-frontend.vercel.app" -ForegroundColor Gray
Write-Host "SECRET_KEY=your_secret_key_for_jwt" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 After deployment:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "1. Get your backend URL from the platform" -ForegroundColor White
Write-Host "2. Update your frontend's NEXT_PUBLIC_API_URL" -ForegroundColor White
Write-Host "3. Redeploy your frontend" -ForegroundColor White
Write-Host ""
Write-Host "✅ Good luck with your deployment!" -ForegroundColor Green
