import os
import uvicorn
from pathlib import Path

# Create uploads directory if it doesn't exist
uploads_dir = Path("./uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)

# Initialize Supabase database
def init_database():
    try:
        print("Initializing database with Supabase...")
        from app.utils.db import engine
        from app.models.base import Base
        from app.core.init_db import init_db
        from app.utils.db import SessionLocal
        
        # Create all tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        
        # Initialize data
        print("Initializing default data...")
        db = SessionLocal()
        try:
            init_db(db)
            print("Database initialization complete!")
        finally:
            db.close()
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        print("Continuing application startup despite database initialization error.")


if __name__ == "__main__":
    # Initialize database before starting the app
    init_database()
    
    # Run the FastAPI application with uvicorn
    print("Starting FastAPI application...")
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
