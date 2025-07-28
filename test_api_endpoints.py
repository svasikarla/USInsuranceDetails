#!/usr/bin/env python3
"""
Test script for the new API endpoints

This script tests the enhanced automatic policy creation API endpoints
to ensure they work correctly with the updated document.
"""

import requests
import json
import sys

# API Configuration
API_BASE_URL = "http://localhost:8000"
DOCUMENT_ID = "cfd3e7fe-9e68-42b1-b8bd-a7f61896d1d4"

# Test user credentials (you may need to adjust these)
TEST_EMAIL = "john.doe@example.com"
TEST_PASSWORD = "password123"

def get_auth_token():
    """Get authentication token for API requests"""
    try:
        login_data = {
            "username": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during login: {str(e)}")
        return None

def test_get_extracted_policy_data(token):
    """Test the GET /api/documents/{id}/extracted-policy-data endpoint"""
    print("🔍 Testing GET extracted policy data endpoint...")
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{API_BASE_URL}/api/documents/{DOCUMENT_ID}/extracted-policy-data",
            headers=headers
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Endpoint working correctly!")
            print(f"📄 Document ID: {data.get('document_id')}")
            print(f"📊 Auto Creation Status: {data.get('auto_creation_status')}")
            print(f"📊 Confidence: {data.get('auto_creation_confidence')}")
            print(f"📋 Has Extracted Data: {'Yes' if data.get('extracted_policy_data') else 'No'}")
            
            if data.get('extracted_policy_data'):
                policy_data = data['extracted_policy_data']
                print(f"📋 Policy Name: {policy_data.get('policy_name')}")
                print(f"📋 Policy Type: {policy_data.get('policy_type')}")
                print(f"📋 Premium Monthly: ${policy_data.get('premium_monthly')}")
            
            return True
        else:
            print(f"❌ Endpoint failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing endpoint: {str(e)}")
        return False

def test_create_policy_from_review(token):
    """Test the POST /api/documents/{id}/create-policy-from-review endpoint"""
    print("\n🔍 Testing POST create policy from review endpoint...")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Sample policy data for creation
        policy_data = {
            "policy_name": "GoldCare Employee Plan",
            "policy_type": "health",
            "plan_year": "2025",
            "effective_date": "2025-01-01",
            "expiration_date": "2025-12-31",
            "deductible_individual": 1500.00,
            "out_of_pocket_max_individual": 7000.00,
            "premium_monthly": 416.67,
            "premium_annual": 5000.00
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/documents/{DOCUMENT_ID}/create-policy-from-review",
            headers=headers,
            json=policy_data
        )
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Policy creation endpoint working correctly!")
            print(f"📄 Success: {data.get('success')}")
            print(f"📋 Policy ID: {data.get('policy_id')}")
            print(f"📋 Message: {data.get('message')}")
            return True
        else:
            print(f"❌ Policy creation failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing policy creation: {str(e)}")
        return False

def test_server_health():
    """Test if the server is running and accessible"""
    print("🔍 Testing server health...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running and accessible")
            return True
        else:
            print(f"⚠️  Server responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server - is it running?")
        return False
    except Exception as e:
        print(f"❌ Error checking server health: {str(e)}")
        return False

def main():
    """Run all API endpoint tests"""
    print("🚀 Starting API Endpoint Tests\n")
    
    # Test server health first
    if not test_server_health():
        print("❌ Server is not accessible. Please start the backend server.")
        return False
    
    # Get authentication token
    print("\n🔐 Getting authentication token...")
    token = get_auth_token()
    
    if not token:
        print("❌ Could not get authentication token. Using test without auth...")
        # For testing purposes, we'll try without auth (if endpoints allow it)
        token = None
    else:
        print("✅ Authentication successful")
    
    # Run endpoint tests
    tests = [
        ("Get Extracted Policy Data", lambda: test_get_extracted_policy_data(token)),
        ("Create Policy from Review", lambda: test_create_policy_from_review(token))
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("📊 API ENDPOINT TEST RESULTS")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<35} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All API endpoints are working correctly!")
        print("✅ Enhanced automatic policy creation workflow is functional.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the issues above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
