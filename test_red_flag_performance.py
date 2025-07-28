#!/usr/bin/env python3
"""
Test script for red flag detection performance
"""
import sys
import os
import time
import uuid
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.document import PolicyDocument
from backend.app.models.policy import InsurancePolicy
from backend.app.models.red_flag import RedFlag
from backend.app.services.policy_service import analyze_policy_and_generate_benefits_flags

def create_large_test_document(size_multiplier=1):
    """Create a large test document for performance testing"""
    
    base_text = """
    GoldCare Employee Health Plan - Comprehensive Coverage Document
    
    COVERAGE LIMITATIONS AND EXCLUSIONS:
    - Mental health services are limited to 10 visits per year unless medically necessary
    - Behavioral health treatment is limited to 12 sessions annually
    - Therapy visits are restricted to 8 sessions per year unless medically necessary
    - Maternity benefits have a 12-month waiting period from enrollment date
    - Pregnancy coverage requires a 6-month waiting period for new enrollees
    - Out-of-network services require prior authorization and pre-approval
    - Specialist visits require pre-authorization from primary care physician
    - Cosmetic procedures are excluded from coverage except when medically necessary
    - Experimental treatments and investigational procedures are not covered
    - Infertility treatment and fertility services are excluded from coverage
    
    COST SHARING REQUIREMENTS:
    - Annual deductible: $8,500 (individual), $17,000 (family)
    - Coinsurance: 60% after deductible for most services
    - Out-of-pocket maximum: $15,000 (individual), $30,000 (family)
    - Primary care copay: $250 per visit
    - Specialist copay: $500 per visit
    - Emergency room copay: $1,000 per visit
    - Prescription drug deductible: $2,500 separate from medical deductible
    
    NETWORK RESTRICTIONS:
    - Narrow network with limited provider choices in most areas
    - Out-of-network providers covered at 60% coinsurance after deductible
    - Referrals required for all specialist visits and procedures
    - Emergency services excluded from coverage (non-ACA compliant provision)
    - Mental health services excluded from network coverage
    - Prescription drugs excluded from formulary coverage
    
    ADMINISTRATIVE REQUIREMENTS:
    - Appeals must be filed within 15 days of denial notification
    - Three levels of appeals required before external review
    - Appeals must be notarized and submitted with supporting documentation
    - Coverage subject to change with 30 days notice to enrollees
    - Benefits may be modified or terminated at plan discretion
    
    ACA COMPLIANCE ISSUES:
    - This is a short-term medical plan that is not ACA-compliant
    - Pre-existing conditions may be excluded from coverage
    - Annual benefit limit: $50,000 maximum per year
    - Essential health benefits may not be fully covered
    - Mental health parity requirements may not apply
    
    ADDITIONAL LIMITATIONS:
    - Waiting periods apply to most specialty services
    - Prior authorization required for imaging, surgery, and procedures
    - Coverage limitations apply to chronic condition management
    - Preventive care may require copayments and deductibles
    - Prescription drug coverage limited to generic medications only
    """
    
    # Multiply the text to create larger documents
    large_text = base_text * size_multiplier
    return large_text

def test_single_document_performance():
    """Test performance with a single large document"""
    print("📄 Testing Single Document Performance")
    print("=" * 60)
    
    # Test with different document sizes
    sizes = [1, 3, 5, 10]  # Multipliers for document size
    results = []
    
    for size in sizes:
        print(f"\nTesting document size: {size}x base size")
        
        # Create test document
        test_text = create_large_test_document(size)
        text_length = len(test_text)
        
        # Create mock objects
        class MockPolicy:
            def __init__(self):
                self.id = uuid.uuid4()
        
        class MockDocument:
            def __init__(self, text):
                self.extracted_text = text
        
        policy = MockPolicy()
        document = MockDocument(test_text)
        
        # Measure performance
        start_time = time.time()
        
        db = SessionLocal()
        try:
            # Count initial red flags
            initial_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
            
            # Run analysis
            analyze_policy_and_generate_benefits_flags(db, policy, document)
            
            # Count final red flags
            final_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
            detected_count = final_count - initial_count
            
            db.commit()
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            db.rollback()
            detected_count = 0
        finally:
            db.close()
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Calculate metrics
        chars_per_second = text_length / processing_time if processing_time > 0 else 0
        flags_per_second = detected_count / processing_time if processing_time > 0 else 0
        
        result = {
            'size_multiplier': size,
            'text_length': text_length,
            'processing_time': processing_time,
            'detected_flags': detected_count,
            'chars_per_second': chars_per_second,
            'flags_per_second': flags_per_second
        }
        results.append(result)
        
        print(f"  📊 Text length: {text_length:,} characters")
        print(f"  ⏱️ Processing time: {processing_time:.3f} seconds")
        print(f"  🚩 Red flags detected: {detected_count}")
        print(f"  📈 Processing speed: {chars_per_second:,.0f} chars/sec")
    
    return results

