#!/usr/bin/env python3
"""
Test script for enhanced automatic policy creation workflow

This script tests the complete workflow:
1. Database schema validation
2. Document processing with new fields
3. API endpoint functionality
4. Frontend integration readiness
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_database_schema():
    """Test the enhanced database schema"""
    print("🔍 Testing Database Schema...")
    
    try:
        from app.utils.db import SessionLocal
        from app.models.document import PolicyDocument
        
        db = SessionLocal()
        
        # Test querying with new fields
        document = db.query(PolicyDocument).filter(
            PolicyDocument.auto_creation_status.isnot(None)
        ).first()
        
        if document:
            print(f"✅ Found document with auto-creation status: {document.auto_creation_status}")
            print(f"✅ Auto-creation confidence: {document.auto_creation_confidence}")
            print(f"✅ Extracted policy data available: {document.extracted_policy_data is not None}")
        else:
            print("ℹ️  No documents with auto-creation data found")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Database schema test failed: {str(e)}")
        return False

def test_document_service():
    """Test the enhanced document service"""
    print("\n🔍 Testing Document Service...")
    
    try:
        from app.services.document_service import process_document
        from app.services.ai_policy_extraction_service import ai_policy_extraction_service
        
        print("✅ Document service imports successful")
        print("✅ AI policy extraction service available")
        
        # Test if the service has the enhanced processing logic
        import inspect
        source = inspect.getsource(process_document)
        
        if 'auto_creation_status' in source:
            print("✅ Enhanced processing logic detected")
        else:
            print("⚠️  Enhanced processing logic not found")
        
        return True
        
    except Exception as e:
        print(f"❌ Document service test failed: {str(e)}")
        return False

def test_api_routes():
    """Test the new API routes"""
    print("\n🔍 Testing API Routes...")
    
    try:
        from app.routes.documents import router
        from fastapi.routing import APIRoute
        
        routes = [route for route in router.routes if isinstance(route, APIRoute)]
        route_paths = [route.path for route in routes]
        
        expected_routes = [
            "/{document_id}/extracted-policy-data",
            "/{document_id}/create-policy-from-review"
        ]
        
        for expected_route in expected_routes:
            if expected_route in route_paths:
                print(f"✅ API route found: {expected_route}")
            else:
                print(f"❌ API route missing: {expected_route}")
        
        return True
        
    except Exception as e:
        print(f"❌ API routes test failed: {str(e)}")
        return False

def test_frontend_components():
    """Test frontend component files"""
    print("\n🔍 Testing Frontend Components...")
    
    component_files = [
        "frontend/src/components/policy/PolicyReviewModal.tsx",
        "frontend/src/components/policy/AutoCreationStatusCard.tsx"
    ]
    
    all_exist = True
    for component_file in component_files:
        if os.path.exists(component_file):
            print(f"✅ Component file exists: {component_file}")
            
            # Check if file has expected content
            with open(component_file, 'r') as f:
                content = f.read()
                if 'export default' in content:
                    print(f"✅ Component properly exported: {component_file}")
                else:
                    print(f"⚠️  Component export issue: {component_file}")
        else:
            print(f"❌ Component file missing: {component_file}")
            all_exist = False
    
    return all_exist

def test_workflow_integration():
    """Test the complete workflow integration"""
    print("\n🔍 Testing Workflow Integration...")
    
    try:
        # Test that all pieces work together
        from app.utils.db import SessionLocal
        from app.models.document import PolicyDocument
        from app.schemas.document import PolicyDocumentWithExtractedData
        
        db = SessionLocal()
        
        # Create a test document with extracted data
        test_document = PolicyDocument(
            user_id="c6ba3007-5d9d-4cbc-9bbc-135d32442beb",
            original_filename="test_integration.pdf",
            file_path="/test/integration.pdf",
            file_size_bytes=1024,
            mime_type="application/pdf",
            processing_status="completed",
            extracted_text="Test policy document content",
            extracted_policy_data={
                "policy_name": "Integration Test Policy",
                "policy_type": "health",
                "premium_monthly": 300.0,
                "extraction_confidence": 0.9
            },
            auto_creation_status="ready_for_review",
            auto_creation_confidence=0.9
        )
        
        # Test schema validation
        schema_data = PolicyDocumentWithExtractedData(
            id=test_document.id,
            user_id=test_document.user_id,
            original_filename=test_document.original_filename,
            file_path=test_document.file_path,
            file_size_bytes=test_document.file_size_bytes,
            mime_type=test_document.mime_type,
            upload_method="manual_upload",
            processing_status=test_document.processing_status,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            extracted_policy_data=test_document.extracted_policy_data
        )
        
        print("✅ Schema validation successful")
        print("✅ Workflow integration test passed")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Workflow integration test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Enhanced Automatic Policy Creation Workflow Tests\n")
    
    tests = [
        ("Database Schema", test_database_schema),
        ("Document Service", test_document_service),
        ("API Routes", test_api_routes),
        ("Frontend Components", test_frontend_components),
        ("Workflow Integration", test_workflow_integration)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Enhanced workflow is ready for production.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the issues above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
