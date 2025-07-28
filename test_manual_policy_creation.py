#!/usr/bin/env python3
"""
Test script for manual policy creation endpoint

This script tests the manual policy creation endpoint to verify
our automatic policy creation logic works correctly.
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
DOCUMENT_ID = "e177f655-02d3-484c-9f3c-cd9898c6b977"

# Test credentials (you may need to update these)
TEST_EMAIL = "vasikarla.satish@outlook.com"
TEST_PASSWORD = "password123"  # Update with actual password


def get_auth_token():
    """Get authentication token"""
    print("🔐 Getting authentication token...")
    
    login_data = {
        "username": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print(f"✅ Authentication successful")
            return access_token
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return None


def test_document_status(token):
    """Test document status endpoint"""
    print(f"\n📄 Testing document status for ID: {DOCUMENT_ID}")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/documents/{DOCUMENT_ID}/policy-status",
            headers=headers
        )
        
        if response.status_code == 200:
            status_data = response.json()
            print(f"✅ Document status retrieved successfully")
            print(f"   Processing Status: {status_data.get('processing_status')}")
            print(f"   Has Auto-Created Policy: {status_data.get('has_auto_created_policy')}")
            print(f"   Policies: {status_data.get('policies', [])}")
            print(f"   Extraction Confidence: {status_data.get('extraction_confidence')}")
            return status_data
        else:
            print(f"❌ Document status failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Document status error: {str(e)}")
        return None


def test_manual_policy_creation(token, force_creation=False):
    """Test manual policy creation endpoint"""
    print(f"\n🏗️  Testing manual policy creation (force={force_creation})...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/documents/{DOCUMENT_ID}/create-policy",
            headers=headers,
            params={"force_creation": force_creation}
        )
        
        if response.status_code == 200:
            creation_data = response.json()
            print(f"✅ Policy creation request successful")
            print(f"   Success: {creation_data.get('success')}")
            print(f"   Policy ID: {creation_data.get('policy_id')}")
            print(f"   Confidence Score: {creation_data.get('confidence_score'):.2f}")
            print(f"   Requires Review: {creation_data.get('requires_review')}")
            
            # Show extracted data
            extracted = creation_data.get('extracted_data', {})
            print(f"\n📋 Extracted Policy Data:")
            print(f"   Policy Name: {extracted.get('policy_name')}")
            print(f"   Policy Type: {extracted.get('policy_type')}")
            print(f"   Deductible (Individual): ${extracted.get('deductible_individual')}")
            print(f"   Premium (Monthly): ${extracted.get('premium_monthly')}")
            print(f"   Premium (Annual): ${extracted.get('premium_annual')}")
            print(f"   Extraction Method: {extracted.get('extraction_method')}")
            print(f"   Extraction Confidence: {extracted.get('extraction_confidence'):.2f}")
            
            # Show validation errors/warnings
            if creation_data.get('validation_errors'):
                print(f"\n❌ Validation Errors:")
                for error in creation_data.get('validation_errors', []):
                    print(f"   - {error}")
            
            if creation_data.get('warnings'):
                print(f"\n⚠️  Warnings:")
                for warning in creation_data.get('warnings', []):
                    print(f"   - {warning}")
            
            return creation_data
        else:
            print(f"❌ Policy creation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Policy creation error: {str(e)}")
        return None


def test_backend_connectivity():
    """Test if backend is running"""
    print("🔗 Testing backend connectivity...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
            return True
        else:
            print(f"⚠️  Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running or not accessible")
        print("   Please start the backend server with: python backend/run.py")
        return False
    except Exception as e:
        print(f"❌ Backend connectivity error: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("🧪 Testing Manual Policy Creation Endpoint")
    print("=" * 60)
    
    # Test backend connectivity
    if not test_backend_connectivity():
        print("\n❌ Cannot proceed without backend connectivity")
        return False
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return False
    
    # Test document status
    status_data = test_document_status(token)
    if not status_data:
        print("\n❌ Cannot proceed without document status")
        return False
    
    # Test manual policy creation (normal threshold)
    creation_result = test_manual_policy_creation(token, force_creation=False)
    
    # If normal creation failed, try with force creation
    if not creation_result or not creation_result.get('success'):
        print("\n🔄 Trying with force creation...")
        creation_result = test_manual_policy_creation(token, force_creation=True)
    
    # Summary
    print(f"\n{'=' * 60}")
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    if creation_result and creation_result.get('success'):
        print("✅ Manual policy creation endpoint is working!")
        print(f"   Policy ID: {creation_result.get('policy_id')}")
        print(f"   Confidence: {creation_result.get('confidence_score'):.2f}")
        
        # Next steps
        print(f"\n📋 Next Steps:")
        print("1. ✅ Verify policy was created in database")
        print("2. ✅ Check if red flags were detected")
        print("3. ✅ Test automatic pipeline with new document upload")
        
        return True
    else:
        print("❌ Manual policy creation endpoint failed")
        print("   Check the error messages above for details")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
