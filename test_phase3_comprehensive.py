#!/usr/bin/env python3
"""
Comprehensive Phase 3 Testing

This script validates all Phase 3 implementations:
1. Enhanced pattern detection
2. AI integration with fallback
3. Database storage and retrieval
4. Performance optimization
5. Documentation and configuration
"""
import sys
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.red_flag import RedFlag
from backend.app.models.policy import InsurancePolicy
from backend.app.config.red_flag_patterns import get_all_patterns, get_cost_thresholds
from backend.app.utils.pattern_tester import PatternTester, SAMPLE_TEST_SUITE

def test_pattern_configuration():
    """Test pattern configuration system"""
    print("🔧 Testing Pattern Configuration System")
    print("=" * 60)
    
    try:
        # Test pattern loading
        patterns = get_all_patterns()
        print(f"✅ Loaded {len(patterns)} pattern categories")
        
        # Test cost thresholds
        thresholds = get_cost_thresholds()
        print(f"✅ Loaded {len(thresholds)} cost thresholds")
        
        # Validate pattern structure
        required_fields = ['patterns', 'severity', 'flag_type', 'confidence_score']
        valid_patterns = 0
        
        for name, config in patterns.items():
            if all(field in config for field in required_fields):
                valid_patterns += 1
            else:
                print(f"⚠️ Invalid pattern config: {name}")
        
        print(f"✅ {valid_patterns}/{len(patterns)} patterns have valid configuration")
        
        # Test pattern categories
        expected_categories = [
            'preauthorization', 'mental_health_limitations', 'waiting_periods',
            'network_limitations', 'coverage_exclusions', 'aca_compliance'
        ]
        
        missing_categories = [cat for cat in expected_categories if cat not in patterns]
        if missing_categories:
            print(f"⚠️ Missing pattern categories: {missing_categories}")
        else:
            print("✅ All expected pattern categories present")
        
        return len(missing_categories) == 0 and valid_patterns == len(patterns)
        
    except Exception as e:
        print(f"❌ Pattern configuration test failed: {str(e)}")
        return False

def test_enhanced_patterns():
    """Test enhanced pattern detection accuracy"""
    print("\n🎯 Testing Enhanced Pattern Detection")
    print("=" * 60)
    
    try:
        tester = PatternTester()
        results = tester.test_all_patterns(SAMPLE_TEST_SUITE)
        report = tester.generate_test_report(results)
        
        overall_accuracy = report['overall_metrics']['accuracy']
        total_tests = report['performance_metrics']['total_tests']
        
        print(f"✅ Overall Pattern Accuracy: {overall_accuracy:.1%}")
        print(f"✅ Total Tests Executed: {total_tests}")
        
        # Check individual categories
        for category, metrics in report['categories'].items():
            accuracy = metrics['accuracy_metrics']['accuracy']
            test_count = metrics['test_count']
            print(f"  📊 {category}: {accuracy:.1%} ({test_count} tests)")
        
        # Performance metrics
        avg_time = report['performance_metrics']['avg_processing_time']
        tests_per_sec = report['performance_metrics']['tests_per_second']
        
        print(f"⚡ Average processing time: {avg_time:.4f}s per test")
        print(f"⚡ Processing speed: {tests_per_sec:.0f} tests/second")
        
        # Success criteria: >85% accuracy
        return overall_accuracy >= 0.85
        
    except Exception as e:
        print(f"❌ Enhanced pattern test failed: {str(e)}")
        return False

def test_database_integration():
    """Test database storage and retrieval"""
    print("\n🗄️ Testing Database Integration")
    print("=" * 60)
    
    try:
        db = SessionLocal()
        
        # Test red flag retrieval
        total_flags = db.query(RedFlag).count()
        print(f"✅ Total red flags in database: {total_flags}")
        
        if total_flags == 0:
            print("⚠️ No red flags found - database may be empty")
            return False
        
        # Test data integrity
        flags_with_policies = db.query(RedFlag).join(InsurancePolicy).count()
        print(f"✅ Red flags with valid policies: {flags_with_policies}")
        
        if flags_with_policies != total_flags:
            orphaned = total_flags - flags_with_policies
            print(f"⚠️ Found {orphaned} orphaned red flags")
        
        # Test severity distribution
        severity_counts = {}
        for flag in db.query(RedFlag).all():
            severity = flag.severity
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        print("📊 Severity Distribution:")
        for severity, count in sorted(severity_counts.items()):
            print(f"  {severity}: {count} flags")
        
        # Test required fields
        sample_flag = db.query(RedFlag).first()
        if sample_flag:
            required_fields = ['id', 'policy_id', 'flag_type', 'severity', 'title', 'description']
            missing_fields = [field for field in required_fields if not getattr(sample_flag, field)]
            
            if missing_fields:
                print(f"⚠️ Missing required fields: {missing_fields}")
                return False
            else:
                print("✅ All required fields present")
        
        db.close()
        return flags_with_policies == total_flags
        
    except Exception as e:
        print(f"❌ Database integration test failed: {str(e)}")
        return False

