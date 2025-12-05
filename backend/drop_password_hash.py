#!/usr/bin/env python
"""
Migration script to drop password_hash column from users table
Passwords are now stored exclusively in Supabase Auth
"""
from app.utils.db import engine
from sqlalchemy import text

def drop_password_hash_column():
    """Drop password_hash column from users table"""
    with engine.connect() as conn:
        # Drop the password_hash column
        conn.execute(text('ALTER TABLE users DROP COLUMN IF EXISTS password_hash'))
        conn.commit()
        print("[OK] Successfully dropped password_hash column from users table")
        print("[OK] Passwords are now stored exclusively in Supabase Auth")

if __name__ == "__main__":
    drop_password_hash_column()
