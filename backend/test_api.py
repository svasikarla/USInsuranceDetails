#!/usr/bin/env python3
"""
Test the API endpoints
"""
import requests
import time
import sys

def test_api():
    base_url = "http://127.0.0.1:8000"
    
    # Wait a moment for server to start
    print("Waiting for server to start...")
    time.sleep(3)
    
    try:
        # Test health check endpoint
        print(f"Testing {base_url}/")
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test docs endpoint
        print(f"\nTesting {base_url}/docs")
        response = requests.get(f"{base_url}/docs", timeout=10)
        print(f"Docs Status Code: {response.status_code}")
        
        print("✓ API is working correctly!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the server")
        print("Make sure the server is running on http://127.0.0.1:8000")
        return False
    except Exception as e:
        print(f"❌ Error testing API: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)
