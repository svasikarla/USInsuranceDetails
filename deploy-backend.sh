#!/bin/bash

# Backend Deployment Script for US Insurance Platform

echo "🚀 Backend Deployment Helper"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Error: backend/requirements.txt not found. Make sure you're in the project root."
    exit 1
fi

echo "📋 Choose your deployment platform:"
echo "1. Railway (Recommended)"
echo "2. Render"
echo "3. Heroku"
echo "4. DigitalOcean App Platform"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚂 Railway Deployment"
        echo "====================="
        echo "1. Go to https://railway.app"
        echo "2. Sign up/login with GitHub"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select your repository"
        echo "5. Set Root Directory to 'backend'"
        echo "6. Add environment variables:"
        echo "   - DATABASE_URL"
        echo "   - GOOGLE_API_KEY"
        echo "   - SUPABASE_URL"
        echo "   - SUPABASE_KEY"
        echo "   - FRONTEND_URL (your Vercel URL)"
        echo "7. Deploy!"
        ;;
    2)
        echo "🎨 Render Deployment"
        echo "==================="
        echo "1. Go to https://render.com"
        echo "2. Click 'New +' → 'Web Service'"
        echo "3. Connect your GitHub repository"
        echo "4. Configure:"
        echo "   - Root Directory: backend"
        echo "   - Build Command: pip install -r requirements.txt"
        echo "   - Start Command: uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
        echo "5. Add environment variables (same as Railway)"
        echo "6. Deploy!"
        ;;
    3)
        echo "🟣 Heroku Deployment"
        echo "==================="
        echo "Prerequisites: Install Heroku CLI"
        echo ""
        echo "Commands to run:"
        echo "heroku login"
        echo "heroku create your-app-name"
        echo "heroku buildpacks:set https://github.com/timanovsky/subdir-heroku-buildpack"
        echo "heroku buildpacks:add heroku/python"
        echo "heroku config:set PROJECT_PATH=backend"
        echo "heroku config:set DATABASE_URL=your_database_url"
        echo "heroku config:set GOOGLE_API_KEY=your_google_ai_key"
        echo "heroku config:set FRONTEND_URL=your_frontend_url"
        echo "git push heroku main"
        ;;
    4)
        echo "🌊 DigitalOcean App Platform"
        echo "==========================="
        echo "1. Go to https://cloud.digitalocean.com/apps"
        echo "2. Click 'Create App'"
        echo "3. Connect your GitHub repository"
        echo "4. Configure:"
        echo "   - Source Directory: backend"
        echo "   - Build Command: pip install -r requirements.txt"
        echo "   - Run Command: uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
        echo "5. Add environment variables"
        echo "6. Deploy!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📝 Environment Variables Needed:"
echo "================================"
echo "DATABASE_URL=postgresql://user:pass@host:port/db"
echo "GOOGLE_API_KEY=your_google_ai_key"
echo "SUPABASE_URL=your_supabase_project_url"
echo "SUPABASE_KEY=your_supabase_anon_key"
echo "FRONTEND_URL=https://your-frontend.vercel.app"
echo "SECRET_KEY=your_secret_key_for_jwt"
echo ""
echo "🔗 After deployment:"
echo "==================="
echo "1. Get your backend URL from the platform"
echo "2. Update your frontend's NEXT_PUBLIC_API_URL"
echo "3. Redeploy your frontend"
echo ""
echo "✅ Good luck with your deployment!"
