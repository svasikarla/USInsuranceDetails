# US Insurance Policy Analysis Platform

A comprehensive platform for analyzing insurance policies, detecting red flags, and managing policy documents with AI-powered insights.

## 🚀 Features

- **Document Upload & Processing**: Upload and analyze insurance policy documents
- **AI-Powered Red Flag Detection**: Automatically identify potential issues in policies
- **Policy Management**: Comprehensive CRUD operations for policies and carriers
- **Dashboard Analytics**: Visual insights and statistics
- **Search & Filtering**: Advanced search capabilities across policies and documents
- **Responsive Design**: Modern UI with Tailwind CSS and Framer Motion

## 🛠️ Tech Stack

### Frontend
- **Next.js 13** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database (via Supabase)
- **Supabase** - Backend as a Service
- **Google Gemini AI** - AI analysis
- **PyPDF2** - PDF processing
- **Tesseract OCR** - Text extraction

## 📁 Project Structure

```
├── frontend/           # Next.js frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Next.js pages
│   │   ├── services/   # API services
│   │   ├── types/      # TypeScript types
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── backend/            # FastAPI backend application
│   ├── app/
│   │   ├── core/       # Core configuration
│   │   ├── models/     # Database models
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── utils/      # Utility functions
│   └── tests/          # Backend tests
├── api/                # Vercel serverless functions
├── docs/               # Documentation
└── deploy.*            # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- PostgreSQL (or Supabase account)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
GOOGLE_API_KEY=your_google_ai_key
```

## 🌐 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

### Alternative Platforms
- **Frontend**: Netlify, Vercel
- **Backend**: Railway, Render, Heroku

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [API Documentation](docs/README.md) - Backend API reference
- [AI Implementation](docs/AI_IMPLEMENTATION_GUIDE.md) - AI features guide

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run test
npm run lint
```

### Backend
```bash
cd backend
pytest
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.
