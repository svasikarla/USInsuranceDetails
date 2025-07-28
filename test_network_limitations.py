#!/usr/bin/env python3
"""
Test script for enhanced network limitation detection
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.policy_service import _detect_network_limitations_comprehensive
import uuid

def test_network_limitation_detection():
    """Test the enhanced network limitation detection with various scenarios"""
    
    # Test cases based on red flag approach document examples
    test_cases = [
        {
            "name": "Narrow Network Plan (High)",
            "text": """
            NETWORK INFORMATION
            This is a narrow network plan with limited provider choices.
            Coverage is restricted to designated providers only.
            Out-of-network services are not covered except for emergencies.
            """,
            "expected_flags": ["narrow", "out_of_network"],
            "expected_severity": "high"
        },
        {
            "name": "EPO Plan - No Out-of-Network Coverage (Critical)",
            "text": """
            EXCLUSIVE PROVIDER ORGANIZATION (EPO)
            This EPO plan provides no coverage for out-of-network services.
            All care must be received from network providers.
            Out-of-network services are excluded from coverage.
            """,
            "expected_flags": ["narrow", "out_of_network"],
            "expected_severity": "critical"
        },
        {
            "name": "Tiered Provider System (Medium)",
            "text": """
            PROVIDER TIERS
            This plan uses a tiered provider system:
            - Tier 1 providers: Lower cost-sharing
            - Tier 2 providers: Higher cost-sharing
            Preferred providers offer lower costs than standard providers.
            """,
            "expected_flags": ["tiered"],
            "expected_severity": "medium"
        },
        {
            "name": "Geographic Limitations (Medium)",
            "text": """
            COVERAGE AREA
            Network coverage is limited to the local state only.
            Out-of-area coverage is limited to emergency services only.
            Travel coverage is restricted to emergency care.
            """,
            "expected_flags": ["geographic"],
            "expected_severity": "medium"
        },
        {
            "name": "Specialist Restrictions (High)",
            "text": """
            SPECIALIST ACCESS
            Specialist network is limited with long waiting lists.
            Specialist services are not covered out-of-network.
            Prior authorization is required for all specialist visits.
            """,
            "expected_flags": ["specialist"],
            "expected_severity": "high"
        },
        {
            "name": "Referral Requirements (Medium)",
            "text": """
            REFERRAL SYSTEM
            PCP referral is required for all specialist services.
            This plan uses a gatekeeper model for care coordination.
            No coverage is provided without proper referrals.
            """,
            "expected_flags": ["referral"],
            "expected_severity": "high"
        },
        {
            "name": "Balance Billing Risk (High)",
            "text": """
            OUT-OF-NETWORK BILLING
            Out-of-network providers may balance bill patients.
            You may be responsible for full charges from non-network providers.
            Out-of-network services have 60% coinsurance.
            """,
            "expected_flags": ["out_of_network"],
            "expected_severity": "high"
        },
        {
            "name": "Multiple Network Issues (Multiple flags)",
            "text": """
            NETWORK SUMMARY
            This narrow network HMO plan has the following restrictions:
            - Limited network of providers
            - Referral required for all specialist services
            - No out-of-network coverage except emergencies
            - Coverage limited to local region only
            - Tier 1 and Tier 2 provider system
            """,
            "expected_flags": ["narrow", "referral", "out_of_network", "geographic", "tiered"],
            "expected_severity": "high"
        },
        {
            "name": "Broad Network Plan (Should not trigger)",
            "text": """
            COMPREHENSIVE NETWORK
            This plan offers a broad network of providers nationwide.
            Out-of-network coverage available with higher cost-sharing.
            No referrals required for specialist care.
            Coverage available in all 50 states.
            """,
            "expected_flags": [],
            "expected_severity": None
        }
    ]
    
    print("🧪 Testing Enhanced Network Limitation Detection")
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
            # Run the network limitation detection
            _detect_network_limitations_comprehensive(
                db=MockDB(),
                policy=MockPolicy(),
                text=text,
                original_text=original_text,
                detected_flag_types=detected_flag_types
            )
            
            # Analyze results
            print(f"   Testing text: '{test_case['text'][:100]}...'")
            print(f"   Detected {len(created_flags)} network limitation flags")
            
            if test_case['expected_flags']:
                # Should detect specific flags
                for flag in created_flags:
                    print(f"   📍 {flag['title']} ({flag['severity']})")
                    print(f"      Description: {flag['description'][:80]}...")
                
                # Check if expected flag types were detected (flexible matching)
                flag_keywords = {
                    'narrow': ['narrow', 'limited network', 'restricted network', 'epo'],
                    'out_of_network': ['out-of-network', 'out of network', 'balance billing'],
                    'tiered': ['tiered', 'tier', 'preferred provider'],
                    'geographic': ['geographic', 'coverage area', 'local', 'regional'],
                    'specialist': ['specialist', 'specialist network'],
                    'referral': ['referral', 'gatekeeper']
                }
                
                for expected_flag in test_case['expected_flags']:
                    keywords = flag_keywords.get(expected_flag, [expected_flag])
                    flag_found = any(
                        any(keyword.lower() in flag['title'].lower() for keyword in keywords)
                        for flag in created_flags
                    )
                    
                    if flag_found:
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
                    print("   ✅ PASS: No network limitations detected (as expected)")
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
    print("🎯 Network Limitation Test Summary Complete")

if __name__ == "__main__":
    test_network_limitation_detection()
