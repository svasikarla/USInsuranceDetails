#!/usr/bin/env python3
"""
Script to list all tables in the Supabase database
"""
import sys
import os

# Add the backend directory to the path to import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    
    # Database URL from .env file
    DATABASE_URL = "postgresql://postgres.pkiztedrylfvymdowtno:March%40012025@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    
    # Create engine
    engine = create_engine(DATABASE_URL)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    
    # Query to get all tables
    query = text("""
        SELECT table_schema, table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY table_schema, table_name;
    """)
    
    result = session.execute(query)
    tables = result.fetchall()
    
    print("\n=== SUPABASE DATABASE TABLES ===\n")
    
    current_schema = None
    for row in tables:
        schema, table, table_type = row
        if schema != current_schema:
            print(f"\n📁 Schema: {schema}")
            current_schema = schema
        print(f"  📋 {table} ({table_type})")
    
    print(f"\n✅ Total tables found: {len(tables)}")
    
    # Close session
    session.close()
    
except ImportError as e:
    print(f"❌ Missing required module: {e}")
    print("Please install required dependencies:")
    print("pip install sqlalchemy psycopg2-binary")
    
except Exception as e:
    print(f"❌ Error connecting to database: {e}")
    print("Please check your database connection settings.")