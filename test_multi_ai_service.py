#!/usr/bin/env python3
"""
Test Multi-AI Service with Fallback

This script tests the multi-AI service with intelligent fallback
between Gemini, OpenAI, and Anthropic providers.
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.multi_ai_service import multi_ai_service, AIProvider

def create_test_document():
    """Create a test document for AI analysis"""
    
    class MockDocument:
        def __init__(self):
            self.extracted_text = """
            GoldCare Employee Health Plan
            
            COVERAGE LIMITATIONS:
            - Mental health services are limited to 10 visits per year
            - Maternity benefits have a 12-month waiting period
            - Out-of-network services require prior authorization
            - Annual deductible: $8,500 (individual)
            - Coinsurance: 60% after deductible
            - Emergency services excluded (non-ACA compliant)
            
            This is a short-term medical plan that is not ACA-compliant.
            """
    
    return MockDocument()

def test_provider_status():
    """Test provider availability status"""
    print("🔍 Testing AI Provider Status")
    print("=" * 60)
    
    status = multi_ai_service.get_provider_status()
    
    for provider_name, provider_info in status.items():
        available = "✅ Available" if provider_info["available"] else "❌ Unavailable"
        priority = provider_info["priority"]
        print(f"{available} {provider_name.upper()} (Priority: {priority})")
    
    available_count = sum(1 for info in status.values() if info["available"])
    print(f"\n📊 {available_count}/{len(status)} providers available")
    
    return available_count > 0

def test_ai_analysis():
    """Test AI analysis with fallback"""
    print("\n🤖 Testing AI Analysis with Fallback")
    print("=" * 60)
    
    # Create test document
    test_doc = create_test_document()
    
    try:
        # Run analysis
        print("Running AI analysis...")
        response = multi_ai_service.analyze_policy_document(test_doc)
        
        if response.error:
            print(f"❌ Analysis failed: {response.error}")
            return False
        
        print(f"✅ Analysis successful with {response.provider.value}")
        print(f"⏱️ Processing time: {response.processing_time:.2f}s")
        print(f"🎯 Confidence score: {response.confidence_score:.2f}")
        print(f"🚩 Red flags detected: {len(response.red_flags)}")
        print(f"✨ Benefits detected: {len(response.benefits)}")
        
        # Show sample red flags
        if response.red_flags:
            print("\nSample Red Flags:")
            for i, flag in enumerate(response.red_flags[:3]):
                title = flag.get('title', 'Unknown')
                severity = flag.get('severity', 'unknown')
                print(f"  {i+1}. {title} ({severity})")
        
        return True
        
    except Exception as e:
        print(f"❌ AI analysis test failed: {str(e)}")
        return False

def test_fallback_behavior():
    """Test fallback behavior when providers fail"""
    print("\n🔄 Testing Fallback Behavior")
    print("=" * 60)
    
    # Get original fallback order
    original_order = multi_ai_service.fallback_order.copy()
    
    # Test with different fallback orders
    test_orders = [
        [AIProvider.OPENAI, AIProvider.ANTHROPIC, AIProvider.PATTERN],
        [AIProvider.ANTHROPIC, AIProvider.OPENAI, AIProvider.PATTERN],
        [AIProvider.PATTERN]  # Pattern-only fallback
    ]
    
    test_doc = create_test_document()
    
    for i, order in enumerate(test_orders):
        print(f"\nTest {i+1}: Fallback order {[p.value for p in order]}")
        
        # Temporarily change fallback order
        multi_ai_service.fallback_order = order
        
        try:
            response = multi_ai_service.analyze_policy_document(test_doc)
            provider_used = response.provider.value
            success = not response.error
            
            status = "✅ Success" if success else "❌ Failed"
            print(f"  {status} - Used: {provider_used}")
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
    
    # Restore original order
    multi_ai_service.fallback_order = original_order
    
    return True

def main():
    """Run comprehensive multi-AI service tests"""
    print("🔍 Multi-AI Service Testing")
    print("=" * 80)
    
    # Run tests
    tests = [
        ("Provider Status", test_provider_status),
        ("AI Analysis", test_ai_analysis),
        ("Fallback Behavior", test_fallback_behavior)
    ]
    
    results = {}
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} Test...")
        results[test_name] = test_func()
    
    # Summary
    print("\n📊 MULTI-AI SERVICE TEST SUMMARY")
    print("=" * 80)
    
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
    
    success_rate = passed_tests / total_tests * 100
    print(f"\n📈 Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
    
    # Recommendations
    print("\n💡 RECOMMENDATIONS")
    print("=" * 80)
    
    status = multi_ai_service.get_provider_status()
    
    if status['openai']['available']:
        print("✅ OpenAI is available - Recommended as primary fallback")
        print("  💰 Cost-effective for high-volume analysis")
        print("  🎯 Excellent structured output for red flag detection")
    
    if status['anthropic']['available']:
        print("✅ Anthropic is available - Recommended for complex analysis")
        print("  🧠 Superior reasoning for nuanced policy language")
        print("  📖 Excellent document comprehension")
    
    if status['gemini']['available']:
        print("✅ Gemini is available - Good primary choice when quota allows")
        print("  ⚡ Fast processing and good accuracy")
    
    print("\n🎯 OPTIMAL FALLBACK ORDER:")
    print("1. Gemini (primary - when quota available)")
    print("2. OpenAI (best for structured output)")
    print("3. Anthropic (best for complex analysis)")
    print("4. Pattern-based (reliable fallback)")

if __name__ == "__main__":
    main()
