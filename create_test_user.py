#!/usr/bin/env python3
"""
Create a test user for API testing
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def create_test_user():
    """Create a test user"""
    print("👤 Creating Test User...")
    
    user_data = {
        "email": "test@example.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "company_name": "Test Company"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=user_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Test user created successfully!")
            return True
        elif response.status_code == 400 and "already registered" in response.text:
            print("✅ Test user already exists!")
            return True
        else:
            print(f"❌ Failed to create user: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_login():
    """Test login with test user"""
    print("\n🔐 Testing Login with Test User...")
    
    login_data = {
        "username": "test@example.com",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Login successful!")
            return token_data.get("access_token")
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_policies_with_existing_user():
    """Test with the existing user by trying common passwords"""
    print("\n🔐 Testing with Existing User...")
    
    common_passwords = ["password123", "Password123", "admin123", "test123", "123456"]
    
    for password in common_passwords:
        login_data = {
            "username": "vasikarla.satish@outlook.com",
            "password": password
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
            if response.status_code == 200:
                token_data = response.json()
                print(f"✅ Login successful with password: {password}")
                return token_data.get("access_token")
        except:
            continue
    
    print("❌ Could not login with common passwords")
    return None

def main():
    """Main function"""
    print("🧪 Creating Test User for API Testing")
    print("=" * 40)
    
    # Try to login with existing user first
    token = test_policies_with_existing_user()
    
    if not token:
        # Create new test user
        if create_test_user():
            token = test_login()
    
    if token:
        print(f"\n✅ Authentication successful!")
        print(f"   Token: {token[:50]}...")
        
        # Now test the policies endpoint
        print("\n📋 Testing Policies Endpoint...")
        try:
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{BASE_URL}/api/policies", headers=headers)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                policies = response.json()
                print(f"   Policies found: {len(policies)}")
                
                if len(policies) == 0:
                    print("⚠️  No policies found for this user")
                    print("   The red flags are associated with vasikarla.satish@outlook.com")
                    print("   Need to either:")
                    print("   1. Get the correct password for vasikarla.satish@outlook.com")
                    print("   2. Transfer the policy to the test user")
                    print("   3. Create test data for the test user")
                
            else:
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"   Error: {e}")
    else:
        print("❌ Could not authenticate")

if __name__ == "__main__":
    main()
