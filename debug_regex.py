#!/usr/bin/env python3
"""
Debug regex patterns for cost detection
"""
import re

def test_deductible_patterns():
    test_text = """
    DEDUCTIBLE INFORMATION
    Individual Deductible: $8,500
    Family Deductible: $17,000
    You must pay this amount before insurance coverage begins.
    """
    
    patterns = [
        (r'individual\s+deductible[:\s]+\$?([\d,]+)', 'individual'),
        (r'family\s+deductible[:\s]+\$?([\d,]+)', 'family'),
    ]
    
    print("Testing deductible patterns:")
    print(f"Text: {test_text}")
    
    for pattern, deductible_type in patterns:
        print(f"\nPattern: {pattern}")
        matches = re.finditer(pattern, test_text.lower(), re.IGNORECASE)
        for match in matches:
            print(f"  Match: '{match.group()}' -> Amount: '{match.group(1)}'")
            amount_str = match.group(1).replace(',', '')
            amount = int(amount_str)
            print(f"  Parsed amount: {amount}")

def test_copay_patterns():
    test_text = """
    COPAY SCHEDULE
    Primary Care Visit: $60 copay
    Specialist Visit: $80 copay
    Emergency Room: $400 copay
    """
    
    patterns = [
        (r'primary\s+care.*?[:\s]+\$?(\d+)\s*copay', 'primary'),
        (r'specialist.*?[:\s]+\$?(\d+)\s*copay', 'specialist'),
        (r'emergency\s+room.*?[:\s]+\$?(\d+)\s*copay', 'emergency'),
    ]
    
    print("\n\nTesting copay patterns:")
    print(f"Text: {test_text}")
    
    for pattern, service_type in patterns:
        print(f"\nPattern: {pattern}")
        matches = re.finditer(pattern, test_text.lower(), re.IGNORECASE)
        for match in matches:
            print(f"  Match: '{match.group()}' -> Amount: '{match.group(1)}'")

if __name__ == "__main__":
    test_deductible_patterns()
    test_copay_patterns()
