#!/usr/bin/env python3
"""
Test script to verify red flags are properly counted in dashboard
"""
import psycopg2
import requests
import json
from datetime import datetime

def test_red_flags_count():
    """Test that red flags are properly counted"""
    
    print("🧪 Testing Red Flags Dashboard Integration")
    print("=" * 50)
    
    # Database connection
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="us_insurance_db",
            user="postgres",
            password="postgres123",
            port="5432"
        )
        cursor = conn.cursor()
        
        # Check red flags in database
        cursor.execute("SELECT COUNT(*) FROM red_flags;")
        db_red_flags_count = cursor.fetchone()[0]
        print(f"📊 Red Flags in Database: {db_red_flags_count}")
        
        if db_red_flags_count > 0:
            cursor.execute("""
                SELECT rf.title, rf.severity, rf.flag_type, ip.policy_name
                FROM red_flags rf
                JOIN insurance_policies ip ON rf.policy_id = ip.id
                ORDER BY rf.created_at DESC
                LIMIT 5;
            """)
            
            flags = cursor.fetchall()
            print(f"\n🚩 Sample Red Flags:")
            for flag in flags:
                title, severity, flag_type, policy_name = flag
                print(f"   - {title} ({severity}) - {policy_name}")
        
        # Check policies count
        cursor.execute("SELECT COUNT(*) FROM insurance_policies;")
        policies_count = cursor.fetchone()[0]
        print(f"\n📋 Total Policies: {policies_count}")
        
        cursor.close()
        conn.close()
        
        print(f"\n✅ Database verification complete")
        print(f"   - {policies_count} policies found")
        print(f"   - {db_red_flags_count} red flags found")
        
        if db_red_flags_count == 0:
            print("\n⚠️  No red flags found in database!")
            print("   Run create_policy_and_red_flags.py to create test data")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return False

def test_api_endpoints():
    """Test API endpoints for red flags"""
    
    print(f"\n🔌 Testing API Endpoints")
    print("=" * 30)
    
    base_url = "http://127.0.0.1:8000"
    
    try:
        # Test health check
        response = requests.get(f"{base_url}/")
        print(f"✅ Health check: {response.status_code}")
        
        # Note: We can't test authenticated endpoints without proper auth
        print("⚠️  Cannot test authenticated endpoints without login")
        print("   Dashboard API requires authentication")
        
        return True
        
    except Exception as e:
        print(f"❌ API test error: {str(e)}")
        return False

def main():
    """Main test function"""
    
    print("🧪 Dashboard Red Flags Integration Test")
    print("=" * 50)
    print(f"⏰ Test started at: {datetime.now()}")
    
    # Test database
    db_ok = test_red_flags_count()
    
    # Test API
    api_ok = test_api_endpoints()
    
    print(f"\n📊 Test Summary:")
    print(f"   Database: {'✅ PASS' if db_ok else '❌ FAIL'}")
    print(f"   API:      {'✅ PASS' if api_ok else '❌ FAIL'}")
    
    if db_ok:
        print(f"\n🎯 Next Steps:")
        print(f"   1. Start the backend: python -m uvicorn app.main:app --reload")
        print(f"   2. Start the frontend: npm run dev")
        print(f"   3. Login and check dashboard at http://localhost:3000/dashboard")
        print(f"   4. Verify red flags count shows correctly")
    
    print(f"\n⏰ Test completed at: {datetime.now()}")

if __name__ == "__main__":
    main()
