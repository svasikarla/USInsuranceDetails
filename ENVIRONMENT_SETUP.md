# Environment Variables Setup Guide

This guide helps you configure the environment variables for local development and deployment.

## 🔧 Local Development Setup

### 1. Backend Environment (`backend/.env`)

The backend `.env` file has been restored with template values. Update these with your actual values:

```bash
# Navigate to backend directory
cd backend

# Edit the .env file with your actual values
# Replace the placeholder values with your real credentials
```

**Required Updates:**
```env
# Replace with your actual Supabase database URL
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# Replace with your actual Supabase project URL
SUPABASE_URL=https://your-project-ref.supabase.co

# Replace with your actual Supabase anon key
SUPABASE_KEY=your-supabase-anon-key

# Replace with your actual Google AI API key
GOOGLE_API_KEY=your-google-gemini-api-key

# Generate a secure secret key for JWT
SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-random
```

### 2. Frontend Environment (`frontend/.env.local`)

The frontend `.env.local` file has been restored. Update these values:

```env
# Replace with your actual Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Replace with your actual Supabase anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🔍 How to Get Your Supabase Credentials

### 1. Supabase URL and Keys
1. Go to [supabase.com](https://supabase.com)
2. Open your project dashboard
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon public** key → Use as `SUPABASE_KEY`

### 2. Database URL
1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Copy the **URI** format
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 3. Google AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key → Use as `GOOGLE_API_KEY`

## 🚀 Deployment Environment Variables

### For Railway/Render/Heroku:
Set these environment variables in your deployment platform:

```env
DATABASE_URL=your_supabase_database_url
GOOGLE_API_KEY=your_google_ai_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
FRONTEND_URL=https://your-frontend.vercel.app
SECRET_KEY=your_jwt_secret_key
```

### For Vercel (Frontend):
Set these in Vercel dashboard:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔒 Security Notes

- ✅ **Environment files are NOT tracked by Git** - They stay local only
- ✅ **Never commit API keys** to version control
- ✅ **Use different keys** for development and production
- ✅ **Rotate keys regularly** for security

## 🧪 Testing Your Setup

### Backend Test:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python run.py
```

Visit: `http://localhost:8000/docs`

### Frontend Test:
```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:3000`

## ❓ Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check your DATABASE_URL format
   - Verify your Supabase password
   - Ensure your IP is allowed in Supabase

2. **API Key Errors**
   - Verify your Google AI API key is valid
   - Check if you have quota remaining
   - Ensure the key has proper permissions

3. **CORS Errors**
   - Check FRONTEND_URL in backend environment
   - Verify API URL in frontend environment

## 📝 Quick Reference

**Backend .env location**: `backend/.env`
**Frontend .env location**: `frontend/.env.local`
**Example template**: `.env.example`

Both files exist locally but are ignored by Git for security.
