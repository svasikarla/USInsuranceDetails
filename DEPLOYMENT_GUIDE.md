# Deployment Guide for US Insurance Platform

## Option 1: Frontend-Only Deployment on Vercel (Recommended)

This is the simplest and most reliable approach for Vercel deployment.

### Step 1: Deploy Frontend to Vercel

1. **Connect your GitHub repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click "New Project"
   - Import your `USInsuranceDetails` repository

2. **Configure build settings:**
   - Framework Preset: `Next.js`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set environment variables in Vercel:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Step 2: Deploy Backend Separately

Deploy your Python FastAPI backend on one of these platforms:

#### Option A: Railway (Recommended for Python)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select the `backend` folder
4. Railway will auto-detect Python and deploy

#### Option B: Render
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your repository
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### Option C: Heroku
1. Install Heroku CLI
2. Create a `Procfile` in backend directory:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Deploy using Heroku CLI

## Option 2: Full-Stack Deployment on Vercel

Deploy both frontend and backend on Vercel using serverless functions.

### Prerequisites
- The `vercel.json` and `api/index.py` files are already created
- Root-level `requirements.txt` is created

### Deployment Steps

1. **Connect repository to Vercel:**
   - Import your repository to Vercel
   - Use default settings (Vercel will detect the configuration)

2. **Set environment variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   DATABASE_URL=your_database_connection_string
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GOOGLE_API_KEY=your_google_api_key
   ```

3. **Deploy:**
   - Vercel will automatically build and deploy both frontend and backend
   - Frontend will be available at your Vercel domain
   - API will be available at `your-domain.vercel.app/api/`

## Database Considerations

### For Production Deployment:

1. **Use Supabase (Recommended):**
   - Create a Supabase project
   - Use the provided PostgreSQL database
   - Update your connection string in environment variables

2. **Alternative: External PostgreSQL:**
   - Use services like Neon, PlanetScale, or AWS RDS
   - Update DATABASE_URL environment variable

## Important Notes

### Limitations of Vercel Serverless Functions:
- **Execution time limit:** 30 seconds (can be increased on paid plans)
- **Memory limit:** 1024MB
- **File size limit:** 50MB per function
- **Cold starts:** Functions may have startup delays

### File Upload Considerations:
- Vercel has a 4.5MB request limit
- For larger file uploads, consider using:
  - Direct uploads to cloud storage (AWS S3, Cloudinary)
  - Chunked upload strategies
  - External file processing services

### AI/ML Dependencies:
- Some packages like `spacy` models might be too large for Vercel
- Consider using external AI APIs or lighter alternatives
- Pre-download and cache models if possible

## Recommended Architecture for Production

```
Frontend (Vercel) → API Gateway → Backend Services
                                ├── Authentication (Supabase Auth)
                                ├── Database (Supabase/PostgreSQL)
                                ├── File Storage (AWS S3/Cloudinary)
                                └── AI Processing (External APIs)
```

## Testing Your Deployment

1. **Frontend:** Visit your Vercel domain
2. **API:** Test endpoints at `your-domain.vercel.app/api/health`
3. **Database:** Verify database connections work
4. **File uploads:** Test document upload functionality
5. **AI features:** Test red flag detection and analysis

## Troubleshooting

### Common Issues:
1. **Build failures:** Check build logs in Vercel dashboard
2. **API timeouts:** Optimize slow endpoints or increase timeout limits
3. **Environment variables:** Ensure all required variables are set
4. **CORS errors:** Check CORS configuration in your FastAPI app
5. **Database connections:** Verify connection strings and credentials

### Monitoring:
- Use Vercel Analytics for frontend performance
- Set up logging for API endpoints
- Monitor database performance in Supabase dashboard
