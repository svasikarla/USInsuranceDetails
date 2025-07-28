#!/usr/bin/env python3
"""
Comprehensive test script for all enhanced red flag detection categories
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.policy_service import _detect_red_flags_comprehensive
import uuid

def test_comprehensive_red_flag_detection():
    """Test all enhanced red flag detection categories together"""
    
    # Comprehensive test case with multiple red flags
    test_case = {
        "name": "Comprehensive Red Flag Policy",
        "text": """
        POLICY SUMMARY - SHORT-TERM MEDICAL PLAN
        
        WAITING PERIODS:
        - 12-month waiting period for maternity benefits
        - 90-day waiting period for mental health services
        
        COST SHARING:
        - Individual Deductible: $8,500
        - Out-of-network services: 60% coinsurance
        - Primary Care Copay: $65
        
        NETWORK LIMITATIONS:
        - Narrow network plan with limited provider choices
        - No out-of-network coverage except emergencies
        - Specialist referral required for all services
        
        EXCLUSIONS:
        - Mental health services excluded
        - Prescription drugs not covered
        - Emergency services excluded
        
        APPEALS:
        - Appeals must be filed within 15 days
        - Three levels of appeals required
        - Appeals must be notarized
        
        ACA COMPLIANCE:
        - This is a short-term medical plan
        - Not ACA compliant
        - Pre-existing conditions excluded
        - Annual benefit limit: $50,000
        """,
        "expected_categories": [
            "waiting_period", "high_cost", "network_limitation", 
            "coverage_exclusion", "appeal_burden", "aca_compliance"
        ]
    }
    
    print("🧪 Testing Comprehensive Red Flag Detection")
    print("=" * 60)
    print(f"Testing: {test_case['name']}")
    print("-" * 40)
    
    text = test_case['text'].lower()
    original_text = test_case['text']
    
    # Mock objects for testing
    class MockPolicy:
        def __init__(self):
            self.id = uuid.uuid4()
    
    class MockDB:
        def __init__(self):
            self.created_flags = []
        
        def add(self, obj):
            pass
        
        def commit(self):
            pass
        
        def refresh(self, obj):
            pass
    
    # Mock the create_red_flag function to capture results
    created_flags = []
    
    def mock_create_red_flag(db, policy_id, flag_type, severity, title, description, 
                            source_text=None, recommendation=None, confidence_score=None, detected_by=None):
        created_flags.append({
            'flag_type': flag_type,
            'severity': severity,
            'title': title,
            'description': description,
            'source_text': source_text,
            'recommendation': recommendation,
            'detected_by': detected_by
        })
        
        # Mock red flag object
        class MockRedFlag:
            def __init__(self):
                self.id = uuid.uuid4()
                self.flag_type = flag_type
                self.severity = severity
                self.title = title
                self.description = description
        
        return MockRedFlag()
    
    # Temporarily replace the create_red_flag function
    import backend.app.services.policy_service as policy_service
    original_create_red_flag = policy_service.create_red_flag
    policy_service.create_red_flag = mock_create_red_flag
    
    try:
        # Run comprehensive red flag detection
        _detect_red_flags_comprehensive(
            db=MockDB(),
            policy=MockPolicy(),
            text=text,
            original_text=original_text
        )
        
        # Analyze results
        print(f"Detected {len(created_flags)} total red flags")
        print("\nDetected Red Flags:")
        
        # Group by severity
        severity_groups = {}
        for flag in created_flags:
            severity = flag['severity']
            if severity not in severity_groups:
                severity_groups[severity] = []
            severity_groups[severity].append(flag)
        
        # Display by severity
        for severity in ['critical', 'high', 'medium', 'low']:
            if severity in severity_groups:
                print(f"\n{severity.upper()} SEVERITY ({len(severity_groups[severity])} flags):")
                for flag in severity_groups[severity]:
                    print(f"  📍 {flag['title']}")
                    print(f"     Type: {flag['flag_type']}")
                    print(f"     Description: {flag['description'][:80]}...")
                    if flag['detected_by']:
                        print(f"     Detected by: {flag['detected_by']}")
        
        # Check coverage of expected categories
        print(f"\nCategory Coverage Analysis:")
        detected_categories = set()
        
        # Map flags to categories
        for flag in created_flags:
            title_lower = flag['title'].lower()
            if any(term in title_lower for term in ['waiting', 'period']):
                detected_categories.add('waiting_period')
            elif any(term in title_lower for term in ['deductible', 'copay', 'coinsurance', 'cost']):
                detected_categories.add('high_cost')
            elif any(term in title_lower for term in ['network', 'out-of-network', 'narrow']):
                detected_categories.add('network_limitation')
            elif any(term in title_lower for term in ['excluded', 'exclusion', 'not covered']):
                detected_categories.add('coverage_exclusion')
            elif any(term in title_lower for term in ['appeal', 'deadline']):
                detected_categories.add('appeal_burden')
            elif any(term in title_lower for term in ['short-term', 'aca', 'compliant', 'pre-existing']):
                detected_categories.add('aca_compliance')
        
        for expected_category in test_case['expected_categories']:
            if expected_category in detected_categories:
                print(f"  ✅ {expected_category}: Detected")
            else:
                print(f"  ❌ {expected_category}: Not detected")
        
        # Summary statistics
        print(f"\nSummary Statistics:")
        print(f"  Total flags detected: {len(created_flags)}")
        print(f"  Categories covered: {len(detected_categories)}/{len(test_case['expected_categories'])}")
        print(f"  Critical flags: {len(severity_groups.get('critical', []))}")
        print(f"  High severity flags: {len(severity_groups.get('high', []))}")
        print(f"  Medium severity flags: {len(severity_groups.get('medium', []))}")
        print(f"  Enhanced detection flags: {len([f for f in created_flags if f.get('detected_by') == 'pattern_enhanced'])}")
        
        # Success rate
        success_rate = len(detected_categories) / len(test_case['expected_categories']) * 100
        print(f"  Detection success rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("\n🎉 EXCELLENT: Comprehensive red flag detection is working very well!")
        elif success_rate >= 60:
            print("\n✅ GOOD: Most red flag categories are being detected successfully.")
        else:
            print("\n⚠️  NEEDS IMPROVEMENT: Several red flag categories are missing.")
    
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Restore original function
        if original_create_red_flag:
            policy_service.create_red_flag = original_create_red_flag
    
    print("\n" + "=" * 60)
    print("🎯 Comprehensive Red Flag Test Complete")

if __name__ == "__main__":
    test_comprehensive_red_flag_detection()
