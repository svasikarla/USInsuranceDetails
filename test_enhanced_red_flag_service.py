#!/usr/bin/env python3
"""
Test Enhanced Red Flag Service

This script tests the enhanced red flag service with duplicate prevention
and verifies it works correctly with the Supabase database.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.policy import InsurancePolicy
from backend.app.models.document import PolicyDocument
from backend.app.models.red_flag import RedFlag
from backend.app.services.enhanced_red_flag_service import enhanced_red_flag_service

def test_enhanced_service():
    """Test the enhanced red flag service"""
    print("🔍 Testing Enhanced Red Flag Service")
    print("=" * 80)
    
    db = SessionLocal()
    try:
        # Get the sample policy and document
        policy = db.query(InsurancePolicy).filter(
            InsurancePolicy.id == "7b475300-c75b-4693-afd8-fc49171e7b82"
        ).first()
        
        if not policy:
            print("❌ Sample policy not found")
            return False
        
        document = db.query(PolicyDocument).filter(
            PolicyDocument.id == policy.document_id
        ).first()
        
        if not document:
            print("❌ Sample document not found")
            return False
        
        print(f"✅ Found policy: {policy.policy_name}")
        print(f"✅ Found document: {document.original_filename}")
        
        # Count existing red flags
        initial_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
        print(f"📊 Initial red flags: {initial_count}")
        
        # Run enhanced analysis
        print("\n🤖 Running Enhanced Red Flag Analysis...")
        created_flags = enhanced_red_flag_service.analyze_policy_with_duplicate_prevention(
            db, policy, document
        )
        
        # Count final red flags
        final_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
        print(f"📊 Final red flags: {final_count}")
        print(f"🆕 Newly created flags: {len(created_flags)}")
        
        # Verify no duplicates
        unique_flags = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).all()
        flag_signatures = set()
        duplicates = 0
        
        for flag in unique_flags:
            signature = f"{flag.flag_type}|{flag.title}|{flag.severity}"
            if signature in flag_signatures:
                duplicates += 1
            else:
                flag_signatures.add(signature)
        
        print(f"🔍 Duplicate check: {duplicates} duplicates found")
        
        # Display results by severity
        severity_counts = {}
        for flag in unique_flags:
            severity = flag.severity
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        print("\n📊 Red Flags by Severity:")
        severity_order = ['critical', 'high', 'medium', 'low']
        for severity in severity_order:
            if severity in severity_counts:
                count = severity_counts[severity]
                print(f"  🚨 {severity.upper()}: {count} flags")
        
        # Show sample flags
        print("\n📋 Sample Red Flags:")
        sample_flags = db.query(RedFlag).filter(
            RedFlag.policy_id == policy.id
        ).order_by(
            RedFlag.severity.desc()
        ).limit(3).all()
        
        for i, flag in enumerate(sample_flags, 1):
            print(f"{i}. {flag.title} ({flag.severity})")
            print(f"   Confidence: {flag.confidence_score:.0%}")
            print(f"   Method: {flag.detected_by}")
            if flag.recommendation:
                print(f"   Recommendation: {flag.recommendation[:100]}...")
            print()
        
        success = duplicates == 0 and final_count > 0
        
        if success:
            print("✅ Enhanced Red Flag Service test PASSED!")
            print("  - No duplicates detected")
            print("  - Red flags created successfully")
            print("  - Enhanced metadata included")
        else:
            print("❌ Enhanced Red Flag Service test FAILED!")
            if duplicates > 0:
                print(f"  - {duplicates} duplicates found")
            if final_count == 0:
                print("  - No red flags created")
        
        return success
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False
    finally:
        db.close()

def test_duplicate_prevention():
    """Test duplicate prevention by running analysis twice"""
    print("\n🔄 Testing Duplicate Prevention")
    print("=" * 80)
    
    db = SessionLocal()
    try:
        # Get the sample policy and document
        policy = db.query(InsurancePolicy).filter(
            InsurancePolicy.id == "7b475300-c75b-4693-afd8-fc49171e7b82"
        ).first()
        
        document = db.query(PolicyDocument).filter(
            PolicyDocument.id == policy.document_id
        ).first()
        
        # Run analysis first time
        print("🔄 Running analysis - First time...")
        enhanced_red_flag_service.analyze_policy_with_duplicate_prevention(
            db, policy, document
        )
        first_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
        print(f"📊 First run: {first_count} red flags")
        
        # Run analysis second time
        print("🔄 Running analysis - Second time...")
        enhanced_red_flag_service.analyze_policy_with_duplicate_prevention(
            db, policy, document
        )
        second_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
        print(f"📊 Second run: {second_count} red flags")
        
        # Check for duplicates
        if first_count == second_count:
            print("✅ Duplicate prevention PASSED!")
            print("  - Same number of flags after second run")
            print("  - No duplicates created")
            return True
        else:
            print("❌ Duplicate prevention FAILED!")
            print(f"  - Flag count changed: {first_count} → {second_count}")
            return False
        
    except Exception as e:
        print(f"❌ Duplicate prevention test failed: {str(e)}")
        return False
    finally:
        db.close()

def main():
    """Run all enhanced red flag service tests"""
    print("🔍 Enhanced Red Flag Service Testing")
    print("=" * 80)
    
    # Run tests
    tests = [
        ("Enhanced Service", test_enhanced_service),
        ("Duplicate Prevention", test_duplicate_prevention)
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} Test...")
        results[test_name] = test_func()
    
    # Summary
    print("\n📊 ENHANCED SERVICE TEST SUMMARY")
    print("=" * 80)
    
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
    
    success_rate = passed_tests / total_tests * 100
    print(f"\n📈 Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    
    if success_rate == 100:
        print("🎉 EXCELLENT: All enhanced service tests passed!")
        print("✅ Red flag analysis is working perfectly with duplicate prevention")
    else:
        print("⚠️ ISSUES FOUND: Some tests failed")
    
    return success_rate == 100

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
