# Backend Deployment Guide

This guide covers deploying the FastAPI backend separately from the frontend.

## 🎯 Quick Start

Run the deployment helper script:
```bash
# Linux/Mac
./deploy-backend.sh

# Windows
./deploy-backend.ps1
```

## 🚀 Platform-Specific Instructions

### 1. Railway (Recommended) ⭐

**Why Railway?**
- Excellent Python support
- Automatic deployments from GitHub
- Built-in PostgreSQL
- Simple environment variable management

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. **Important**: Set Root Directory to `backend`
6. Add environment variables (see below)
7. Deploy automatically

**Cost**: $5/month for hobby plan

---

### 2. Render

**Steps:**
1. Go to [render.com](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repository
4. Configure:
   ```
   Name: us-insurance-backend
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add environment variables
6. Deploy

**Cost**: Free tier available, $7/month for starter

---

### 3. Heroku

**Prerequisites**: Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

**Steps:**
```bash
# Login
heroku login

# Create app
heroku create your-backend-name

# Set buildpacks for subdirectory
heroku buildpacks:set https://github.com/timanovsky/subdir-heroku-buildpack
heroku buildpacks:add heroku/python

# Configure
heroku config:set PROJECT_PATH=backend
heroku config:set DATABASE_URL=your_database_url
heroku config:set GOOGLE_API_KEY=your_google_ai_key
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app

# Deploy
git push heroku main
```

**Cost**: $7/month for basic dyno

---

### 4. DigitalOcean App Platform

**Steps:**
1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Create new app
3. Connect GitHub repository
4. Configure:
   ```
   Source Directory: backend
   Build Command: pip install -r requirements.txt
   Run Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add environment variables
6. Deploy

**Cost**: $5/month for basic app

## 🔧 Environment Variables

Set these in your deployment platform:

### Required Variables:
```env
DATABASE_URL=postgresql://username:password@host:port/database
GOOGLE_API_KEY=your_google_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
FRONTEND_URL=https://your-frontend.vercel.app
SECRET_KEY=your_jwt_secret_key
```

### Optional Variables:
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
DEBUG=false
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## 🗄️ Database Options

### Option A: Supabase (Recommended)
1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy connection string
4. Use as DATABASE_URL

### Option B: Platform Database
- **Railway**: Add PostgreSQL service
- **Render**: Create PostgreSQL database
- **Heroku**: Add Heroku Postgres add-on
- **DigitalOcean**: Add managed database

## 🔗 Connecting Frontend to Backend

After backend deployment:

1. **Get your backend URL** (e.g., `https://your-app.railway.app`)

2. **Update frontend environment variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   ```

3. **Redeploy frontend** on Vercel

## 🧪 Testing Your Deployment

1. **Health Check**: Visit `https://your-backend-url.com/`
2. **API Docs**: Visit `https://your-backend-url.com/docs`
3. **Test Endpoints**: Use the interactive API documentation

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure FRONTEND_URL is set correctly
   - Check CORS_ORIGINS in config.py

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check database credentials

3. **Build Failures**
   - Ensure requirements.txt is in backend directory
   - Check Python version compatibility

4. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in variable names

### Logs:
- **Railway**: View in dashboard
- **Render**: Check build and runtime logs
- **Heroku**: `heroku logs --tail`
- **DigitalOcean**: View in app console

## 📊 Monitoring

### Health Checks:
Most platforms provide automatic health checks. Your FastAPI app includes:
- Health endpoint at `/`
- Automatic API documentation at `/docs`

### Performance:
- Monitor response times
- Check database connection pool
- Monitor memory usage

## 🔄 CI/CD

All platforms support automatic deployments:
- **Push to main branch** → Automatic deployment
- **Environment-specific branches** for staging/production
- **Manual deployment triggers** available

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plan | Database |
|----------|-----------|-----------|----------|
| Railway | No | $5/month | Included |
| Render | Yes (limited) | $7/month | $7/month |
| Heroku | No | $7/month | $9/month |
| DigitalOcean | No | $5/month | $15/month |

## 🎯 Recommendation

**For Production**: Railway or Render
- Easy setup
- Good Python support
- Reasonable pricing
- Reliable infrastructure

**For Testing**: Render (free tier)
- Good for prototypes
- Easy to upgrade to paid

Choose based on your budget and requirements!
