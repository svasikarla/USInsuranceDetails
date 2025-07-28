#!/usr/bin/env python3
"""
Test script to manually trigger red flag detection on existing documents
"""
import sys
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.document import PolicyDocument
from backend.app.models.policy import InsurancePolicy
from backend.app.models.red_flag import RedFlag
from backend.app.services.ai_analysis_service import ai_analysis_service
from backend.app.services.policy_service import create_red_flag

def test_text_with_exclusions():
    """Test red flag detection with sample text containing exclusions"""
    
    sample_text = """
    HEALTH INSURANCE POLICY DOCUMENT
    
    Coverage Details:
    - Medical expenses up to $50,000 annually
    - Prescription drugs covered at 80%
    - Emergency room visits: $500 deductible
    
    Exclusions & Limitations:
    - Cosmetic procedures
    - Infertility treatment  
    - Experimental treatments
    - Out-of-network services may be denied or subject to higher cost-sharing
    
    Pre-authorization Requirements:
    - All specialist visits require pre-authorization
    - MRI and CT scans must be pre-approved
    - Surgery requires 48-hour advance notice
    
    Network Limitations:
    - Must use in-network providers for full coverage
    - Out-of-network providers covered at 60%
    - Emergency services covered regardless of network
    """
    
    print("🔍 Testing Red Flag Detection with Sample Text")
    print("=" * 60)
    print(f"Sample text length: {len(sample_text)} characters")
    print("\nText contains these potential red flags:")
    print("- Cosmetic procedures exclusion")
    print("- Infertility treatment exclusion") 
    print("- Experimental treatments exclusion")
    print("- Out-of-network limitations")
    print("- Pre-authorization requirements")
    print("- Network restrictions")
    
    try:
        # Test AI analysis
        print("\n🤖 Running AI Analysis...")
        result = ai_analysis_service.analyze_policy_document(sample_text)
        
        if result:
            print(f"✅ AI Analysis completed successfully!")
            print(f"   - Red flags found: {len(result.red_flags)}")
            print(f"   - Benefits found: {len(result.benefits)}")
            print(f"   - Total confidence: {result.total_confidence:.2f}")
            
            print("\n🚩 Red Flags Detected:")
            for i, flag in enumerate(result.red_flags, 1):
                print(f"   {i}. {flag.title}")
                print(f"      Type: {flag.flag_type}")
                print(f"      Severity: {flag.severity}")
                print(f"      Confidence: {flag.confidence_score:.2f}")
                print(f"      Description: {flag.description}")
                if flag.source_text:
                    print(f"      Source: {flag.source_text[:100]}...")
                print()
        else:
            print("❌ AI Analysis failed or returned no results")
            
    except Exception as e:
        print(f"❌ Error during AI analysis: {str(e)}")
        import traceback
        traceback.print_exc()

def check_existing_data():
    """Check what data currently exists in the database"""
    
    print("\n📊 Checking Existing Database Data")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Check documents
        docs = db.query(PolicyDocument).all()
        print(f"📄 Documents: {len(docs)}")
        for doc in docs:
            print(f"   - {doc.original_filename}: {doc.processing_status}")
            if doc.extracted_text:
                print(f"     Text length: {len(doc.extracted_text)} chars")
                # Check if text contains exclusions
                if "exclusion" in doc.extracted_text.lower():
                    print(f"     ✅ Contains 'exclusion' text")
                if "cosmetic" in doc.extracted_text.lower():
                    print(f"     ✅ Contains 'cosmetic' text")
                if "infertility" in doc.extracted_text.lower():
                    print(f"     ✅ Contains 'infertility' text")
        
        # Check policies
        policies = db.query(InsurancePolicy).all()
        print(f"\n📋 Policies: {len(policies)}")
        for policy in policies:
            print(f"   - {policy.policy_name}: {policy.policy_type}")
        
        # Check red flags
        red_flags = db.query(RedFlag).all()
        print(f"\n🚩 Red Flags: {len(red_flags)}")
        for flag in red_flags:
            print(f"   - {flag.title}: {flag.severity} ({flag.flag_type})")
            
        return docs, policies, red_flags
            
    finally:
        db.close()

def create_test_policy_with_red_flags():
    """Create a test policy and manually add red flags for demonstration"""
    
    print("\n🧪 Creating Test Policy with Manual Red Flags")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Create a test policy
        test_policy = InsurancePolicy(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),  # You'll need to use a real user ID
            policy_name="Test Health Insurance Policy",
            policy_type="health",
            carrier_name="Test Insurance Co.",
            policy_number="TEST-001",
            effective_date=datetime.now().date(),
            expiration_date=datetime.now().date(),
            premium_amount=500.00,
            deductible_amount=1000.00,
            coverage_details="Test policy for red flag demonstration"
        )
        
        db.add(test_policy)
        db.commit()
        db.refresh(test_policy)
        
        print(f"✅ Created test policy: {test_policy.policy_name}")
        
        # Create red flags for the exclusions you mentioned
        red_flags_data = [
            {
                "flag_type": "exclusion",
                "severity": "high",
                "title": "Cosmetic Procedures Excluded",
                "description": "Cosmetic procedures are not covered under this policy",
                "source_text": "Cosmetic procedures",
                "recommendation": "Consider supplemental coverage for cosmetic procedures if needed"
            },
            {
                "flag_type": "exclusion", 
                "severity": "high",
                "title": "Infertility Treatment Excluded",
                "description": "Infertility treatments are not covered under this policy",
                "source_text": "Infertility treatment",
                "recommendation": "Look for policies that include fertility coverage if planning family"
            },
            {
                "flag_type": "exclusion",
                "severity": "critical", 
                "title": "Experimental Treatments Excluded",
                "description": "Experimental or investigational treatments are not covered",
                "source_text": "Experimental treatments",
                "recommendation": "Understand what treatments are considered experimental"
            },
            {
                "flag_type": "network_limitation",
                "severity": "medium",
                "title": "Out-of-Network Limitations",
                "description": "Out-of-network services may be denied or subject to higher cost-sharing",
                "source_text": "Out-of-network services may be denied or subject to higher cost-sharing",
                "recommendation": "Always verify provider network status before receiving care"
            }
        ]
        
        created_flags = []
        for flag_data in red_flags_data:
            red_flag = create_red_flag(
                db=db,
                policy_id=test_policy.id,
                **flag_data,
                confidence_score=0.95,
                detected_by="manual_test"
            )
            created_flags.append(red_flag)
            print(f"✅ Created red flag: {red_flag.title}")
        
        print(f"\n🎉 Successfully created {len(created_flags)} red flags!")
        print("\nNow you can:")
        print("1. Go to the Policies page in your web app")
        print("2. Click on 'Test Health Insurance Policy'") 
        print("3. Scroll down to see the Red Flags section")
        
        return test_policy, created_flags
        
    except Exception as e:
        print(f"❌ Error creating test data: {str(e)}")
        db.rollback()
        return None, []
    finally:
        db.close()

def main():
    print("🔍 US Insurance Platform - Red Flag Detection Test")
    print("=" * 60)
    
    # Check existing data
    docs, policies, red_flags = check_existing_data()
    
    # Test AI analysis with sample text
    test_text_with_exclusions()
    
    # Create test policy with red flags if no red flags exist
    if len(red_flags) == 0:
        print("\n💡 No red flags found. Creating test data...")
        create_test_policy_with_red_flags()
    else:
        print(f"\n✅ Found {len(red_flags)} existing red flags in database")

if __name__ == "__main__":
    main()
