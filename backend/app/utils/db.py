from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, NullPool
import urllib.parse
import os
import logging

from app.core.config import settings

# Configure logging for database operations
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

# Use Supabase PostgreSQL connection from environment variables
DATABASE_URL = settings.DATABASE_URL

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required for Supabase connection")

print(f"Connecting to database: {DATABASE_URL.split('@')[0]}@***")

# Determine if we're using Supabase pooler or direct connection
is_supabase_pooler = "pooler.supabase.com" in DATABASE_URL

# Create SQLAlchemy engine with optimized connection pooling
if is_supabase_pooler:
    # For Supabase pooler, use optimized QueuePool settings
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=10,           # Number of connections to maintain in pool
        max_overflow=20,        # Additional connections beyond pool_size
        pool_timeout=30,        # Timeout when getting connection from pool
        pool_recycle=3600,      # Recycle connections after 1 hour
        pool_pre_ping=True,     # Verify connections before use
        echo=False,             # Set to True for SQL debugging
        connect_args={
            "sslmode": "require",
            "application_name": "us_insurance_platform_optimized",
            "connect_timeout": 10,
            "options": "-c jit=off"  # Disable JIT for faster query planning
        }
    )
else:
    # For direct connections, use NullPool
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=False,
        pool_pre_ping=True,
        connect_args={
            "sslmode": "require",
            "application_name": "us_insurance_platform"
        }
    )

print(f"✅ Database engine configured with {'QueuePool' if is_supabase_pooler else 'NullPool'}")

# Create session factory with optimized settings
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Prevent lazy loading issues after commit
)

# Database health check function
def check_database_health():
    """Check database connectivity and performance"""
    try:
        from sqlalchemy import text
        import time

        start_time = time.time()
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchone()

        response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

        return {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "pool_size": engine.pool.size() if hasattr(engine.pool, 'size') else None,
            "checked_out": engine.pool.checkedout() if hasattr(engine.pool, 'checkedout') else None,
            "overflow": engine.pool.overflow() if hasattr(engine.pool, 'overflow') else None,
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "response_time_ms": None
        }

# Optimized database dependency with connection reuse
def get_db():
    """
    Database dependency with optimized connection handling.
    Uses connection pooling for better performance.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

# Database connection context manager for manual use
class DatabaseConnection:
    """Context manager for database connections with automatic cleanup"""

    def __init__(self):
        self.db = None

    def __enter__(self):
        self.db = SessionLocal()
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.db.rollback()
        self.db.close()

# Performance monitoring decorator
def monitor_db_performance(func):
    """Decorator to monitor database operation performance"""
    import functools
    import time

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = (time.time() - start_time) * 1000

            # Log slow queries (> 1000ms)
            if execution_time > 1000:
                print(f"⚠️  Slow query detected in {func.__name__}: {execution_time:.2f}ms")

            return result
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            print(f"❌ Database error in {func.__name__} after {execution_time:.2f}ms: {e}")
            raise

    return wrapper
