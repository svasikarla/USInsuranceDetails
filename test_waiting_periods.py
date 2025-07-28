#!/usr/bin/env python3
"""
Test script for enhanced waiting period detection
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.policy import InsurancePolicy
from backend.app.models.document import PolicyDocument
from backend.app.models.red_flag import RedFlag
from backend.app.services.policy_service import _detect_waiting_periods_comprehensive
import uuid

def test_waiting_period_detection():
    """Test the enhanced waiting period detection with various scenarios"""
    
    # Test cases based on red flag approach document examples
    test_cases = [
        {
            "name": "Maternity 12-month waiting period (Critical)",
            "text": """
            MATERNITY BENEFITS
            Coverage for maternity care, including prenatal visits, delivery, and postnatal care.
            WAITING PERIOD: There is a 12-month waiting period for maternity benefits.
            Coverage begins after 12 months of continuous enrollment.
            """,
            "expected_severity": "critical",
            "expected_flag_type": "coverage_limitation"
        },
        {
            "name": "Maternity 6-month waiting period (High)",
            "text": """
            PREGNANCY AND CHILDBIRTH
            Maternity services are covered under this plan.
            New enrollees must wait 6 months before maternity coverage begins.
            """,
            "expected_severity": "high",
            "expected_flag_type": "coverage_limitation"
        },
        {
            "name": "Pre-existing condition waiting period (High)",
            "text": """
            PRE-EXISTING CONDITIONS
            Coverage for pre-existing medical conditions is subject to a 6-month waiting period.
            Any condition diagnosed or treated in the 12 months prior to enrollment
            will not be covered for the first 6 months of coverage.
            """,
            "expected_severity": "high",
            "expected_flag_type": "coverage_limitation"
        },
        {
            "name": "Mental health waiting period (High)",
            "text": """
            MENTAL HEALTH SERVICES
            Mental health and behavioral health services are covered.
            There is a 90-day waiting period for mental health benefits.
            Therapy and counseling services require 3 months of enrollment.
            """,
            "expected_severity": "high",
            "expected_flag_type": "coverage_limitation"
        },
        {
            "name": "Employment eligibility waiting period (Medium)",
            "text": """
            ELIGIBILITY
            Employees become eligible for health insurance coverage after 90 days of employment.
            Coverage begins on the first day of the month following completion of the waiting period.
            """,
            "expected_severity": "medium",
            "expected_flag_type": "coverage_limitation"
        },
        {
            "name": "Specialist care waiting period (Medium)",
            "text": """
            SPECIALIST SERVICES
            Specialist visits are covered with referral from primary care physician.
            New members must wait 30 days before specialist care coverage begins.
            """,
            "expected_severity": "medium",
            "expected_flag_type": "coverage_limitation"
        },
        {
            "name": "General 180-day waiting period (Medium)",
            "text": """
            COVERAGE EFFECTIVE DATE
            Coverage begins 180 days after enrollment date.
            No benefits are available during the 6-month waiting period.
            """,
            "expected_severity": "medium",
            "expected_flag_type": "coverage_limitation"
        },
        {
            "name": "No waiting period (Should not trigger)",
            "text": """
            IMMEDIATE COVERAGE
            Coverage begins immediately upon enrollment.
            All benefits are available from day one.
            No waiting periods apply to any services.
            """,
            "expected_severity": None,
            "expected_flag_type": None
        }
    ]
    
    print("🧪 Testing Enhanced Waiting Period Detection")
    print("=" * 60)
    
    # Create a test database session
    db = SessionLocal()
    
    try:
        # Create a mock policy for testing and save it to database
        test_policy = InsurancePolicy(
            id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            document_id=uuid.uuid4(),
            policy_name="Test Policy for Waiting Periods",
            policy_type="health"
        )

        # Add policy to database for foreign key constraint
        db.add(test_policy)
        db.commit()
        db.refresh(test_policy)
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{i}. Testing: {test_case['name']}")
            print("-" * 40)
            
            # Clear any existing red flags for clean testing
            db.query(RedFlag).filter(RedFlag.policy_id == test_policy.id).delete()
            db.commit()
            
            # Track detected flag types
            detected_flag_types = set()
            
            # Run the waiting period detection
            _detect_waiting_periods_comprehensive(
                db=db,
                policy=test_policy,
                text=test_case['text'].lower(),
                original_text=test_case['text'],
                detected_flag_types=detected_flag_types
            )
            
            # Check results
            red_flags = db.query(RedFlag).filter(RedFlag.policy_id == test_policy.id).all()
            
            if test_case['expected_severity'] is None:
                # Should not detect any waiting period
                if len(red_flags) == 0:
                    print("✅ PASS: No waiting period detected (as expected)")
                else:
                    print(f"❌ FAIL: Unexpected red flag detected: {red_flags[0].title}")
            else:
                # Should detect a waiting period
                if len(red_flags) == 0:
                    print(f"❌ FAIL: Expected {test_case['expected_severity']} severity flag, but none detected")
                elif len(red_flags) == 1:
                    flag = red_flags[0]
                    print(f"📍 Detected: {flag.title}")
                    print(f"   Severity: {flag.severity}")
                    print(f"   Type: {flag.flag_type}")
                    print(f"   Description: {flag.description[:100]}...")
                    
                    # Check if severity matches expected
                    if flag.severity == test_case['expected_severity']:
                        print("✅ PASS: Severity matches expected")
                    else:
                        print(f"❌ FAIL: Expected severity '{test_case['expected_severity']}', got '{flag.severity}'")
                    
                    # Check if flag type matches expected
                    if flag.flag_type == test_case['expected_flag_type']:
                        print("✅ PASS: Flag type matches expected")
                    else:
                        print(f"❌ FAIL: Expected flag type '{test_case['expected_flag_type']}', got '{flag.flag_type}'")
                        
                else:
                    print(f"❌ FAIL: Expected 1 red flag, but detected {len(red_flags)}")
                    for flag in red_flags:
                        print(f"   - {flag.title} ({flag.severity})")
        
        print("\n" + "=" * 60)
        print("🎯 Test Summary Complete")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Clean up test data
        try:
            db.query(RedFlag).filter(RedFlag.policy_id == test_policy.id).delete()
            db.query(InsurancePolicy).filter(InsurancePolicy.id == test_policy.id).delete()
            db.commit()
        except:
            pass
        db.close()

if __name__ == "__main__":
    test_waiting_period_detection()
