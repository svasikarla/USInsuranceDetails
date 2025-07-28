#!/usr/bin/env python3
"""
Test frontend connectivity
"""
import requests
import time
import sys

def test_frontend():
    frontend_url = "http://localhost:3000"
    
    print("Testing frontend connectivity...")
    
    # Wait for server to start
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            print(f"Attempt {attempt + 1}/{max_attempts}: Testing {frontend_url}")
            response = requests.get(frontend_url, timeout=5)
            
            if response.status_code == 200:
                print(f"✓ Frontend is accessible!")
                print(f"✓ Status Code: {response.status_code}")
                print(f"✓ Content Length: {len(response.text)} bytes")
                
                # Check if it contains expected content
                if "US Insurance Policy Platform" in response.text:
                    print("✓ Page contains expected title")
                else:
                    print("? Page title not found in content")
                
                return True
            else:
                print(f"? Unexpected status code: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"  Connection failed, waiting 2 seconds...")
            time.sleep(2)
        except Exception as e:
            print(f"  Error: {e}")
            time.sleep(2)
    
    print("❌ Frontend is not accessible after all attempts")
    return False

if __name__ == "__main__":
    success = test_frontend()
    sys.exit(0 if success else 1)
