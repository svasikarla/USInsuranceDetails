#!/bin/bash

# Deployment script for US Insurance Platform

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: No package.json found. Make sure you're in the project root."
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Go back to root
cd ..

echo "✅ Build completed successfully!"
echo "📋 Next steps:"
echo "1. Push your changes to GitHub"
echo "2. Connect your repository to Vercel"
echo "3. Set up environment variables in Vercel dashboard"
echo "4. Deploy!"

echo ""
echo "🔗 Useful links:"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Deployment Guide: See DEPLOYMENT_GUIDE.md"
