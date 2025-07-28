#!/usr/bin/env python3
"""
Test script for mental health and maternity red flag patterns
Based on user preferences for high severity classification
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

def test_mental_health_patterns():
    """Test mental health limitation patterns with various text variations"""
    print("🧠 Testing Mental Health Limitation Patterns")
    print("=" * 60)
    
    # Test cases based on user-provided examples
    test_cases = [
        {
            "name": "Limited Mental Health Visits",
            "text": "Mental health services are limited to 10 visits per calendar year.",
            "expected_severity": "high",
            "should_detect": True
        },
        {
            "name": "Behavioral Health Limits", 
            "text": "Behavioral health treatment is limited to 12 sessions annually.",
            "expected_severity": "high",
            "should_detect": True
        },
        {
            "name": "Therapy Visit Restrictions",
            "text": "Therapy visits are restricted to 8 sessions per year unless medically necessary.",
            "expected_severity": "high",
            "should_detect": True
        },
        {
            "name": "Mental Health Coverage Exclusion",
            "text": "Mental health services are not covered under this plan.",
            "expected_severity": "high",
            "should_detect": True
        },
        {
            "name": "No Mental Health Limitations",
            "text": "Mental health services are covered in full with no visit limitations.",
            "expected_severity": None,
            "should_detect": False
        }
    ]
    
    # Enhanced mental health patterns (matching the actual implementation)
    mental_health_patterns = [
        r'mental health.*?limited to (\d+) visits?',
        r'behavioral health.*?limited to (\d+) sessions?',
        r'therapy.*?limited to (\d+) visits?',
        r'therapy.*?restricted to (\d+) sessions?',
        r'psychiatric.*?limited to (\d+) visits?',
        r'counseling.*?limited to (\d+) sessions?',
        r'mental health.*?maximum (\d+) visits?',
        r'behavioral health.*?maximum (\d+) sessions?',
        r'therapy.*?maximum (\d+) visits?',
        r'mental health.*?(\d+) visits? per year',
        r'behavioral health.*?(\d+) sessions? annually',
        r'therapy.*?(\d+) sessions? per year',
        r'mental health.*?no more than (\d+) visits?',
        r'therapy.*?up to (\d+) sessions?',
        r'(\d+) mental health visits?',
        r'(\d+) therapy sessions?',
        r'(\d+) counseling sessions?',
        r'mental health.*?not covered',
        r'behavioral health.*?excluded',
        r'therapy.*?(\d+) session limit',
        r'mental health.*?maximum (\d+) visits?'
    ]
    
    results = []
    for case in test_cases:
        detected = False
        matches = []
        
        for pattern in mental_health_patterns:
            match = re.search(pattern, case["text"], re.IGNORECASE)
            if match:
                detected = True
                matches.append({
                    "pattern": pattern,
                    "match": match.group(),
                    "groups": match.groups()
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
            for match in matches:
                print(f"   📍 Pattern: {match['pattern']}")
                print(f"   📍 Match: {match['match']}")
    
    correct_count = sum(1 for r in results if r["correct"])
    total_count = len(results)
    accuracy = correct_count / total_count * 100
    
    print(f"\n📊 Mental Health Pattern Accuracy: {accuracy:.1f}% ({correct_count}/{total_count})")
    return results

def test_maternity_patterns():
    """Test maternity waiting period patterns"""
    print("\n🤱 Testing Maternity Waiting Period Patterns")
    print("=" * 60)
    
    # Test cases based on user-provided examples
    test_cases = [
        {
            "name": "12-Month Maternity Waiting Period",
            "text": "There is a 12-month waiting period for maternity benefits.",
            "expected_severity": "high",
            "should_detect": True
        },
        {
            "name": "6-Month Pregnancy Waiting Period",
            "text": "Pregnancy coverage requires a 6-month waiting period.",
            "expected_severity": "high",
            "should_detect": True
        },
        {
            "name": "Maternity Benefits Delayed",
            "text": "Maternity benefits are subject to a 9-month waiting period from enrollment.",
            "expected_severity": "high",
            "should_detect": True
        },
        {
            "name": "No Maternity Waiting Period",
            "text": "Maternity benefits are available immediately upon enrollment.",
            "expected_severity": None,
            "should_detect": False
        },
        {
            "name": "Pregnancy Coverage Excluded",
            "text": "Pregnancy and maternity services are not covered.",
            "expected_severity": "high",
            "should_detect": True
        }
    ]
    
    # Enhanced maternity patterns (matching the waiting period implementation)
    maternity_patterns = [
        r'(\d+)-?month\s+waiting\s+period.*maternity',
        r'(\d+)-?month\s+waiting\s+period.*pregnancy',
        r'maternity.*(\d+)-?month\s+waiting',
        r'pregnancy.*(\d+)-?month\s+waiting',
        r'maternity.*waiting\s+period.*(\d+)\s+months?',
        r'pregnancy.*waiting\s+period.*(\d+)\s+months?',
        r'waiting\s+period\s+of\s+(\d+)\s+months?.*maternity',
        r'waiting\s+period\s+of\s+(\d+)\s+months?.*pregnancy',
        r'(\d+)\s+month[s]?\s+wait.*maternity',
        r'(\d+)\s+month[s]?\s+wait.*pregnancy',
        r'maternity.*not covered',
        r'pregnancy.*excluded',
        r'maternity.*excluded',
        r'pregnancy.*not covered'
    ]
    
    results = []
    for case in test_cases:
        detected = False
        matches = []
        
        for pattern in maternity_patterns:
            match = re.search(pattern, case["text"], re.IGNORECASE)
            if match:
                detected = True
                matches.append({
                    "pattern": pattern,
                    "match": match.group(),
                    "groups": match.groups()
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
            for match in matches:
                print(f"   📍 Pattern: {match['pattern']}")
                print(f"   📍 Match: {match['match']}")
    
    correct_count = sum(1 for r in results if r["correct"])
    total_count = len(results)
    accuracy = correct_count / total_count * 100
    
    print(f"\n📊 Maternity Pattern Accuracy: {accuracy:.1f}% ({correct_count}/{total_count})")
    return results

def test_authorization_patterns():
    """Test authorization requirement patterns"""
    print("\n🔐 Testing Authorization Requirement Patterns")
    print("=" * 60)
    
    # Test cases for authorization requirements
    test_cases = [
        {
            "name": "Out-of-Network Authorization",
            "text": "Out-of-network services require prior authorization.",
            "expected_severity": "medium",
            "should_detect": True
        },
        {
            "name": "Pre-authorization Required",
            "text": "All specialist visits require pre-authorization.",
            "expected_severity": "medium",
            "should_detect": True
        },
        {
            "name": "Prior Approval Needed",
            "text": "Prior approval is required for all imaging services.",
            "expected_severity": "medium",
            "should_detect": True
        },
        {
            "name": "No Authorization Required",
            "text": "No prior authorization is required for covered services.",
            "expected_severity": None,
            "should_detect": False
        }
    ]
    
    # Enhanced authorization patterns (matching the implementation)
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
            for match in matches:
                print(f"   📍 Pattern: {match['pattern']}")
                print(f"   📍 Match: {match['match']}")
    
    correct_count = sum(1 for r in results if r["correct"])
    total_count = len(results)
    accuracy = correct_count / total_count * 100
    
    print(f"\n📊 Authorization Pattern Accuracy: {accuracy:.1f}% ({correct_count}/{total_count})")
    return results

def main():
    print("🔍 Mental Health & Maternity Red Flag Pattern Testing")
    print("=" * 80)
    
    # Test all pattern categories
    mental_results = test_mental_health_patterns()
    maternity_results = test_maternity_patterns()
    auth_results = test_authorization_patterns()
    
    # Overall summary
    print("\n📊 OVERALL PATTERN TESTING SUMMARY")
    print("=" * 80)
    
    all_results = mental_results + maternity_results + auth_results
    total_correct = sum(1 for r in all_results if r["correct"])
    total_tests = len(all_results)
    overall_accuracy = total_correct / total_tests * 100
    
    print(f"✅ Mental Health Tests: {len(mental_results)} cases")
    print(f"✅ Maternity Tests: {len(maternity_results)} cases")
    print(f"✅ Authorization Tests: {len(auth_results)} cases")
    print(f"📊 Overall Accuracy: {overall_accuracy:.1f}% ({total_correct}/{total_tests})")
    
    if overall_accuracy >= 90:
        print("🎉 EXCELLENT: Pattern detection is working very well!")
    elif overall_accuracy >= 80:
        print("✅ GOOD: Pattern detection is working well with room for improvement.")
    else:
        print("⚠️ NEEDS IMPROVEMENT: Pattern detection needs enhancement.")

if __name__ == "__main__":
    main()
