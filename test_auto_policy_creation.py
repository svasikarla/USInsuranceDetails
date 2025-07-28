#!/usr/bin/env python3
"""
Test script for automatic policy creation functionality

This script tests the complete automatic policy creation pipeline:
1. AI policy data extraction
2. Data validation
3. Automatic policy creation
4. Red flag detection
"""

import sys
import os
import uuid
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.utils.db import SessionLocal
from app.models import PolicyDocument, User
from app.services.ai_policy_extraction_service import ai_policy_extraction_service
from app.services.auto_policy_creation_service import auto_policy_creation_service
from app.schemas.policy_extraction import PolicyCreationWorkflow


def test_ai_policy_extraction():
    """Test AI policy data extraction"""
    print("🔍 Testing AI Policy Data Extraction...")
    
    db = SessionLocal()
    try:
        # Get the test document
        document = db.query(PolicyDocument).filter(
            PolicyDocument.id == uuid.UUID("21822ff5-1937-4574-aeb4-7e91fa99602a")
        ).first()
        
        if not document:
            print("❌ Test document not found")
            return False
        
        print(f"📄 Found document: {document.original_filename}")
        print(f"📊 Text length: {len(document.extracted_text) if document.extracted_text else 0} characters")
        
        # Test AI extraction
        extracted_data = ai_policy_extraction_service.extract_policy_data(document)
        
        print(f"\n📋 Extraction Results:")
        print(f"   Method: {extracted_data.extraction_method}")
        print(f"   Confidence: {extracted_data.extraction_confidence:.2f}")
        print(f"   Policy Name: {extracted_data.policy_name}")
        print(f"   Policy Type: {extracted_data.policy_type}")
        print(f"   Deductible (Individual): ${extracted_data.deductible_individual}")
        print(f"   Premium (Monthly): ${extracted_data.premium_monthly}")
        print(f"   Premium (Annual): ${extracted_data.premium_annual}")
        print(f"   Effective Date: {extracted_data.effective_date}")
        print(f"   Expiration Date: {extracted_data.expiration_date}")
        
        if extracted_data.extraction_errors:
            print(f"   ⚠️  Errors: {extracted_data.extraction_errors}")
        
        return extracted_data.extraction_confidence > 0.0
        
    except Exception as e:
        print(f"❌ AI extraction test failed: {str(e)}")
        return False
    finally:
        db.close()


def test_automatic_policy_creation():
    """Test automatic policy creation"""
    print("\n🏗️  Testing Automatic Policy Creation...")
    
    db = SessionLocal()
    try:
        # Get the test document and user
        document = db.query(PolicyDocument).filter(
            PolicyDocument.id == uuid.UUID("21822ff5-1937-4574-aeb4-7e91fa99602a")
        ).first()
        
        user = db.query(User).filter(User.id == document.user_id).first()
        
        if not document or not user:
            print("❌ Test document or user not found")
            return False
        
        print(f"👤 User: {user.email}")
        print(f"📄 Document: {document.original_filename}")
        
        # Check if policy already exists
        from app.services.policy_service import get_policies_by_document
        existing_policies = get_policies_by_document(db=db, document_id=document.id)
        
        if existing_policies:
            print(f"ℹ️  Found {len(existing_policies)} existing policies for this document")
            for policy in existing_policies:
                print(f"   - {policy.policy_name} (ID: {policy.id})")
        
        # Test automatic policy creation with lower threshold for testing
        workflow = PolicyCreationWorkflow()
        workflow.auto_create_threshold = 0.3  # Lower threshold for testing
        workflow.review_required_threshold = 0.2
        
        result = auto_policy_creation_service.process_document_for_auto_creation(
            db=db, document=document, user=user, workflow=workflow
        )
        
        print(f"\n📊 Auto-Creation Results:")
        print(f"   Success: {result.success}")
        print(f"   Policy ID: {result.policy_id}")
        print(f"   Confidence Score: {result.confidence_score:.2f}")
        print(f"   Requires Review: {result.requires_review}")
        
        if result.validation_errors:
            print(f"   ❌ Validation Errors:")
            for error in result.validation_errors:
                print(f"      - {error}")
        
        if result.warnings:
            print(f"   ⚠️  Warnings:")
            for warning in result.warnings:
                print(f"      - {warning}")
        
        # Show extracted data details
        extracted = result.extracted_data
        print(f"\n📋 Extracted Policy Data:")
        print(f"   Name: {extracted.policy_name}")
        print(f"   Type: {extracted.policy_type}")
        print(f"   Number: {extracted.policy_number}")
        print(f"   Deductible: ${extracted.deductible_individual}")
        print(f"   Premium (Monthly): ${extracted.premium_monthly}")
        print(f"   Premium (Annual): ${extracted.premium_annual}")
        print(f"   Network Type: {extracted.network_type}")
        
        return result.success or result.confidence_score > 0.5
        
    except Exception as e:
        print(f"❌ Auto-creation test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_red_flag_detection():
    """Test red flag detection for the created policy"""
    print("\n🚩 Testing Red Flag Detection...")
    
    db = SessionLocal()
    try:
        # Get policies for the test document
        from app.services.policy_service import get_policies_by_document
        from app.models import RedFlag
        
        document_id = uuid.UUID("21822ff5-1937-4574-aeb4-7e91fa99602a")
        policies = get_policies_by_document(db=db, document_id=document_id)
        
        if not policies:
            print("❌ No policies found for red flag testing")
            return False
        
        total_red_flags = 0
        for policy in policies:
            red_flags = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).all()
            
            print(f"\n📋 Policy: {policy.policy_name}")
            print(f"   🚩 Red Flags Found: {len(red_flags)}")
            
            for flag in red_flags:
                print(f"      - {flag.severity.upper()}: {flag.title}")
                print(f"        {flag.description}")
                if flag.recommendation:
                    print(f"        💡 Recommendation: {flag.recommendation}")
                print(f"        🎯 Confidence: {flag.confidence_score:.2f}")
                print()
            
            total_red_flags += len(red_flags)
        
        print(f"📊 Total Red Flags Detected: {total_red_flags}")
        
        # Expected red flags based on the policy content
        expected_red_flags = [
            "mental health",  # Limited to 10 visits
            "maternity",      # 12-month waiting period
            "out-of-network", # Authorization required
        ]
        
        print(f"🎯 Expected Red Flags: {len(expected_red_flags)}")
        for expected in expected_red_flags:
            print(f"   - {expected}")
        
        return total_red_flags > 0
        
    except Exception as e:
        print(f"❌ Red flag detection test failed: {str(e)}")
        return False
    finally:
        db.close()


def main():
    """Run all tests"""
    print("🧪 Starting Automatic Policy Creation Tests")
    print("=" * 60)
    
    tests = [
        ("AI Policy Extraction", test_ai_policy_extraction),
        ("Automatic Policy Creation", test_automatic_policy_creation),
        ("Red Flag Detection", test_red_flag_detection),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'=' * 60}")
        try:
            result = test_func()
            results.append((test_name, result))
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"\n{status}: {test_name}")
        except Exception as e:
            results.append((test_name, False))
            print(f"\n❌ FAILED: {test_name} - {str(e)}")
    
    # Summary
    print(f"\n{'=' * 60}")
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Automatic policy creation is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
