#!/usr/bin/env python3
"""
Simple test script to verify the FastAPI application can start
"""
import sys
import traceback

try:
    print("Importing FastAPI...")
    from fastapi import FastAPI
    print("✓ FastAPI imported successfully")
    
    print("Importing app modules...")
    from app.main import app
    print("✓ App imported successfully")
    
    print("Testing basic app functionality...")
    print(f"App title: {app.title}")
    print(f"App version: {app.version}")
    
    print("✓ All imports successful!")
    print("The application should be able to start normally.")
    
except Exception as e:
    print(f"❌ Error occurred: {e}")
    print("Full traceback:")
    traceback.print_exc()
    sys.exit(1)
