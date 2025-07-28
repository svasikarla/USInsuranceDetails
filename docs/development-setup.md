# 🛠️ Development Environment Setup Guide

## 📋 Prerequisites

### Required Software
- **Node.js**: v18.0+ (LTS recommended)
- **Python**: 3.11+
- **Git**: Latest version
- **Docker**: Latest version (optional but recommended)
- **PostgreSQL**: 14+ (or use Supabase)

### Development Tools
- **VS Code** (recommended) with extensions:
  - Python
  - TypeScript and JavaScript
  - Prettier
  - ESLint
  - GitLens
- **Postman** or **Insomnia** for API testing

## 🏗️ Project Structure

```
us-insurance-platform/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── styles/         # CSS and styling
│   ├── public/             # Static assets
│   ├── package.json
│   └── next.config.js
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── tests/          # Test files
│   ├── requirements.txt
│   └── main.py
├── docs/                   # Documentation
├── scripts/                # Setup and utility scripts
├── docker-compose.yml      # Docker configuration
└── README.md
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd us-insurance-platform
```

### 2. Environment Variables
Create environment files:

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/insurance_db
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SECRET_KEY=your_secret_key_here
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Database Setup

#### Option A: Using Supabase (Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and keys to environment files
4. Run database migrations:
```bash
cd backend
python scripts/setup_database.py
```

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL
# Create database
createdb insurance_db

# Run migrations
cd backend
alembic upgrade head
```

### 4. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 6. Verify Setup
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🐳 Docker Setup (Alternative)

### Using Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

### Docker Compose Configuration
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/insurance_db
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=insurance_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 🧪 Testing Setup

### Backend Testing
```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_document_processing.py
```

### Frontend Testing
```bash
cd frontend

# Install test dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (if configured)
npm run test:e2e
```

## 🔧 Development Tools Configuration

### VS Code Settings (.vscode/settings.json)
```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

### Pre-commit Configuration (.pre-commit-config.yaml)
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 22.10.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/isort
    rev: 5.10.1
    hooks:
      - id: isort

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.0-alpha.4
    hooks:
      - id: prettier
        files: \.(js|ts|jsx|tsx|json|css|md)$
```

## 📊 Monitoring & Debugging

### Backend Logging
```python
# logging_config.py
import logging
import sys

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler("app.log"),
            logging.StreamHandler(sys.stdout)
        ]
    )
```

### Frontend Error Monitoring
```typescript
// error-boundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check Python version
python --version

# Check virtual environment
which python

# Check dependencies
pip list

# Check database connection
python -c "import psycopg2; print('PostgreSQL connection OK')"
```

#### Frontend Build Errors
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U postgres -d insurance_db

# Check environment variables
echo $DATABASE_URL

# Verify Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
```

## 📚 Additional Resources

### Documentation Links
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Development Guidelines
- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Use [Semantic Versioning](https://semver.org/)
- Follow [Python PEP 8](https://pep8.org/) style guide
- Use [TypeScript strict mode](https://www.typescriptlang.org/tsconfig#strict)

### Team Communication
- Daily standups at 9:00 AM
- Sprint planning every 2 weeks
- Code reviews required for all PRs
- Demo sessions every Friday
