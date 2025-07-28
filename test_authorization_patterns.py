#!/usr/bin/env python3
"""
Test script for authorization requirement patterns
"""
import sys
import os
import re
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_authorization_patterns():
    """Test comprehensive authorization requirement patterns"""
    print("🔐 Testing Authorization Requirement Patterns")
    print("=" * 60)
    
    # Test cases for various authorization scenarios
    test_cases = [
        {
            "name": "Standard Pre-authorization",
            "text": "Pre-authorization is required for all specialist visits.",
            "expected_type": "preauth_required",
            "should_detect": True
        },
        {
            "name": "Prior Authorization Required",
            "text": "Prior authorization required for imaging services.",
            "expected_type": "preauth_required", 
            "should_detect": True
        },
        {
            "name": "Out-of-Network Authorization",
            "text": "Out-of-network services require prior authorization.",
            "expected_type": "preauth_required",
            "should_detect": True
        },
        {
            "name": "Specialist Authorization",
            "text": "All specialist visits require authorization.",
            "expected_type": "preauth_required",
            "should_detect": True
        },
        {
            "name": "Prior Approval Required",
            "text": "Prior approval is required for surgical procedures.",
            "expected_type": "preauth_required",
            "should_detect": True
        },
        {
            "name": "Pre-certification Required",
            "text": "Pre-certification is required for hospital admissions.",
            "expected_type": "preauth_required",
            "should_detect": True
        },
        {
            "name": "Advance Approval",
            "text": "Advance approval required for MRI scans.",
            "expected_type": "preauth_required",
            "should_detect": True
        },
        {
            "name": "No Authorization Required",
            "text": "No prior authorization is required for covered services.",
            "expected_type": None,
            "should_detect": False
        }
    ]
    
    # Enhanced authorization patterns from the implementation
    auth_patterns = [
        # Standard authorization patterns
        r'(pre-?authorization|prior authorization|pre-?auth|prior auth).*?required',
        r'require[sd]?\s+(pre-?authorization|prior authorization|pre-?auth|prior auth)',
        r'authorization\s+required',
        r'requires?\s+authorization',
        r'must\s+obtain\s+authorization',
        r'authorization\s+must\s+be\s+obtained',
        
        # Additional authorization patterns
        r'prior approval.*?required',
        r'pre-?approval.*?required',
        r'requires?\s+prior\s+approval',
        r'requires?\s+pre-?approval',
        r'approval.*?required.*?before',
        r'must\s+be\s+approved\s+in\s+advance',
        r'advance\s+approval\s+required',
        r'pre-?certification.*?required',
        r'requires?\s+pre-?certification',
        
        # Out-of-network specific authorization
        r'out-?of-?network.*?authorization',
        r'out-?of-?network.*?approval',
        r'out-?of-?network.*?pre-?auth',
        r'authorization.*?out-?of-?network',
        r'approval.*?out-?of-?network',
        
        # Service-specific authorization
        r'specialist.*?authorization',
        r'specialist.*?approval',
        r'imaging.*?authorization',
        r'surgery.*?authorization',
        r'procedure.*?authorization'
    ]
    
    results = []
    for case in test_cases:
        detected = False
        matches = []
        
        for pattern in auth_patterns:
            match = re.search(pattern, case["text"], re.IGNORECASE)
            if match:
                detected = True
                matches.append({
                    "pattern": pattern,
                    "match": match.group()
                })
        
        result = {
            "case": case["name"],
            "detected": detected,
            "expected": case["should_detect"],
            "correct": detected == case["should_detect"],
            "matches": matches
        }
        results.append(result)
        
        status = "✅" if result["correct"] else "❌"
        print(f"{status} {case['name']}: {'Detected' if detected else 'Not detected'}")
        if matches:
            for match in matches[:2]:  # Show first 2 matches
                print(f"   📍 Pattern: {match['pattern']}")
                print(f"   📍 Match: {match['match']}")
    
    correct_count = sum(1 for r in results if r["correct"])
    total_count = len(results)
    accuracy = correct_count / total_count * 100
    
    print(f"\n📊 Authorization Pattern Accuracy: {accuracy:.1f}% ({correct_count}/{total_count})")
    
    if accuracy >= 90:
        print("🎉 EXCELLENT: Authorization pattern detection is working very well!")
    elif accuracy >= 80:
        print("✅ GOOD: Authorization pattern detection is working well.")
    else:
        print("⚠️ NEEDS IMPROVEMENT: Authorization pattern detection needs enhancement.")
    
    return results

def main():
    print("🔍 Authorization Requirements Pattern Testing")
    print("=" * 80)
    
    # Test authorization patterns
    auth_results = test_authorization_patterns()
    
    print("\n📊 AUTHORIZATION PATTERN TESTING SUMMARY")
    print("=" * 80)
    
    total_correct = sum(1 for r in auth_results if r["correct"])
    total_tests = len(auth_results)
    overall_accuracy = total_correct / total_tests * 100
    
    print(f"✅ Authorization Tests: {len(auth_results)} cases")
    print(f"📊 Overall Accuracy: {overall_accuracy:.1f}% ({total_correct}/{total_tests})")
    
    # Show specific pattern performance
    detected_cases = [r for r in auth_results if r["detected"]]
    print(f"📍 Detected Cases: {len(detected_cases)}")
    
    false_positives = [r for r in auth_results if r["detected"] and not r["expected"]]
    false_negatives = [r for r in auth_results if not r["detected"] and r["expected"]]
    
    if false_positives:
        print(f"⚠️ False Positives: {len(false_positives)}")
        for fp in false_positives:
            print(f"   - {fp['case']}")
    
    if false_negatives:
        print(f"⚠️ False Negatives: {len(false_negatives)}")
        for fn in false_negatives:
            print(f"   - {fn['case']}")

if __name__ == "__main__":
    main()
