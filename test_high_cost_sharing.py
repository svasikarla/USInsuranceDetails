#!/usr/bin/env python3
"""
Test script for enhanced high cost-sharing detection
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.policy_service import _detect_high_cost_sharing_comprehensive
import uuid

def test_high_cost_sharing_detection():
    """Test the enhanced high cost-sharing detection with various scenarios"""
    
    # Test cases based on red flag approach document examples
    test_cases = [
        {
            "name": "Extremely High Individual Deductible (Critical)",
            "text": """
            DEDUCTIBLE INFORMATION
            Individual Deductible: $8,500
            Family Deductible: $17,000
            You must pay this amount before insurance coverage begins.
            """,
            "expected_flags": ["deductible_individual"],
            "expected_severity": "critical"
        },
        {
            "name": "High Family Deductible (High)",
            "text": """
            COST SHARING
            Annual Deductible (Family): $12,000
            After meeting your deductible, you pay 20% coinsurance.
            """,
            "expected_flags": ["deductible_family"],
            "expected_severity": "high"
        },
        {
            "name": "High Primary Care Copay (Medium)",
            "text": """
            COPAY SCHEDULE
            Primary Care Visit: $60 copay
            Specialist Visit: $80 copay
            Emergency Room: $400 copay
            """,
            "expected_flags": ["copay_primary", "copay_specialist"],
            "expected_severity": "medium"
        },
        {
            "name": "Extremely High Coinsurance (Critical)",
            "text": """
            COINSURANCE
            After deductible, you pay 50% coinsurance for all covered services.
            Insurance pays 50% of covered charges.
            """,
            "expected_flags": ["coinsurance"],
            "expected_severity": "critical"
        },
        {
            "name": "High Out-of-Pocket Maximum (High)",
            "text": """
            OUT-OF-POCKET LIMITS
            Individual Out-of-Pocket Maximum: $9,200
            Family Out-of-Pocket Maximum: $18,400
            This is the most you'll pay in a year.
            """,
            "expected_flags": ["oop_max_individual", "oop_max_family"],
            "expected_severity": "high"
        },
        {
            "name": "Separate Drug Deductible (Medium)",
            "text": """
            PRESCRIPTION DRUG COVERAGE
            Medical Deductible: $2,000
            Prescription Drug Deductible: $400
            Drug deductible is separate from medical deductible.
            """,
            "expected_flags": ["drug_deductible"],
            "expected_severity": "medium"
        },
        {
            "name": "Multiple High Costs (Multiple flags)",
            "text": """
            COST SHARING SUMMARY
            Individual Deductible: $6,000
            Primary Care Copay: $55
            Specialist Copay: $85
            Coinsurance: 45%
            Out-of-Pocket Maximum: $9,000
            Prescription Drug Deductible: $300
            """,
            "expected_flags": ["deductible_individual", "copay_primary", "copay_specialist", "coinsurance", "oop_max_individual", "drug_deductible"],
            "expected_severity": "high"
        },
        {
            "name": "Reasonable Costs (Should not trigger)",
            "text": """
            AFFORDABLE COST SHARING
            Individual Deductible: $1,500
            Primary Care Copay: $25
            Specialist Copay: $45
            Coinsurance: 20%
            Out-of-Pocket Maximum: $6,000
            """,
            "expected_flags": [],
            "expected_severity": None
        }
    ]
    
    print("🧪 Testing Enhanced High Cost-Sharing Detection")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print("-" * 40)
        
        text = test_case['text'].lower()
        original_text = test_case['text']
        detected_flag_types = set()
        
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
        original_create_red_flag = None
        created_flags = []
        
        def mock_create_red_flag(db, policy_id, flag_type, severity, title, description, 
                                source_text=None, recommendation=None, confidence_score=None, detected_by=None):
            created_flags.append({
                'flag_type': flag_type,
                'severity': severity,
                'title': title,
                'description': description,
                'source_text': source_text,
                'recommendation': recommendation
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
            # Run the high cost-sharing detection
            _detect_high_cost_sharing_comprehensive(
                db=MockDB(),
                policy=MockPolicy(),
                text=text,
                original_text=original_text,
                detected_flag_types=detected_flag_types
            )
            
            # Analyze results
            print(f"   Testing text: '{test_case['text'][:100]}...'")
            print(f"   Detected {len(created_flags)} cost-sharing flags")
            
            if test_case['expected_flags']:
                # Should detect specific flags
                detected_types = [flag['flag_type'] for flag in created_flags]
                
                for flag in created_flags:
                    print(f"   📍 {flag['title']} ({flag['severity']})")
                    print(f"      Description: {flag['description'][:80]}...")
                
                # Check if expected flags were detected (more flexible matching)
                expected_detected = False
                for expected_flag in test_case['expected_flags']:
                    # Map expected flag types to keywords in titles
                    flag_keywords = {
                        'deductible_individual': ['individual deductible'],
                        'deductible_family': ['family deductible'],
                        'copay_primary': ['primary care copay', 'primary copay'],
                        'copay_specialist': ['specialist copay', 'specialist care copay'],
                        'copay_emergency': ['emergency copay', 'emergency room copay'],
                        'coinsurance': ['coinsurance'],
                        'oop_max_individual': ['individual out-of-pocket'],
                        'oop_max_family': ['family out-of-pocket'],
                        'drug_deductible': ['drug deductible']
                    }

                    keywords = flag_keywords.get(expected_flag, [expected_flag.replace('_', ' ')])
                    flag_found = any(
                        any(keyword.lower() in flag['title'].lower() for keyword in keywords)
                        for flag in created_flags
                    )

                    if flag_found:
                        expected_detected = True
                        print(f"   ✅ PASS: Expected flag type '{expected_flag}' detected")
                    else:
                        print(f"   ❌ FAIL: Expected flag type '{expected_flag}' not detected")
                        print(f"      Detected titles: {[flag['title'] for flag in created_flags]}")
                
                # Check severity
                if created_flags and test_case['expected_severity']:
                    highest_severity = max(created_flags, key=lambda x: {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}.get(x['severity'], 0))
                    if highest_severity['severity'] == test_case['expected_severity']:
                        print(f"   ✅ PASS: Highest severity matches expected ({test_case['expected_severity']})")
                    else:
                        print(f"   ❌ FAIL: Expected severity '{test_case['expected_severity']}', got '{highest_severity['severity']}'")
                
            else:
                # Should not detect any flags
                if len(created_flags) == 0:
                    print("   ✅ PASS: No high cost-sharing detected (as expected)")
                else:
                    print(f"   ❌ FAIL: Unexpected flags detected:")
                    for flag in created_flags:
                        print(f"      - {flag['title']} ({flag['severity']})")
        
        except Exception as e:
            print(f"   ❌ FAIL: Test failed with error: {str(e)}")
            import traceback
            traceback.print_exc()
        
        finally:
            # Restore original function
            if original_create_red_flag:
                policy_service.create_red_flag = original_create_red_flag
    
    print("\n" + "=" * 60)
    print("🎯 High Cost-Sharing Test Summary Complete")

if __name__ == "__main__":
    test_high_cost_sharing_detection()
