from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, documents, policies, carriers, search, ai_analysis, users, dashboard, categorization
from .core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for US Insurance Policy Analysis Platform",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(policies.router, prefix="/api/policies", tags=["Policies"])
app.include_router(carriers.router, prefix="/api/carriers", tags=["Insurance Carriers"])
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(ai_analysis.router, prefix="/api/ai", tags=["AI Analysis"])
app.include_router(categorization.router, tags=["Categorization"])

@app.on_event("startup")
async def list_routes():
    print("Registered routes:")
    for route in app.routes:
        print(f"{route.path} [{','.join(route.methods)}]")

@app.get("/", tags=["Health Check"])
async def root():
    """
    Health check endpoint to verify API is running
    """
    return {"status": "healthy", "message": "US Insurance Policy Platform API is running"}
