#!/usr/bin/env python3
"""
Minimal FastAPI app to test if the basic setup works
"""
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Test App")

@app.get("/")
async def root():
    return {"status": "healthy", "message": "Test app is running"}

@app.get("/test")
async def test():
    return {"test": "success"}

if __name__ == "__main__":
    print("Starting minimal test app...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
