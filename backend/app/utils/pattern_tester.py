"""
Pattern Testing Utility

This module provides utilities for testing and validating red flag patterns
against sample documents and maintaining pattern accuracy.
"""

import re
import json
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

from ..config.red_flag_patterns import (
    RED_FLAG_PATTERNS, 
    get_pattern_config, 
    get_all_patterns,
    Severity,
    FlagType
)

class PatternTestResult:
    """Container for pattern test results"""
    
    def __init__(self, pattern_name: str, test_case: str):
        self.pattern_name = pattern_name
        self.test_case = test_case
        self.matches = []
        self.detected = False
        self.expected = None
        self.correct = None
        self.processing_time = 0.0
        self.confidence_score = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'pattern_name': self.pattern_name,
            'test_case': self.test_case,
            'detected': self.detected,
            'expected': self.expected,
            'correct': self.correct,
            'matches': self.matches,
            'processing_time': self.processing_time,
            'confidence_score': self.confidence_score
        }

class PatternTester:
    """Main pattern testing class"""
    
    def __init__(self):
        self.patterns = get_all_patterns()
        self.test_results = []
    
    def test_pattern_category(self, category_name: str, test_cases: List[Dict[str, Any]]) -> List[PatternTestResult]:
        """Test a specific pattern category against test cases"""
        
        if category_name not in self.patterns:
            raise ValueError(f"Pattern category '{category_name}' not found")
        
        pattern_config = self.patterns[category_name]
        patterns = pattern_config.get('patterns', [])
        
        results = []
        
        for test_case in test_cases:
            result = PatternTestResult(category_name, test_case.get('name', 'Unknown'))
            result.expected = test_case.get('should_detect', False)
            
            start_time = datetime.now()
            
            # Test each pattern in the category
            for pattern in patterns:
                try:
                    matches = list(re.finditer(pattern, test_case['text'], re.IGNORECASE))
                    if matches:
                        result.detected = True
                        result.matches.extend([{
                            'pattern': pattern,
                            'match': match.group(),
                            'start': match.start(),
                            'end': match.end(),
                            'groups': match.groups()
                        } for match in matches])
                        break  # Stop at first match for efficiency
                        
                except re.error as e:
                    print(f"Pattern error in {pattern}: {e}")
                    continue
            
            end_time = datetime.now()
            result.processing_time = (end_time - start_time).total_seconds()
            result.correct = result.detected == result.expected
            result.confidence_score = pattern_config.get('confidence_score', 0.0)
            
            results.append(result)
        
        return results
    
    def test_all_patterns(self, test_suite: Dict[str, List[Dict[str, Any]]]) -> Dict[str, List[PatternTestResult]]:
        """Test all patterns against a comprehensive test suite"""
        
        all_results = {}
        
        for category_name, test_cases in test_suite.items():
            if category_name in self.patterns:
                results = self.test_pattern_category(category_name, test_cases)
                all_results[category_name] = results
            else:
                print(f"Warning: No patterns found for category '{category_name}'")
        
        return all_results
    
    def calculate_accuracy_metrics(self, results: List[PatternTestResult]) -> Dict[str, float]:
        """Calculate accuracy metrics for test results"""
        
        if not results:
            return {'accuracy': 0.0, 'precision': 0.0, 'recall': 0.0, 'f1_score': 0.0}
        
        true_positives = sum(1 for r in results if r.detected and r.expected)
        false_positives = sum(1 for r in results if r.detected and not r.expected)
        false_negatives = sum(1 for r in results if not r.detected and r.expected)
        true_negatives = sum(1 for r in results if not r.detected and not r.expected)
        
        total = len(results)
        accuracy = (true_positives + true_negatives) / total if total > 0 else 0.0
        
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'true_positives': true_positives,
            'false_positives': false_positives,
            'false_negatives': false_negatives,
            'true_negatives': true_negatives
        }
    
    def generate_test_report(self, all_results: Dict[str, List[PatternTestResult]]) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'categories': {},
            'overall_metrics': {},
            'performance_metrics': {}
        }
        
        all_category_results = []
        total_processing_time = 0.0
        
        for category_name, results in all_results.items():
            metrics = self.calculate_accuracy_metrics(results)
            category_processing_time = sum(r.processing_time for r in results)
            
            report['categories'][category_name] = {
                'test_count': len(results),
                'accuracy_metrics': metrics,
                'processing_time': category_processing_time,
                'avg_processing_time': category_processing_time / len(results) if results else 0.0,
                'failed_cases': [r.test_case for r in results if not r.correct]
            }
            
            all_category_results.extend(results)
            total_processing_time += category_processing_time
        
        # Overall metrics
        overall_metrics = self.calculate_accuracy_metrics(all_category_results)
        report['overall_metrics'] = overall_metrics
        
        # Performance metrics
        report['performance_metrics'] = {
            'total_tests': len(all_category_results),
            'total_processing_time': total_processing_time,
            'avg_processing_time': total_processing_time / len(all_category_results) if all_category_results else 0.0,
            'tests_per_second': len(all_category_results) / total_processing_time if total_processing_time > 0 else 0.0
        }
        
        return report
    
    def save_test_report(self, report: Dict[str, Any], filename: str = None) -> str:
        """Save test report to file"""
        
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"pattern_test_report_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        return filename

# Sample test suite for validation
SAMPLE_TEST_SUITE = {
    "mental_health_limitations": [
        {
            "name": "Limited Mental Health Visits",
            "text": "Mental health services are limited to 10 visits per calendar year.",
            "should_detect": True
        },
        {
            "name": "Behavioral Health Limits", 
            "text": "Behavioral health treatment is limited to 12 sessions annually.",
            "should_detect": True
        },
        {
            "name": "No Mental Health Limitations",
            "text": "Mental health services are covered in full with no visit limitations.",
            "should_detect": False
        }
    ],
    "preauthorization": [
        {
            "name": "Standard Pre-authorization",
            "text": "Pre-authorization is required for all specialist visits.",
            "should_detect": True
        },
        {
            "name": "Out-of-Network Authorization",
            "text": "Out-of-network services require prior authorization.",
            "should_detect": True
        },
        {
            "name": "No Authorization Required",
            "text": "No prior authorization is required for covered services.",
            "should_detect": False
        }
    ],
    "waiting_periods": [
        {
            "name": "12-Month Maternity Waiting Period",
            "text": "There is a 12-month waiting period for maternity benefits.",
            "should_detect": True
        },
        {
            "name": "No Waiting Period",
            "text": "Coverage begins immediately upon enrollment.",
            "should_detect": False
        }
    ]
}

def run_sample_tests() -> Dict[str, Any]:
    """Run sample tests and return results"""
    tester = PatternTester()
    results = tester.test_all_patterns(SAMPLE_TEST_SUITE)
    report = tester.generate_test_report(results)
    return report

def validate_pattern_performance(min_accuracy: float = 0.85) -> bool:
    """Validate that patterns meet minimum performance requirements"""
    report = run_sample_tests()
    overall_accuracy = report['overall_metrics']['accuracy']
    return overall_accuracy >= min_accuracy

if __name__ == "__main__":
    # Run sample tests when executed directly
    report = run_sample_tests()
    print("Pattern Test Report:")
    print(f"Overall Accuracy: {report['overall_metrics']['accuracy']:.2%}")
    print(f"Total Tests: {report['performance_metrics']['total_tests']}")
    print(f"Processing Time: {report['performance_metrics']['total_processing_time']:.3f}s")
    
    # Save report
    filename = PatternTester().save_test_report(report)
    print(f"Report saved to: {filename}")
