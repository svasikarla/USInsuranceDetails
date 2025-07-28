#!/usr/bin/env python3
"""
Test script to verify the authentication flow between frontend and backend
"""
import requests
import json

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Test credentials (from database initialization)
TEST_EMAIL = "admin@example.com"
TEST_PASSWORD = "adminpassword"

def test_backend_endpoints():
    """Test backend API endpoints"""
    print("🔍 Testing Backend API Endpoints...")
    
    # Test 1: Check if backend is running
    try:
        response = requests.get(f"{BACKEND_URL}/docs")
        print(f"✅ Backend is running (status: {response.status_code})")
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running or not accessible")
        return False
    
    # Test 2: Test /api/users/me without authentication (should return 401)
    try:
        response = requests.get(f"{BACKEND_URL}/api/users/me")
        if response.status_code == 401:
            print("✅ /api/users/me correctly returns 401 without authentication")
        else:
            print(f"⚠️  /api/users/me returned unexpected status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing /api/users/me: {e}")
    
    # Test 3: Test login endpoint
    try:
        login_data = {
            "username": TEST_EMAIL,  # OAuth2PasswordRequestForm uses 'username' field
            "password": TEST_PASSWORD
        }
        response = requests.post(
            f"{BACKEND_URL}/api/auth/login",
            data=login_data,  # Use form data, not JSON
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            print("✅ Login successful")
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            if access_token:
                print(f"✅ Received access token: {access_token[:20]}...")
                
                # Test 4: Test /api/users/me with authentication
                headers = {"Authorization": f"Bearer {access_token}"}
                me_response = requests.get(f"{BACKEND_URL}/api/users/me", headers=headers)
                
                if me_response.status_code == 200:
                    user_data = me_response.json()
                    print(f"✅ /api/users/me successful: {user_data.get('email')}")
                    return True
                else:
                    print(f"❌ /api/users/me failed with token: {me_response.status_code}")
                    print(f"Response: {me_response.text}")
            else:
                print("❌ No access token in login response")
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing login: {e}")
    
    return False

def test_frontend_backend_communication():
    """Test if frontend can communicate with backend"""
    print("\n🌐 Testing Frontend-Backend Communication...")
    
    # Test CORS by making a request from frontend origin
    try:
        headers = {
            "Origin": FRONTEND_URL,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type"
        }
        
        # Test preflight request
        response = requests.options(f"{BACKEND_URL}/api/users/me", headers=headers)
        print(f"✅ CORS preflight request status: {response.status_code}")
        
        # Check CORS headers
        cors_origin = response.headers.get("Access-Control-Allow-Origin")
        if cors_origin:
            print(f"✅ CORS Allow-Origin: {cors_origin}")
        else:
            print("⚠️  No CORS Allow-Origin header found")
            
    except Exception as e:
        print(f"❌ Error testing CORS: {e}")

def main():
    """Main test function"""
    print("🚀 Starting Authentication Flow Test\n")
    
    # Test backend endpoints
    backend_working = test_backend_endpoints()
    
    # Test frontend-backend communication
    test_frontend_backend_communication()
    
    print(f"\n📊 Test Summary:")
    print(f"Backend Authentication: {'✅ Working' if backend_working else '❌ Failed'}")
    
    if backend_working:
        print("\n🎉 Authentication flow is working correctly!")
        print("The frontend should now be able to:")
        print("1. Login with admin@example.com / adminpassword")
        print("2. Get current user info from /api/users/me")
        print("3. Access protected endpoints")
    else:
        print("\n⚠️  Authentication flow needs debugging")

if __name__ == "__main__":
    main()
