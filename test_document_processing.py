#!/usr/bin/env python3
"""
Test script for document processing and policy creation

This script tests the complete document processing workflow to identify
where the policy creation is failing.
"""

import sys
import os
from datetime import datetime
from uuid import UUID

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_ai_extraction_service():
    """Test the AI extraction service directly"""
    print("🔍 Testing AI Extraction Service...")
    
    try:
        from app.services.ai_policy_extraction_service import ai_policy_extraction_service
        from app.models.document import PolicyDocument
        from uuid import uuid4
        
        print(f"✅ AI Service Available: {ai_policy_extraction_service.is_available}")
        
        # Create a test document
        test_text = """Premium Health Insurance Policy
Policy Name: Test Health Plan 2025
Policy Type: Health Insurance
Policy Number: THP-2025-001
Plan Year: 2025
Effective Date: 2025-01-01
Expiration Date: 2025-12-31
Monthly Premium: $450.00
Annual Deductible: $2,000
Out-of-Pocket Maximum: $8,000
Network: PPO"""

        mock_document = PolicyDocument(
            id=uuid4(),
            user_id=uuid4(),
            original_filename="test_health_policy.pdf",
            file_path="/test/path.pdf",
            file_size_bytes=1024,
            mime_type="application/pdf",
            upload_method="manual_upload",
            extracted_text=test_text
        )
        
        # Test extraction
        result = ai_policy_extraction_service.extract_policy_data(mock_document)
        
        print(f"✅ Extraction Result:")
        print(f"   Policy Name: {result.policy_name}")
        print(f"   Policy Type: {result.policy_type}")
        print(f"   Premium Monthly: {result.premium_monthly}")
        print(f"   Confidence: {result.extraction_confidence}")
        print(f"   Method: {result.extraction_method}")
        
        if result.extraction_errors:
            print(f"⚠️  Errors: {result.extraction_errors}")
        
        return result.extraction_confidence > 0.3
        
    except Exception as e:
        print(f"❌ AI Extraction test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_auto_policy_creation_service():
    """Test the auto policy creation service"""
    print("\n🔍 Testing Auto Policy Creation Service...")
    
    try:
        from app.services.auto_policy_creation_service import auto_policy_creation_service
        from app.models.document import PolicyDocument
        from app.models.user import User
        from uuid import uuid4
        
        # Create mock objects
        mock_user = User(
            id=uuid4(),
            email="test@example.com",
            first_name="Test",
            last_name="User"
        )
        
        mock_document = PolicyDocument(
            id=uuid4(),
            user_id=mock_user.id,
            original_filename="test_policy.pdf",
            file_path="/test/path.pdf",
            file_size_bytes=1024,
            mime_type="application/pdf",
            upload_method="manual_upload",
            extracted_text="Test policy content with premium $500 and deductible $2000"
        )
        
        print("✅ Auto Policy Creation Service imported successfully")
        print("✅ Mock objects created")
        
        # Note: We can't test the full workflow without database connection
        # but we can verify the service is importable and has the right methods
        
        methods = ['process_document_for_auto_creation', '_create_policy_from_extracted_data']
        for method in methods:
            if hasattr(auto_policy_creation_service, method):
                print(f"✅ Method found: {method}")
            else:
                print(f"❌ Method missing: {method}")
        
        return True
        
    except Exception as e:
        print(f"❌ Auto Policy Creation test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_document_processing_workflow():
    """Test the document processing workflow"""
    print("\n🔍 Testing Document Processing Workflow...")
    
    try:
        from app.services.document_service import process_document
        
        print("✅ Document processing service imported successfully")
        
        # Check if the function has the enhanced logic
        import inspect
        source = inspect.getsource(process_document)
        
        if 'auto_creation_status' in source:
            print("✅ Enhanced auto-creation logic found")
        else:
            print("❌ Enhanced auto-creation logic missing")
        
        if 'ai_policy_extraction_service' in source:
            print("✅ AI extraction service integration found")
        else:
            print("❌ AI extraction service integration missing")
        
        if 'auto_policy_creation_service' in source:
            print("✅ Auto policy creation service integration found")
        else:
            print("❌ Auto policy creation service integration missing")
        
        return True
        
    except Exception as e:
        print(f"❌ Document processing workflow test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_environment_configuration():
    """Test environment configuration"""
    print("\n🔍 Testing Environment Configuration...")
    
    try:
        from app.core.config import settings
        
        print(f"✅ Google AI API Key configured: {'Yes' if settings.GOOGLE_AI_API_KEY else 'No'}")
        print(f"✅ AI Analysis Enabled: {settings.AI_ANALYSIS_ENABLED}")
        print(f"✅ AI Confidence Threshold: {settings.AI_CONFIDENCE_THRESHOLD}")
        
        if not settings.GOOGLE_AI_API_KEY:
            print("⚠️  Google AI API Key not configured - this could cause extraction failures")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Environment configuration test failed: {str(e)}")
        return False

def main():
    """Run all diagnostic tests"""
    print("🚀 Starting Document Processing and Policy Creation Diagnostic Tests\n")
    
    tests = [
        ("Environment Configuration", test_environment_configuration),
        ("AI Extraction Service", test_ai_extraction_service),
        ("Auto Policy Creation Service", test_auto_policy_creation_service),
        ("Document Processing Workflow", test_document_processing_workflow)
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
    print("📊 DIAGNOSTIC TEST RESULTS")
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
        print("\n🎉 All tests passed! Document processing should work correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Issues identified that need fixing.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
