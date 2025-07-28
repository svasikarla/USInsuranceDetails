#!/usr/bin/env python3
"""
Test script for AI analysis integration with pattern fallback
"""
import sys
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.document import PolicyDocument
from backend.app.models.policy import InsurancePolicy
from backend.app.models.red_flag import RedFlag
from backend.app.services.ai_analysis_service import ai_analysis_service
from backend.app.services.policy_service import analyze_policy_and_generate_benefits_flags

def test_ai_service_availability():
    """Test if AI service is available and configured"""
    print("🤖 Testing AI Service Availability")
    print("=" * 60)
    
    # Check if AI service is available
    is_available = ai_analysis_service.is_available()
    print(f"AI Service Available: {'✅ Yes' if is_available else '❌ No'}")
    
    if is_available:
        print("✅ Google Gemini API is configured and available")
    else:
        print("⚠️ Google Gemini API is not available - pattern fallback will be used")
    
    return is_available

def create_test_document():
    """Create a test document for AI analysis"""
    
    # Sample policy text with known red flags
    sample_text = """
    GoldCare Employee Health Plan
    
    COVERAGE LIMITATIONS:
    - Mental health services are limited to 10 visits per year
    - Maternity benefits have a 12-month waiting period
    - Out-of-network services require prior authorization
    - Cosmetic procedures are excluded from coverage
    - Experimental treatments are not covered
    
    COST SHARING:
    - Annual deductible: $8,500 (individual)
    - Coinsurance: 60% after deductible
    - Out-of-pocket maximum: $15,000
    
    NETWORK RESTRICTIONS:
    - Narrow network with limited providers
    - Referrals required for all specialist visits
    - Emergency services excluded (non-ACA compliant)
    
    This is a short-term medical plan that is not ACA-compliant.
    """
    
    # Create mock document object
    class MockDocument:
        def __init__(self):
            self.id = uuid.uuid4()
            self.extracted_text = sample_text
            self.filename = "test_policy.pdf"
            self.status = "completed"
    
    return MockDocument()

def test_ai_analysis():
    """Test AI analysis functionality"""
    print("\n🧠 Testing AI Analysis")
    print("=" * 60)
    
    # Create test document
    test_doc = create_test_document()
    
    try:
        # Test AI analysis
        print("Running AI analysis...")
        result = ai_analysis_service.analyze_policy_document(test_doc)
        
        if result:
            print("✅ AI Analysis successful!")
            print(f"Processing time: {result.processing_time:.2f}s")
            print(f"Red flags detected: {len(result.red_flags)}")
            print(f"Benefits detected: {len(result.benefits)}")
            
            # Show some detected red flags
            if result.red_flags:
                print("\nDetected Red Flags (AI):")
                for i, flag in enumerate(result.red_flags[:3]):  # Show first 3
                    print(f"  {i+1}. {flag.get('title', 'Unknown')} ({flag.get('severity', 'unknown')})")
            
            return True, result
        else:
            print("❌ AI Analysis failed or returned no results")
            return False, None
            
    except Exception as e:
        print(f"❌ AI Analysis error: {str(e)}")
        return False, None

def test_pattern_fallback():
    """Test pattern-based fallback detection using existing data"""
    print("\n🔍 Testing Pattern Fallback")
    print("=" * 60)

    db = SessionLocal()
    try:
        # Get existing policy and document from database
        existing_policy = db.query(InsurancePolicy).first()
        if not existing_policy:
            print("❌ No existing policies found in database")
            return False, 0

        existing_document = db.query(PolicyDocument).filter(
            PolicyDocument.id == existing_policy.document_id
        ).first()

        if not existing_document or not existing_document.extracted_text:
            print("❌ No valid document with extracted text found")
            return False, 0

        print(f"Using existing policy: {existing_policy.policy_name}")
        print(f"Using existing document: {existing_document.original_filename}")

        # Count red flags before pattern analysis
        initial_count = db.query(RedFlag).filter(RedFlag.policy_id == existing_policy.id).count()
        print(f"Initial red flags: {initial_count}")

        # Run pattern-based analysis
        print("Running pattern-based analysis...")
        analyze_policy_and_generate_benefits_flags(db, existing_policy, existing_document)

        # Count red flags after pattern analysis
        final_count = db.query(RedFlag).filter(RedFlag.policy_id == existing_policy.id).count()
        detected_count = final_count - initial_count

        print(f"✅ Pattern analysis completed!")
        print(f"Red flags detected: {detected_count}")

        # Show detected red flags
        if detected_count > 0:
            red_flags = db.query(RedFlag).filter(RedFlag.policy_id == existing_policy.id).all()
            print("\nDetected Red Flags (Pattern):")
            for i, flag in enumerate(red_flags[-detected_count:]):  # Show newly detected
                print(f"  {i+1}. {flag.title} ({flag.severity})")

        db.commit()
        return True, detected_count

    except Exception as e:
        print(f"❌ Pattern analysis error: {str(e)}")
        db.rollback()
        return False, 0
    finally:
        db.close()

def test_integration_workflow():
    """Test the complete integration workflow"""
    print("\n🔄 Testing Integration Workflow")
    print("=" * 60)
    
    # Test AI availability
    ai_available = test_ai_service_availability()
    
    # Test AI analysis if available
    ai_success = False
    ai_result = None
    if ai_available:
        ai_success, ai_result = test_ai_analysis()
    
    # Test pattern fallback
    pattern_success, pattern_count = test_pattern_fallback()
    
    # Summary
    print("\n📊 INTEGRATION TEST SUMMARY")
    print("=" * 60)
    print(f"AI Service Available: {'✅' if ai_available else '❌'}")
    print(f"AI Analysis Success: {'✅' if ai_success else '❌'}")
    print(f"Pattern Fallback Success: {'✅' if pattern_success else '❌'}")
    
    if ai_success and ai_result:
        print(f"AI Red Flags Detected: {len(ai_result.red_flags)}")
    
    if pattern_success:
        print(f"Pattern Red Flags Detected: {pattern_count}")
    
    # Determine overall status
    if ai_available and ai_success:
        print("🎉 EXCELLENT: AI analysis is working with pattern fallback available")
    elif pattern_success:
        print("✅ GOOD: Pattern fallback is working (AI not available)")
    else:
        print("❌ ISSUE: Both AI and pattern detection have problems")

def main():
    print("🔍 AI Analysis Integration Testing")
    print("=" * 80)
    
    test_integration_workflow()

if __name__ == "__main__":
    main()
