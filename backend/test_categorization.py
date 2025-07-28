#!/usr/bin/env python3
"""
Test script for categorization system
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.categorization_service import categorization_service
from app.models.benefit import CoverageBenefit
from app.models.red_flag import RedFlag

def test_benefit_categorization():
    """Test benefit categorization"""
    print("Testing Benefit Categorization...")
    
    # Create a test benefit
    benefit = CoverageBenefit(
        benefit_category="preventive",
        benefit_name="Annual Physical Exam",
        coverage_percentage=100,
        notes="Covered under ACA preventive care provisions"
    )
    
    # Test categorization
    categorization = categorization_service.categorize_benefit(benefit)
    print(f"Benefit: {benefit.benefit_name}")
    print(f"Categorization: {categorization}")
    
    # Test visual indicators
    visual_indicators = categorization_service.get_visual_indicators(categorization)
    print(f"Visual Indicators: {visual_indicators}")
    print()

def test_red_flag_categorization():
    """Test red flag categorization"""
    print("Testing Red Flag Categorization...")
    
    # Create a test red flag
    red_flag = RedFlag(
        flag_type="coverage_gap",
        severity="high",
        title="Mental Health Coverage Limitation",
        description="Plan limits mental health visits to 6 per year",
        source_text="Mental health services are limited to 6 visits per calendar year"
    )
    
    # Test categorization
    categorization = categorization_service.categorize_red_flag(red_flag)
    print(f"Red Flag: {red_flag.title}")
    print(f"Categorization: {categorization}")
    
    # Test visual indicators
    visual_indicators = categorization_service.get_visual_indicators(categorization)
    print(f"Visual Indicators: {visual_indicators}")
    print()

def test_pattern_matching():
    """Test pattern matching"""
    print("Testing Pattern Matching...")
    
    test_cases = [
        {
            'type': 'benefit',
            'text': 'Emergency room visits covered at 80%',
            'expected_category': 'coverage_access'
        },
        {
            'type': 'red_flag', 
            'text': 'Maternity care excluded from coverage',
            'expected_category': 'special_populations'
        },
        {
            'type': 'red_flag',
            'text': 'Prior authorization required for all specialist visits',
            'expected_category': 'process_administrative'
        }
    ]
    
    for case in test_cases:
        if case['type'] == 'benefit':
            benefit = CoverageBenefit(
                benefit_category="test",
                benefit_name=case['text'],
                notes=case['text']
            )
            result = categorization_service.categorize_benefit(benefit)
        else:
            red_flag = RedFlag(
                flag_type="test",
                severity="medium",
                title=case['text'],
                description=case['text']
            )
            result = categorization_service.categorize_red_flag(red_flag)
        
        print(f"Text: {case['text']}")
        print(f"Expected Category: {case['expected_category']}")
        print(f"Actual Category: {result.get('prominent_category', 'None')}")
        print(f"Match: {'✓' if result.get('prominent_category') == case['expected_category'] else '✗'}")
        print()

if __name__ == "__main__":
    print("=" * 60)
    print("CATEGORIZATION SYSTEM TEST")
    print("=" * 60)
    
    try:
        test_benefit_categorization()
        test_red_flag_categorization()
        test_pattern_matching()
        
        print("=" * 60)
        print("All tests completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()
