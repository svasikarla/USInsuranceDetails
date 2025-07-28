#!/usr/bin/env python3
"""
Test backend API endpoints for dashboard red flags
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint"""
    print("🏥 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"   Error: {e}")
        return False

def test_login():
    """Test login endpoint"""
    print("\n🔐 Testing Login...")
    try:
        login_data = {
            "username": "vasikarla.satish@outlook.com",
            "password": "password123"  # You may need to adjust this
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            print(f"   Login successful!")
            return token_data.get("access_token")
        else:
            print(f"   Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"   Error: {e}")
        return None

def test_policies_endpoint(token):
    """Test policies endpoint"""
    print("\n📋 Testing Policies Endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/policies", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            policies = response.json()
            print(f"   Policies found: {len(policies)}")
            for policy in policies:
                print(f"     - {policy.get('policy_name', 'Unknown')} (ID: {policy.get('id', 'Unknown')})")
            return policies
        else:
            print(f"   Error: {response.text}")
            return []
            
    except Exception as e:
        print(f"   Error: {e}")
        return []

def test_red_flags_endpoint(token, policy_id):
    """Test red flags endpoint for a specific policy"""
    print(f"\n🚩 Testing Red Flags Endpoint for Policy {policy_id}...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/policies/{policy_id}/red-flags", headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            red_flags = response.json()
            print(f"   Red flags found: {len(red_flags)}")
            
            # Group by severity
            severity_count = {}
            for flag in red_flags:
                severity = flag.get('severity', 'unknown')
                severity_count[severity] = severity_count.get(severity, 0) + 1
                
            print(f"   Severity breakdown:")
            for severity, count in severity_count.items():
                print(f"     - {severity}: {count}")
                
            return red_flags
        else:
            print(f"   Error: {response.text}")
            return []
            
    except Exception as e:
        print(f"   Error: {e}")
        return []

def main():
    """Main test function"""
    print("🧪 Backend API Test for Dashboard Red Flags")
    print("=" * 50)
    print(f"⏰ Test started at: {datetime.now()}")
    
    # Test health
    health_ok = test_health()
    if not health_ok:
        print("❌ Backend not running!")
        return
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Login failed!")
        print("\n💡 Possible solutions:")
        print("   1. Check if user exists in database")
        print("   2. Verify password is correct")
        print("   3. Check authentication configuration")
        return
    
    # Test policies
    policies = test_policies_endpoint(token)
    if not policies:
        print("❌ No policies found!")
        return
    
    # Test red flags for each policy
    total_red_flags = 0
    for policy in policies:
        policy_id = policy.get('id')
        if policy_id:
            red_flags = test_red_flags_endpoint(token, policy_id)
            total_red_flags += len(red_flags)
    
    print(f"\n📊 Summary:")
    print(f"   Total Policies: {len(policies)}")
    print(f"   Total Red Flags: {total_red_flags}")
    
    if total_red_flags > 0:
        print("✅ Backend API is working correctly!")
        print("\n🔍 Next: Check frontend API integration")
    else:
        print("❌ No red flags returned by API!")
        print("\n🔍 Check:")
        print("   1. Database has red flags")
        print("   2. Red flags are associated with correct policy")
        print("   3. User has access to the policy")
    
    print(f"\n⏰ Test completed at: {datetime.now()}")

if __name__ == "__main__":
    main()
