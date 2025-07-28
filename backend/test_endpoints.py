#!/usr/bin/env python3
"""
Test various API endpoints
"""
import requests
import json

def test_endpoints():
    base_url = "http://127.0.0.1:8000"
    
    print("=== Testing API Endpoints ===\n")
    
    # Test health check
    print("1. Health Check:")
    try:
        response = requests.get(f"{base_url}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test OpenAPI docs
    print("\n2. OpenAPI Documentation:")
    try:
        response = requests.get(f"{base_url}/openapi.json")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            openapi_data = response.json()
            print(f"   Title: {openapi_data.get('info', {}).get('title')}")
            print(f"   Version: {openapi_data.get('info', {}).get('version')}")
            print(f"   Available paths: {len(openapi_data.get('paths', {}))}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test carriers endpoint (should require auth)
    print("\n3. Carriers Endpoint (without auth):")
    try:
        response = requests.get(f"{base_url}/api/carriers/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✓ Correctly requires authentication")
        else:
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test documents endpoint (should require auth)
    print("\n4. Documents Endpoint (without auth):")
    try:
        response = requests.get(f"{base_url}/api/documents/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✓ Correctly requires authentication")
        else:
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test policies endpoint (should require auth)
    print("\n5. Policies Endpoint (without auth):")
    try:
        response = requests.get(f"{base_url}/api/policies/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✓ Correctly requires authentication")
        else:
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    test_endpoints()
