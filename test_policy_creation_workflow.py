#!/usr/bin/env python3
"""
Test script for complete policy creation workflow

This script tests the end-to-end policy creation process from
document review to policy creation.
"""

import sys
import os
from datetime import datetime
from uuid import UUID

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_policy_creation_service():
    """Test the policy creation service directly"""
    print("🔍 Testing Policy Creation Service...")
    
    try:
        from app.utils.db import SessionLocal
        from app.models.document import PolicyDocument
        from app.models.policy import InsurancePolicy
        from app.schemas.policy import InsurancePolicyCreate
        from app.services.policy_service import create_policy
        from app.models.user import User
        
        db = SessionLocal()
        
        # Get the test document
        document_id = "f4a3d948-3a93-42db-b593-ad91124004d1"
        document = db.query(PolicyDocument).filter(PolicyDocument.id == UUID(document_id)).first()
        
        if not document:
            print(f"❌ Test document {document_id} not found")
            return False
        
        print(f"✅ Found test document: {document.original_filename}")
        print(f"📊 Status: {document.auto_creation_status}")
        print(f"📊 Confidence: {document.auto_creation_confidence}")
        
        # Get a test user
        user = db.query(User).first()
        if not user:
            print("❌ No users found for testing")
            return False
        
        print(f"✅ Using test user: {user.email}")
        
        # Create policy data from extracted data
        extracted_data = document.extracted_policy_data
        if not extracted_data:
            print("❌ No extracted policy data found")
            return False
        
        print(f"✅ Extracted data available: {extracted_data.get('policy_name')}")
        
        # Create policy creation request
        policy_create_data = InsurancePolicyCreate(
            document_id=document.id,
            policy_name=extracted_data.get('policy_name'),
            policy_type=extracted_data.get('policy_type'),
            policy_number=extracted_data.get('policy_number'),
            plan_year=extracted_data.get('plan_year'),
            effective_date=extracted_data.get('effective_date'),
            expiration_date=extracted_data.get('expiration_date'),
            group_number=extracted_data.get('group_number'),
            network_type=extracted_data.get('network_type'),
            deductible_individual=extracted_data.get('deductible_individual'),
            deductible_family=extracted_data.get('deductible_family'),
            out_of_pocket_max_individual=extracted_data.get('out_of_pocket_max_individual'),
            out_of_pocket_max_family=extracted_data.get('out_of_pocket_max_family'),
            premium_monthly=extracted_data.get('premium_monthly'),
            premium_annual=extracted_data.get('premium_annual')
        )
        
        print("📋 Creating policy with extracted data...")
        
        # Create the policy
        policy = create_policy(db=db, obj_in=policy_create_data, user_id=user.id)
        
        if policy:
            print(f"✅ Policy created successfully!")
            print(f"📋 Policy ID: {policy.id}")
            print(f"📋 Policy Name: {policy.policy_name}")
            print(f"📋 Policy Type: {policy.policy_type}")
            print(f"📋 Premium: ${policy.premium_monthly}/month")
            
            # Update document status
            document.auto_creation_status = "completed"
            document.user_reviewed_at = datetime.utcnow()
            db.commit()
            
            print(f"✅ Document status updated to 'completed'")
            
            db.close()
            return True
        else:
            print("❌ Policy creation failed")
            db.close()
            return False
        
    except Exception as e:
        print(f"❌ Error during policy creation test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_api_workflow():
    """Test the API workflow for policy creation"""
    print("\n🔍 Testing API Workflow...")
    
    try:
        import requests
        import json
        
        # API Configuration
        API_BASE_URL = "http://localhost:8000"
        DOCUMENT_ID = "f4a3d948-3a93-42db-b593-ad91124004d1"
        
        # Test server connectivity
        try:
            response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
            if response.status_code != 200:
                print("❌ Backend server not accessible")
                return False
            print("✅ Backend server is running")
        except:
            print("❌ Cannot connect to backend server")
            return False
        
        # Test the extracted policy data endpoint (without auth for now)
        print("📡 Testing extracted policy data endpoint...")
        
        # For testing, let's check if the endpoint exists
        try:
            response = requests.get(f"{API_BASE_URL}/api/documents/{DOCUMENT_ID}/extracted-policy-data")
            print(f"📊 Endpoint response status: {response.status_code}")
            
            if response.status_code == 401:
                print("✅ Endpoint exists but requires authentication (expected)")
                return True
            elif response.status_code == 200:
                print("✅ Endpoint working and returned data")
                return True
            else:
                print(f"⚠️  Unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error testing API endpoint: {str(e)}")
            return False
        
    except ImportError:
        print("⚠️  Requests library not available, skipping API test")
        return True

def test_database_verification():
    """Verify the policy was created in the database"""
    print("\n🔍 Verifying Policy Creation in Database...")
    
    try:
        from app.utils.db import SessionLocal
        from app.models.policy import InsurancePolicy
        from app.models.document import PolicyDocument
        from uuid import UUID
        
        db = SessionLocal()
        
        # Check if policy was created
        document_id = "f4a3d948-3a93-42db-b593-ad91124004d1"
        policy = db.query(InsurancePolicy).filter(
            InsurancePolicy.document_id == UUID(document_id)
        ).first()
        
        if policy:
            print(f"✅ Policy found in database!")
            print(f"📋 Policy ID: {policy.id}")
            print(f"📋 Policy Name: {policy.policy_name}")
            print(f"📋 Created At: {policy.created_at}")
            
            # Check document status
            document = db.query(PolicyDocument).filter(
                PolicyDocument.id == UUID(document_id)
            ).first()
            
            if document:
                print(f"✅ Document status: {document.auto_creation_status}")
                print(f"✅ User reviewed at: {document.user_reviewed_at}")
            
            db.close()
            return True
        else:
            print("❌ No policy found for the test document")
            db.close()
            return False
        
    except Exception as e:
        print(f"❌ Error verifying database: {str(e)}")
        return False

def main():
    """Run all policy creation tests"""
    print("🚀 Starting Policy Creation Workflow Tests\n")
    
    tests = [
        ("Policy Creation Service", test_policy_creation_service),
        ("API Workflow", test_api_workflow),
        ("Database Verification", test_database_verification)
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
    print("📊 POLICY CREATION TEST RESULTS")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<30} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 Policy creation workflow is working correctly!")
        print("✅ Documents can be successfully converted to policies.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the issues above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