def test_multiple_documents_performance():
    """Test performance with multiple documents"""
    print("\n📚 Testing Multiple Documents Performance")
    print("=" * 60)
    
    # Test with different numbers of documents
    document_counts = [1, 3, 5, 10]
    results = []
    
    for count in document_counts:
        print(f"\nTesting {count} documents")
        
        start_time = time.time()
        total_flags = 0
        total_chars = 0
        
        for i in range(count):
            # Create test document
            test_text = create_large_test_document(2)  # 2x base size
            total_chars += len(test_text)
            
            # Create mock objects
            class MockPolicy:
                def __init__(self):
                    self.id = uuid.uuid4()
            
            class MockDocument:
                def __init__(self, text):
                    self.extracted_text = text
            
            policy = MockPolicy()
            document = MockDocument(test_text)
            
            db = SessionLocal()
            try:
                # Count initial red flags
                initial_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
                
                # Run analysis
                analyze_policy_and_generate_benefits_flags(db, policy, document)
                
                # Count final red flags
                final_count = db.query(RedFlag).filter(RedFlag.policy_id == policy.id).count()
                detected_count = final_count - initial_count
                total_flags += detected_count
                
                db.commit()
                
            except Exception as e:
                print(f"  ❌ Error on document {i+1}: {str(e)}")
                db.rollback()
            finally:
                db.close()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Calculate metrics
        avg_time_per_doc = total_time / count if count > 0 else 0
        total_chars_per_second = total_chars / total_time if total_time > 0 else 0
        
        result = {
            'document_count': count,
            'total_time': total_time,
            'avg_time_per_doc': avg_time_per_doc,
            'total_flags': total_flags,
            'total_chars': total_chars,
            'chars_per_second': total_chars_per_second
        }
        results.append(result)
        
        print(f"  📊 Total characters: {total_chars:,}")
        print(f"  ⏱️ Total time: {total_time:.3f} seconds")
        print(f"  📄 Avg time per document: {avg_time_per_doc:.3f} seconds")
        print(f"  🚩 Total flags detected: {total_flags}")
        print(f"  📈 Processing speed: {total_chars_per_second:,.0f} chars/sec")
    
    return results

def analyze_performance_results(single_results, multiple_results):
    """Analyze and report performance results"""
    print("\n📊 PERFORMANCE ANALYSIS")
    print("=" * 60)
    
    # Single document analysis
    print("Single Document Performance:")
    for result in single_results:
        size = result['size_multiplier']
        time_taken = result['processing_time']
        speed = result['chars_per_second']
        flags = result['detected_flags']
        
        print(f"  Size {size}x: {time_taken:.3f}s, {speed:,.0f} chars/sec, {flags} flags")
    
    # Multiple document analysis
    print("\nMultiple Document Performance:")
    for result in multiple_results:
        count = result['document_count']
        total_time = result['total_time']
        avg_time = result['avg_time_per_doc']
        speed = result['chars_per_second']
        
        print(f"  {count} docs: {total_time:.3f}s total, {avg_time:.3f}s avg, {speed:,.0f} chars/sec")
    
    # Performance benchmarks
    print("\nPerformance Benchmarks:")
    
    # Check if processing meets requirements
    fastest_single = min(single_results, key=lambda x: x['processing_time'])
    slowest_single = max(single_results, key=lambda x: x['processing_time'])
    
    print(f"  Fastest single document: {fastest_single['processing_time']:.3f}s")
    print(f"  Slowest single document: {slowest_single['processing_time']:.3f}s")
    
    # Performance thresholds (adjust as needed)
    SINGLE_DOC_THRESHOLD = 5.0  # seconds
    CHARS_PER_SEC_THRESHOLD = 10000  # characters per second
    
    performance_issues = []
    
    if slowest_single['processing_time'] > SINGLE_DOC_THRESHOLD:
        performance_issues.append(f"Single document processing too slow: {slowest_single['processing_time']:.3f}s > {SINGLE_DOC_THRESHOLD}s")
    
    avg_speed = sum(r['chars_per_second'] for r in single_results) / len(single_results)
    if avg_speed < CHARS_PER_SEC_THRESHOLD:
        performance_issues.append(f"Average processing speed too slow: {avg_speed:,.0f} < {CHARS_PER_SEC_THRESHOLD:,} chars/sec")
    
    if performance_issues:
        print("\n⚠️ Performance Issues:")
        for issue in performance_issues:
            print(f"  - {issue}")
        return False
    else:
        print("\n✅ All performance benchmarks met!")
        return True

def main():
    print("🔍 Red Flag Detection Performance Testing")
    print("=" * 80)
    
    # Run performance tests
    single_results = test_single_document_performance()
    multiple_results = test_multiple_documents_performance()
    
    # Analyze results
    performance_ok = analyze_performance_results(single_results, multiple_results)
    
    # Summary
    print("\n📊 PERFORMANCE TESTING SUMMARY")
    print("=" * 80)
    
    if performance_ok:
        print("🎉 EXCELLENT: Red flag detection performance meets requirements!")
    else:
        print("⚠️ OPTIMIZATION NEEDED: Performance improvements recommended")
    
    return performance_ok

if __name__ == "__main__":
    main()
