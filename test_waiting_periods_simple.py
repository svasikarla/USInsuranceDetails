#!/usr/bin/env python3
"""
Simple test script for enhanced waiting period detection (no database required)
"""
import sys
import os
import re

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_waiting_period_patterns():
    """Test the enhanced waiting period regex patterns directly"""
    
    # Import the pattern detection logic
    from backend.app.services.policy_service import _analyze_waiting_period_context
    
    # Test cases based on red flag approach document examples
    test_cases = [
        {
            "name": "Maternity 12-month waiting period (Critical)",
            "text": "There is a 12-month waiting period for maternity benefits.",
            "expected_severity": "critical",
            "expected_title_contains": "Critical Maternity"
        },
        {
            "name": "Maternity 6-month waiting period (High)",
            "text": "New enrollees must wait 6 months before maternity coverage begins.",
            "expected_severity": "high",
            "expected_title_contains": "Maternity"
        },
        {
            "name": "Pre-existing condition waiting period (High)",
            "text": "Coverage for pre-existing medical conditions is subject to a 6-month waiting period.",
            "expected_severity": "high",
            "expected_title_contains": "Pre-existing"
        },
        {
            "name": "Mental health waiting period (High)",
            "text": "There is a 90-day waiting period for mental health benefits.",
            "expected_severity": "high",
            "expected_title_contains": "Mental Health"
        },
        {
            "name": "Employment eligibility waiting period (Medium)",
            "text": "Employees become eligible for health insurance coverage after 90 days of employment.",
            "expected_severity": "medium",
            "expected_title_contains": "Employment"
        },
        {
            "name": "General 180-day waiting period (Medium)",
            "text": "Coverage begins 180 days after enrollment date.",
            "expected_severity": "medium",
            "expected_title_contains": "Coverage Waiting"
        },
        {
            "name": "Alternative employment pattern",
            "text": "Health benefits are available after 3 months of employment.",
            "expected_severity": "medium",
            "expected_title_contains": "Employment"
        },
        {
            "name": "Alternative coverage pattern",
            "text": "Benefits start 6 months after enrollment.",
            "expected_severity": "medium",
            "expected_title_contains": "Coverage"
        }
    ]
    
    print("🧪 Testing Enhanced Waiting Period Pattern Detection")
    print("=" * 60)
    
    # Enhanced waiting period patterns (copied from the implementation)
    waiting_period_patterns = [
        (r'(\d+)-?month\s+waiting\s+period', 'months'),
        (r'waiting\s+period\s+of\s+(\d+)\s+months?', 'months'),
        (r'(\d+)\s+month[s]?\s+wait(?:ing)?', 'months'),
        (r'must\s+wait\s+(\d+)\s+months?', 'months'),
        (r'coverage\s+begins\s+after\s+(\d+)\s+months?', 'months'),
        (r'(\d+)\s+months?\s+before\s+coverage', 'months'),
        (r'effective\s+after\s+(\d+)\s+months?', 'months'),
        (r'(\d+)-?day\s+waiting\s+period', 'days'),
        (r'waiting\s+period\s+of\s+(\d+)\s+days?', 'days'),
        (r'(\d+)\s+days?\s+wait(?:ing)?', 'days'),
        (r'must\s+wait\s+(\d+)\s+days?', 'days'),
        (r'coverage\s+begins\s+after\s+(\d+)\s+days?', 'days'),
        (r'eligible\s+after\s+(\d+)\s+months?', 'months'),
        (r'eligibility\s+begins\s+after\s+(\d+)\s+months?', 'months'),
        (r'(\d+)\s+months?\s+of\s+employment\s+required', 'months'),
        (r'(\d+)\s+months?\s+before\s+eligible', 'months'),
        (r'(\d+)\s+months?\s+waiting\s+period\s+for', 'months'),
        (r'(\d+)\s+months?\s+wait\s+for', 'months'),
        (r'no\s+coverage\s+for\s+(\d+)\s+months?', 'months'),
        (r'excluded\s+for\s+(\d+)\s+months?', 'months'),

        # Additional employment and coverage patterns
        (r'available\s+after\s+(\d+)\s+months?\s+of\s+employment', 'months'),
        (r'benefits?\s+start\s+(\d+)\s+months?\s+after', 'months'),
        (r'coverage\s+starts?\s+(\d+)\s+months?\s+after', 'months'),
        (r'(\d+)\s+months?\s+after\s+enrollment', 'months'),
        (r'(\d+)\s+days?\s+after\s+enrollment', 'days'),
        (r'after\s+(\d+)\s+days?\s+of\s+employment', 'days'),
        (r'(\d+)\s+days?\s+after\s+enrollment', 'days'),
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print("-" * 40)
        
        text = test_case['text'].lower()
        
        # Test pattern matching
        detected_periods = []

        print(f"   Testing text: '{text}'")

        for pattern, time_unit in waiting_period_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                time_value = int(match.group(1))
                
                # Convert days to months for consistency
                if time_unit == 'days':
                    months_equivalent = max(1, round(time_value / 30))
                    time_display = f"{time_value} days (~{months_equivalent} month{'s' if months_equivalent != 1 else ''})"
                else:
                    months_equivalent = time_value
                    time_display = f"{time_value} month{'s' if time_value != 1 else ''}"
                
                # Extract context around the match for analysis
                context_start = max(0, match.start() - 100)
                context_end = min(len(text), match.end() + 100)
                context = text[context_start:context_end]
                
                # Analyze the context
                severity, flag_type, title, description = _analyze_waiting_period_context(
                    context, time_display, months_equivalent
                )
                
                detected_periods.append({
                    'severity': severity,
                    'flag_type': flag_type,
                    'title': title,
                    'description': description,
                    'months_equivalent': months_equivalent,
                    'matched_text': match.group()
                })
        
        # Check results
        if detected_periods:
            # Sort by severity and take the worst one
            severity_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
            detected_periods.sort(
                key=lambda x: (severity_order.get(x['severity'], 0), x['months_equivalent']),
                reverse=True
            )
            
            best_match = detected_periods[0]
            
            print(f"📍 Detected: {best_match['title']}")
            print(f"   Severity: {best_match['severity']}")
            print(f"   Matched: '{best_match['matched_text']}'")
            print(f"   Description: {best_match['description'][:100]}...")
            
            # Check if severity matches expected
            if best_match['severity'] == test_case['expected_severity']:
                print("✅ PASS: Severity matches expected")
            else:
                print(f"❌ FAIL: Expected severity '{test_case['expected_severity']}', got '{best_match['severity']}'")
            
            # Check if title contains expected keywords
            if test_case['expected_title_contains'].lower() in best_match['title'].lower():
                print("✅ PASS: Title contains expected keywords")
            else:
                print(f"❌ FAIL: Expected title to contain '{test_case['expected_title_contains']}', got '{best_match['title']}'")
                
        else:
            print(f"❌ FAIL: No waiting period detected in text: '{test_case['text']}'")
    
    print("\n" + "=" * 60)
    print("🎯 Pattern Test Summary Complete")

def test_specific_patterns():
    """Test specific regex patterns to ensure they work correctly"""
    
    print("\n🔍 Testing Specific Regex Patterns")
    print("=" * 60)
    
    pattern_tests = [
        {
            "pattern": r'(\d+)-?month\s+waiting\s+period',
            "test_strings": [
                "12-month waiting period",
                "6 month waiting period", 
                "3-month waiting period"
            ],
            "should_match": True
        },
        {
            "pattern": r'(\d+)\s+days?\s+wait(?:ing)?',
            "test_strings": [
                "90 days waiting",
                "30 day wait",
                "180 days wait"
            ],
            "should_match": True
        },
        {
            "pattern": r'eligible\s+after\s+(\d+)\s+months?',
            "test_strings": [
                "eligible after 3 months",
                "eligible after 6 month",
                "become eligible after 12 months"
            ],
            "should_match": True
        }
    ]
    
    for i, test in enumerate(pattern_tests, 1):
        print(f"\n{i}. Testing pattern: {test['pattern']}")
        print("-" * 30)
        
        for test_string in test['test_strings']:
            match = re.search(test['pattern'], test_string, re.IGNORECASE)
            if match and test['should_match']:
                print(f"✅ PASS: '{test_string}' -> matched '{match.group()}' (value: {match.group(1)})")
            elif not match and not test['should_match']:
                print(f"✅ PASS: '{test_string}' -> no match (as expected)")
            else:
                print(f"❌ FAIL: '{test_string}' -> unexpected result")

if __name__ == "__main__":
    test_waiting_period_patterns()
    test_specific_patterns()
