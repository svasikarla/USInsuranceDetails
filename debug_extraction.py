#!/usr/bin/env python3
"""
Debug script for policy extraction

This script tests the policy extraction logic step by step to identify issues.
"""

import sys
import os
import uuid
import re
from decimal import Decimal
from datetime import date

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.utils.db import SessionLocal
    from app.models import PolicyDocument
    from app.services.ai_policy_extraction_service import ai_policy_extraction_service
except ImportError as e:
    print(f"❌ Import error: {str(e)}")
    sys.exit(1)


def test_pattern_extraction_on_real_data():
    """Test pattern extraction on real document data"""
    print("🔍 Testing Pattern Extraction on Real Data...")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get the real document
        document = db.query(PolicyDocument).filter(
            PolicyDocument.id == uuid.UUID("e177f655-02d3-484c-9f3c-cd9898c6b977")
        ).first()
        
        if not document:
            print("❌ Document not found")
            return False
        
        text = document.extracted_text
        print(f"📄 Document: {document.original_filename}")
        print(f"📝 Text Length: {len(text)} characters")
        print(f"\n📋 Full Text Content:")
        print("-" * 40)
        print(text)
        print("-" * 40)
        
        # Test enhanced pattern matching
        patterns = {
            'policy_name': r'(?:policy\s+name|plan\s+name):\s*([^\n\r]+)',
            'provider': r'provider:\s*([^\n\r]+)',
            'policy_type': r'(?:policy\s+type|plan\s+type):\s*([^\n\r]+)',
            'policy_number': r'policy\s+(?:number|#):\s*([a-z0-9-]+)',
            'deductible_individual': r'(?:annual\s+deductible|individual\s+deductible|deductible):\s*\$?([0-9,]+)',
            'premium_monthly': r'monthly\s+premium[:\s]*\$?([0-9,]+)',
            'premium_annual': r'annual\s+premium[:\s]*\$?([0-9,]+)',
            'out_of_pocket_max': r'out-of-pocket\s+maximum[:\s]*\$?([0-9,]+)',
            'start_date': r'(?:coverage\s+start\s+date|effective\s+date)[:\s]*([^\n\r]+)',
            'end_date': r'(?:coverage\s+end\s+date|expiration\s+date)[:\s]*([^\n\r]+)',
        }
        
        extracted_data = {}
        print(f"\n🔍 Pattern Matching Results:")
        
        for field, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                extracted_data[field] = value
                print(f"   ✅ {field}: {value}")
            else:
                print(f"   ❌ {field}: No match")
        
        print(f"\n📊 Summary:")
        print(f"   Fields Found: {len(extracted_data)}/{len(patterns)}")
        print(f"   Success Rate: {len(extracted_data)/len(patterns)*100:.1f}%")
        
        return len(extracted_data) > 0
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        db.close()


def test_ai_extraction_service():
    """Test the AI extraction service directly"""
    print(f"\n🤖 Testing AI Extraction Service...")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get the real document
        document = db.query(PolicyDocument).filter(
            PolicyDocument.id == uuid.UUID("e177f655-02d3-484c-9f3c-cd9898c6b977")
        ).first()
        
        if not document:
            print("❌ Document not found")
            return False
        
        print(f"📄 Document: {document.original_filename}")
        print(f"🔧 AI Service Available: {ai_policy_extraction_service.is_available}")
        
        # Test extraction
        result = ai_policy_extraction_service.extract_policy_data(document)
        
        print(f"\n📊 Extraction Results:")
        print(f"   Method: {result.extraction_method}")
        print(f"   Confidence: {result.extraction_confidence:.2f}")
        print(f"   Policy Name: {result.policy_name}")
        print(f"   Policy Type: {result.policy_type}")
        print(f"   Deductible: ${result.deductible_individual}")
        print(f"   Premium (Monthly): ${result.premium_monthly}")
        print(f"   Premium (Annual): ${result.premium_annual}")
        print(f"   Effective Date: {result.effective_date}")
        print(f"   Expiration Date: {result.expiration_date}")
        
        if result.extraction_errors:
            print(f"\n❌ Extraction Errors:")
            for error in result.extraction_errors:
                print(f"   - {error}")
        
        return result.extraction_confidence > 0.0
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def test_google_ai_connectivity():
    """Test Google AI API connectivity"""
    print(f"\n🌐 Testing Google AI Connectivity...")
    print("=" * 60)
    
    try:
        import google.generativeai as genai
        from app.core.config import settings
        
        print(f"🔑 API Key Available: {hasattr(settings, 'GOOGLE_AI_API_KEY') and bool(settings.GOOGLE_AI_API_KEY)}")
        
        if hasattr(settings, 'GOOGLE_AI_API_KEY') and settings.GOOGLE_AI_API_KEY:
            print(f"🔑 API Key Length: {len(settings.GOOGLE_AI_API_KEY)} characters")
            
            # Test basic API call
            genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            test_prompt = "Extract the following information from this text: 'Annual Premium: $5,000'. Return only the number."
            response = model.generate_content(test_prompt)
            
            print(f"✅ API Test Response: {response.text}")
            return True
        else:
            print(f"❌ No API key configured")
            return False
            
    except Exception as e:
        print(f"❌ Google AI Error: {str(e)}")
        return False


def main():
    """Run all debug tests"""
    print("🐛 Policy Extraction Debug Tool")
    print("=" * 80)
    
    tests = [
        ("Pattern Extraction on Real Data", test_pattern_extraction_on_real_data),
        ("AI Extraction Service", test_ai_extraction_service),
        ("Google AI Connectivity", test_google_ai_connectivity),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"\n{status}: {test_name}")
        except Exception as e:
            results.append((test_name, False))
            print(f"\n❌ FAILED: {test_name} - {str(e)}")
    
    # Summary
    print(f"\n{'=' * 80}")
    print("📊 DEBUG SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed < total:
        print(f"\n🔧 Troubleshooting Steps:")
        print("1. Check Google AI API key configuration")
        print("2. Verify document text content and format")
        print("3. Test pattern matching with simpler patterns")
        print("4. Check network connectivity for AI API calls")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
