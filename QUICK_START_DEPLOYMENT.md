# Quick Start Deployment Guide - Free Tier

This guide provides step-by-step instructions for deploying the US Insurance Policy Analysis Platform using completely free (or trial) hosting services.

## 🎯 Recommended Free Deployment Stack

- **Frontend**: Vercel (Free Forever)
- **Backend**: Render (Free for 90 days, then $7/month)
- **Database**: Supabase (Free Tier - 500 MB)
- **File Storage**: Supabase Storage (Free Tier - 1 GB)
- **AI Processing**: Google Gemini (Free Tier - 60 requests/minute)

**Total Cost**: $0 for first 90 days, then $7/month

---

## 📋 Prerequisites

Before starting, create accounts on:
1. [GitHub](https://github.com) - for code repository (free)
2. [Supabase](https://supabase.com) - for database (free)
3. [Vercel](https://vercel.com) - for frontend hosting (free)
4. [Render](https://render.com) - for backend hosting (free trial)
5. [Google AI Studio](https://makersuite.google.com) - for AI API (free)

**Time Required**: 30-45 minutes for complete setup

---

## Step 1: Set Up Database (Supabase)

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New project"
5. Fill in details:
   - **Name**: `us-insurance-app`
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free
6. Click "Create new project"
7. Wait 2-3 minutes for project to initialize

### 1.2 Get Database Credentials
Once project is ready:

1. Go to **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password
5. Save this as `DATABASE_URL`

Example:
```
postgresql://postgres.abcdefgh:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### 1.3 Get API Credentials
1. Go to **Settings** → **API**
2. Copy and save:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public** key → This is your `SUPABASE_KEY`

### 1.4 Enable Storage
1. Go to **Storage** in left sidebar
2. Click "Create a new bucket"
3. Name it: `policy-documents`
4. Set to **Public** or **Private** based on your needs
5. Click "Create bucket"

---

## Step 2: Get Google AI API Key

### 2.1 Create API Key
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Select "Create API key in new project"
5. Copy the API key (SAVE THIS!)
6. This is your `GOOGLE_API_KEY`

**Note**: Free tier includes 60 requests per minute, which is sufficient for development and small production use.

---

## Step 3: Deploy Backend to Render

### 3.1 Prepare Your Repository
Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 3.2 Create Render Account and Deploy
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub
4. Click "New +" → "Web Service"
5. Click "Connect account" to connect GitHub
6. Select your `USInsuranceDetails` repository
7. Click "Connect"

### 3.3 Configure Backend Service
Fill in the deployment configuration:

**Basic Settings**:
- **Name**: `us-insurance-backend`
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Instance Type**:
- Select: **Free** (512 MB RAM, sleeps after 15 min)

### 3.4 Add Environment Variables
Scroll down to "Environment Variables" and add:

Click "Add Environment Variable" for each:

```
DATABASE_URL = <paste your Supabase DATABASE_URL>
SUPABASE_URL = <paste your SUPABASE_URL>
SUPABASE_KEY = <paste your SUPABASE_KEY>
GOOGLE_API_KEY = <paste your GOOGLE_API_KEY>
SECRET_KEY = <generate a random string, min 32 characters>
FRONTEND_URL = https://your-app-name.vercel.app
DEBUG = false
```

**To generate SECRET_KEY** (on your computer):
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Important**: You'll update `FRONTEND_URL` after deploying frontend in Step 4.

### 3.5 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Render will show build logs
4. Once deployed, you'll see "Your service is live 🎉"
5. Note your backend URL: `https://us-insurance-backend.onrender.com`

### 3.6 Test Backend
Visit: `https://us-insurance-backend.onrender.com/`

You should see:
```json
{
  "status": "healthy",
  "message": "US Insurance Policy Platform API is running"
}
```

Also test API docs at: `https://us-insurance-backend.onrender.com/docs`

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel

### 4.2 Import Project
1. Click "Add New..." → "Project"
2. Find your `USInsuranceDetails` repository
3. Click "Import"

### 4.3 Configure Project
**Framework Preset**: Next.js (auto-detected)

**Build and Development Settings**:
- **Root Directory**: `frontend` (click "Edit" to change)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### 4.4 Add Environment Variables
Click "Environment Variables" and add:

```
NEXT_PUBLIC_API_URL = https://us-insurance-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL = <paste your SUPABASE_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <paste your SUPABASE_KEY>
```

**Important**: Make sure to use the exact backend URL from Step 3.5 without trailing slash.

### 4.5 Deploy
1. Click "Deploy"
2. Wait 2-5 minutes for build and deployment
3. Vercel will show build logs
4. Once complete, you'll see your deployment URL
5. Click "Visit" to see your live app

Your app will be at: `https://your-project-name.vercel.app`

---

## Step 5: Update Backend FRONTEND_URL

Now that frontend is deployed, update the backend:

1. Go back to Render dashboard
2. Select your `us-insurance-backend` service
3. Go to "Environment" tab
4. Find `FRONTEND_URL` variable
5. Update value to: `https://your-project-name.vercel.app`
6. Click "Save Changes"
7. Service will automatically redeploy (takes 1-2 minutes)

---

## Step 6: Initialize Database

### 6.1 Run Database Migrations

You need to create the database tables. You can do this by:

**Option A: Run initialization script through Render Shell**
1. In Render dashboard, go to your backend service
2. Click "Shell" tab (top right)
3. Wait for shell to connect
4. Run:
```bash
python -c "from app.core.init_db import init_db; init_db()"
```

**Option B: Run locally and connect to production database**
1. On your local machine:
```bash
cd backend
export DATABASE_URL="<your-supabase-database-url>"
python -c "from app.core.init_db import init_db; init_db()"
```

**Option C: Use Supabase SQL Editor**
1. Go to Supabase dashboard
2. Click "SQL Editor"
3. Run the table creation scripts from your SQLAlchemy models

### 6.2 Create First User (Optional)

You can create a test user through:
1. Your deployed frontend at `/register`
2. Or via API docs at `https://your-backend.onrender.com/docs`

---

## Step 7: Test Your Deployment

### 7.1 Frontend Tests
Visit your Vercel URL: `https://your-project-name.vercel.app`

1. ✅ Landing page loads correctly
2. ✅ Can navigate to login/register
3. ✅ Can register a new account
4. ✅ Can log in with credentials
5. ✅ Dashboard loads after login
6. ✅ Can navigate between pages

### 7.2 Backend Tests
Visit: `https://your-backend.onrender.com/docs`

1. ✅ API documentation loads
2. ✅ Health check returns success
3. ✅ Can test authentication endpoints
4. ✅ Database queries work

### 7.3 Full Integration Tests
1. ✅ Upload a test document
2. ✅ Create a policy
3. ✅ View analytics dashboard
4. ✅ Search functionality works
5. ✅ AI analysis features work (if configured)

---

## 🎉 Deployment Complete!

Your application is now live at:
- **Frontend**: `https://your-project-name.vercel.app`
- **Backend API**: `https://your-backend.onrender.com`
- **API Docs**: `https://your-backend.onrender.com/docs`

---

## 🔧 Post-Deployment Configuration

### Enable Automatic Deployments
Both Vercel and Render automatically deploy when you push to GitHub:

**Vercel**:
- Pushes to `main` → Production deployment
- Pull requests → Preview deployments

**Render**:
- Pushes to `main` → Automatic deployment
- Configure in "Settings" → "Build & Deploy"

### Set Up Custom Domain (Optional)
**On Vercel**:
1. Go to project settings → "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

**On Render**:
1. Go to service settings → "Custom Domains"
2. Add your domain
3. Update DNS records as instructed

### Add Health Check Monitoring
To keep your Render service from sleeping:

**Option 1: UptimeRobot** (Free)
1. Sign up at https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend.onrender.com/`
   - Monitoring interval: 14 minutes
3. This pings your app every 14 minutes, preventing sleep

**Option 2: Cron-job.org** (Free)
1. Sign up at https://cron-job.org
2. Create job to ping your backend URL every 14 minutes

---

## 🚨 Troubleshooting

### Frontend Issues

**Build Fails**:
- Check build logs in Vercel dashboard
- Verify all environment variables are set correctly
- Ensure `frontend` directory is set as root
- Check for TypeScript errors (note: currently ignored in config)

**API Connection Errors**:
- Verify `NEXT_PUBLIC_API_URL` matches your backend URL
- Check browser console for CORS errors
- Ensure backend `FRONTEND_URL` is set correctly

**Pages Don't Load**:
- Check for JavaScript errors in browser console
- Verify Supabase credentials are correct
- Check network tab for failed API requests

### Backend Issues

**Deployment Fails**:
- Check build logs in Render dashboard
- Verify `requirements.txt` is in `backend` directory
- Check Python version compatibility
- Ensure all environment variables are set

**Database Connection Errors**:
- Verify `DATABASE_URL` format is correct
- Check if Supabase password is correct
- Ensure Supabase project is active
- Try connecting from local machine with same URL

**API Returns 500 Errors**:
- Check Render logs (Logs tab in dashboard)
- Verify all required environment variables are set
- Check database tables exist
- Test individual endpoints in API docs

**Slow Response Times / Cold Starts**:
- This is expected on Render free tier (15 min sleep)
- First request after sleep takes 30+ seconds
- Subsequent requests are faster
- Solution: Set up UptimeRobot or upgrade to paid tier

### CORS Errors
If you see CORS errors in browser console:

1. Verify backend `FRONTEND_URL` matches your Vercel URL exactly
2. Check `backend/app/core/config.py` CORS settings
3. In Render, check environment variable is set correctly
4. Redeploy backend after changing FRONTEND_URL

### Database Migration Issues
If tables don't exist:

1. Check Render logs for errors during initialization
2. Try running init_db manually (see Step 6.1)
3. Verify DATABASE_URL is correct
4. Check Supabase project is active

---

## 📊 Monitoring Your App

### Vercel Analytics (Built-in)
- Go to project in Vercel
- Click "Analytics" tab
- View page views, performance metrics

### Render Metrics (Built-in)
- Go to service in Render
- Click "Metrics" tab
- View CPU, memory, response times

### Supabase Monitoring
- Go to Supabase dashboard
- Check "Database" for connection stats
- Check "Storage" for file usage
- Check "Auth" for user activity

---

## 💰 Cost Tracking

### Current Costs
- **Vercel**: $0/month (Free tier)
- **Render**: $0/month (Free for 90 days)
- **Supabase**: $0/month (Free tier - 500 MB)
- **Google AI**: $0/month (Free tier - 60 req/min)
- **Total**: $0/month for first 90 days

### After 90 Days
- **Render**: $7/month (or switch to alternative)
- **Everything else**: Still free
- **Total**: $7/month

### Upgrade Triggers
Consider upgrading when:
- Render free trial ends (90 days)
- Database exceeds 500 MB (Supabase: $25/mo for 8 GB)
- Need faster response times (Render: $7/mo removes sleep)
- Traffic exceeds free limits
- Commercial usage (Vercel Pro: $20/mo)

---

## 🔄 Updating Your App

### Deploy Updates
Simply push to GitHub:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Both Vercel and Render will automatically deploy updates.

### Rollback a Deployment
**On Vercel**:
1. Go to project → "Deployments"
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**On Render**:
1. Go to service → "Events"
2. Find previous deployment
3. Click "Redeploy"

---

## 📞 Getting Help

### Official Documentation
- **Vercel**: https://vercel.com/docs
- **Render**: https://render.com/docs
- **Supabase**: https://supabase.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs

### Community Support
- **Vercel Discord**: https://vercel.com/discord
- **Render Community**: https://community.render.com
- **Supabase Discord**: https://discord.supabase.com

### Check Status Pages
- **Vercel Status**: https://www.vercel-status.com
- **Render Status**: https://status.render.com
- **Supabase Status**: https://status.supabase.com

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

- [ ] Created Supabase account and project
- [ ] Obtained Supabase DATABASE_URL
- [ ] Obtained Supabase API credentials (URL + Key)
- [ ] Created storage bucket in Supabase
- [ ] Obtained Google Gemini API key
- [ ] Generated SECRET_KEY for JWT
- [ ] Pushed code to GitHub
- [ ] Created Render account
- [ ] Deployed backend to Render
- [ ] Configured backend environment variables
- [ ] Tested backend health endpoint
- [ ] Created Vercel account
- [ ] Deployed frontend to Vercel
- [ ] Configured frontend environment variables
- [ ] Updated backend FRONTEND_URL
- [ ] Initialized database tables
- [ ] Created test user account
- [ ] Tested full user journey
- [ ] Set up uptime monitoring (optional)
- [ ] Configured custom domain (optional)
- [ ] Documented deployment URLs

---

## 🎓 Next Steps

After successful deployment:

1. **Test thoroughly** with real data and workflows
2. **Monitor performance** using built-in analytics
3. **Gather user feedback** if applicable
4. **Plan for scaling** if app gains traction
5. **Set up backups** for important data
6. **Implement monitoring** (Sentry, LogRocket)
7. **Add more features** based on usage

---

**Good luck with your deployment! 🚀**

For detailed technical analysis, see `DEPLOYMENT_READINESS_REVIEW.md`