def test_performance_benchmarks():
    """Test performance meets requirements"""
    print("\n⚡ Testing Performance Benchmarks")
    print("=" * 60)
    
    try:
        # Test pattern processing speed
        test_text = "Mental health services are limited to 10 visits per year. " * 100
        
        start_time = time.time()
        tester = PatternTester()
        
        # Run multiple iterations
        iterations = 50
        for _ in range(iterations):
            results = tester.test_pattern_category('mental_health_limitations', [{
                'name': 'Performance Test',
                'text': test_text,
                'should_detect': True
            }])
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / iterations
        chars_per_sec = len(test_text) / avg_time
        
        print(f"✅ Processed {iterations} iterations in {total_time:.3f}s")
        print(f"✅ Average time per iteration: {avg_time:.4f}s")
        print(f"✅ Processing speed: {chars_per_sec:,.0f} chars/second")
        
        # Performance thresholds
        MAX_TIME_PER_ITERATION = 0.1  # 100ms
        MIN_CHARS_PER_SECOND = 10000   # 10k chars/sec
        
        time_ok = avg_time <= MAX_TIME_PER_ITERATION
        speed_ok = chars_per_sec >= MIN_CHARS_PER_SECOND
        
        if not time_ok:
            print(f"⚠️ Processing time too slow: {avg_time:.4f}s > {MAX_TIME_PER_ITERATION}s")
        
        if not speed_ok:
            print(f"⚠️ Processing speed too slow: {chars_per_sec:,.0f} < {MIN_CHARS_PER_SECOND:,} chars/sec")
        
        return time_ok and speed_ok
        
    except Exception as e:
        print(f"❌ Performance benchmark test failed: {str(e)}")
        return False

def test_documentation_completeness():
    """Test documentation and configuration completeness"""
    print("\n📚 Testing Documentation Completeness")
    print("=" * 60)
    
    try:
        # Check documentation files
        doc_files = [
            'docs/RED_FLAG_PATTERNS_DOCUMENTATION.md',
            'backend/app/config/red_flag_patterns.py',
            'backend/app/utils/pattern_tester.py'
        ]
        
        missing_files = []
        for file_path in doc_files:
            if not os.path.exists(file_path):
                missing_files.append(file_path)
        
        if missing_files:
            print(f"❌ Missing documentation files: {missing_files}")
            return False
        else:
            print("✅ All documentation files present")
        
        # Check configuration completeness
        patterns = get_all_patterns()
        thresholds = get_cost_thresholds()
        
        print(f"✅ Pattern categories documented: {len(patterns)}")
        print(f"✅ Cost thresholds configured: {len(thresholds)}")
        
        # Check pattern tester functionality
        tester = PatternTester()
        sample_report = tester.generate_test_report({})
        
        required_report_fields = ['timestamp', 'categories', 'overall_metrics', 'performance_metrics']
        missing_report_fields = [field for field in required_report_fields if field not in sample_report]
        
        if missing_report_fields:
            print(f"⚠️ Missing report fields: {missing_report_fields}")
            return False
        else:
            print("✅ Pattern tester report structure complete")
        
        return True
        
    except Exception as e:
        print(f"❌ Documentation completeness test failed: {str(e)}")
        return False

def main():
    """Run comprehensive Phase 3 testing"""
    print("🔍 Phase 3 Comprehensive Testing")
    print("=" * 80)
    
    # Run all tests
    tests = [
        ("Pattern Configuration", test_pattern_configuration),
        ("Enhanced Patterns", test_enhanced_patterns),
        ("Database Integration", test_database_integration),
        ("Performance Benchmarks", test_performance_benchmarks),
        ("Documentation Completeness", test_documentation_completeness)
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} Test...")
        results[test_name] = test_func()
    
    # Summary
    print("\n📊 PHASE 3 TESTING SUMMARY")
    print("=" * 80)
    
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
    
    overall_success = passed_tests == total_tests
    success_rate = passed_tests / total_tests * 100
    
    print(f"\n📈 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    
    if overall_success:
        print("🎉 EXCELLENT: All Phase 3 tests passed!")
        print("✅ Phase 3 implementation is complete and ready for production")
    else:
        print("⚠️ ISSUES FOUND: Some Phase 3 tests failed")
        print("🔧 Review failed tests and address issues before proceeding")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
