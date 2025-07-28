#!/usr/bin/env python3
"""
Test script for AI policy extraction service

This script tests the AI extraction service directly to diagnose
why the automatic policy creation is failing.
"""

import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_ai_service_availability():
    """Test if the AI service is properly configured and available"""
    print("🔍 Testing AI Service Availability...")
    
    try:
        from app.core.config import settings
        from app.services.ai_policy_extraction_service import ai_policy_extraction_service
        
        print(f"✅ Google AI API Key configured: {'Yes' if settings.GOOGLE_AI_API_KEY else 'No'}")
        print(f"✅ AI Analysis Enabled: {settings.AI_ANALYSIS_ENABLED}")
        print(f"✅ AI Service Available: {ai_policy_extraction_service.is_available}")
        
        if not ai_policy_extraction_service.is_available:
            print("❌ AI service is not available - this explains the extraction failure")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing AI service: {str(e)}")
        return False

def test_ai_extraction_with_sample_text():
    """Test AI extraction with the actual document text"""
    print("\n🔍 Testing AI Extraction with Sample Document...")
    
    try:
        from app.services.ai_policy_extraction_service import ai_policy_extraction_service
        from app.models.document import PolicyDocument
        from uuid import uuid4
        
        # Create a mock document with the actual extracted text
        sample_text = """Sample Employer-Provided Health Insurance Policy
Provider: HealthSecure Inc.
Policy Name: GoldCare Employee Plan
Policy Type: Employer-Provided Group Health Insurance
Coverage Start Date: 01-Jan-2025
Coverage End Date: 31-Dec-2025
-------------------------------------------
Coverage Summary:
- Annual Premium: $5,000 per employee
- Annual Deductible: $1,500
- Out-of-Pocket Maximum: $7,000
- Coinsurance: 20% after deductible
-------------------------------------------
Key Benefits:
- Inpatient Hospitalization: Covered at 80%
- Outpatient Services: Covered at 80%
- Emergency Room: $250 copay per visit
- Prescription Drugs: Tiered copays ($10/$30/$50)
- Maternity Care: Covered after 12-month waiting period
- Mental Health Services: Limited to 10 visits per year
-------------------------------------------
Exclusions & Limitations:
- Cosmetic procedures
- Infertility treatment
- Experimental treatments
- Out-of-network services may be denied or subject to higher cost-sharing
-------------------------------------------
Important Notes (Fine Print):
- 12-month waiting period applies for maternity care.
- Out-of-network services require prior authorization.
- Mental health coverage is limited to 10 visits per year.
- Coverage subject to change based on employer contract renewal.
For full policy details, please refer to the official plan document."""

        mock_document = PolicyDocument(
            id=uuid4(),
            user_id=uuid4(),
            original_filename="test_document.pdf",
            file_path="/test/path.pdf",
            file_size_bytes=1024,
            mime_type="application/pdf",
            upload_method="manual_upload",
            extracted_text=sample_text
        )
        
        print("📄 Testing with sample document text...")
        print(f"📊 Text length: {len(sample_text)} characters")
        
        # Test the extraction
        result = ai_policy_extraction_service.extract_policy_data(mock_document)
        
        print(f"\n📊 Extraction Results:")
        print(f"✅ Policy Name: {result.policy_name}")
        print(f"✅ Policy Type: {result.policy_type}")
        print(f"✅ Premium Monthly: ${result.premium_monthly}")
        print(f"✅ Deductible Individual: ${result.deductible_individual}")
        print(f"✅ Out-of-Pocket Max: ${result.out_of_pocket_max_individual}")
        print(f"✅ Extraction Confidence: {result.extraction_confidence:.2f}")
        print(f"✅ Extraction Method: {result.extraction_method}")
        
        if result.extraction_errors:
            print(f"⚠️  Extraction Errors: {result.extraction_errors}")
        
        if result.extraction_confidence > 0.3:
            print(f"✅ Extraction successful with confidence {result.extraction_confidence:.2f}")
            return True
        else:
            print(f"❌ Extraction failed with low confidence {result.extraction_confidence:.2f}")
            return False
        
    except Exception as e:
        print(f"❌ Error during AI extraction test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_database_update():
    """Test updating the stuck document with proper extraction data"""
    print("\n🔍 Testing Database Update for Stuck Document...")
    
    try:
        from app.utils.db import SessionLocal
        from app.models.document import PolicyDocument
        from uuid import UUID
        
        db = SessionLocal()
        
        # Find the stuck document
        document_id = "cfd3e7fe-9e68-42b1-b8bd-a7f61896d1d4"
        document = db.query(PolicyDocument).filter(PolicyDocument.id == UUID(document_id)).first()
        
        if not document:
            print(f"❌ Document {document_id} not found")
            return False
        
        print(f"📄 Found document: {document.original_filename}")
        print(f"📊 Current status: {document.auto_creation_status}")
        print(f"📊 Current confidence: {document.auto_creation_confidence}")
        
        # Test the AI extraction on this document
        from app.services.ai_policy_extraction_service import ai_policy_extraction_service
        
        if ai_policy_extraction_service.is_available:
            print("🤖 Testing AI extraction on actual document...")
            result = ai_policy_extraction_service.extract_policy_data(document)
            
            if result.extraction_confidence > 0.3:
                # Update the document with the extraction results
                document.extracted_policy_data = result.__dict__
                document.auto_creation_status = "ready_for_review" if result.extraction_confidence < 0.8 else "completed"
                document.auto_creation_confidence = result.extraction_confidence
                document.updated_at = datetime.utcnow()
                
                db.commit()
                
                print(f"✅ Document updated successfully!")
                print(f"✅ New status: {document.auto_creation_status}")
                print(f"✅ New confidence: {document.auto_creation_confidence}")
                
                return True
            else:
                print(f"❌ AI extraction failed with confidence {result.extraction_confidence:.2f}")
        else:
            print("❌ AI service not available")
        
        db.close()
        return False
        
    except Exception as e:
        print(f"❌ Error during database update test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all diagnostic tests"""
    print("🚀 Starting AI Policy Extraction Diagnostic Tests\n")
    
    tests = [
        ("AI Service Availability", test_ai_service_availability),
        ("AI Extraction with Sample Text", test_ai_extraction_with_sample_text),
        ("Database Update Test", test_database_update)
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
        print("\n🎉 All tests passed! AI extraction should now work correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. The issue has been identified and should be resolved.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
