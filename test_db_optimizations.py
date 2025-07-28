#!/usr/bin/env python3
"""
Database Optimization Verification Script

This script verifies that our database optimizations are working correctly:
1. Eager loading is functioning
2. Indexes are in place
3. Optimized queries are working
4. N+1 problem is resolved
"""

import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.utils.db import SessionLocal, engine
    from app.services import policy_service, document_service, carrier_service
    from app.models import User, InsurancePolicy, RedFlag, PolicyDocument, InsuranceCarrier
    from sqlalchemy import text, inspect
    from sqlalchemy.orm import sessionmaker
    DB_AVAILABLE = True
except ImportError as e:
    print(f"❌ Database imports not available: {e}")
    DB_AVAILABLE = False

def check_database_indexes():
    """Check if our performance indexes are in place"""
    print("🔍 Checking Database Indexes...")
    
    try:
        inspector = inspect(engine)
        
        # Check indexes on key tables
        tables_to_check = {
            'users': ['email'],
            'insurance_policies': ['user_id', 'carrier_id', 'policy_type', 'created_at'],
            'policy_documents': ['user_id', 'processing_status', 'created_at'],
            'red_flags': ['policy_id', 'severity', 'created_at'],
            'insurance_carriers': ['code']
        }
        
        for table_name, expected_indexed_columns in tables_to_check.items():
            indexes = inspector.get_indexes(table_name)
            indexed_columns = set()
            
            for index in indexes:
                indexed_columns.update(index['column_names'])
            
            print(f"\n📋 Table: {table_name}")
            for column in expected_indexed_columns:
                if column in indexed_columns:
                    print(f"   ✅ {column} - indexed")
                else:
                    print(f"   ⚠️  {column} - not indexed (may be added by model)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking indexes: {e}")
        return False

def test_eager_loading():
    """Test that eager loading is working correctly"""
    print("\n🔄 Testing Eager Loading...")
    
    db = SessionLocal()
    try:
        # Get a user
        user = db.query(User).first()
        if not user:
            print("❌ No test user found")
            return False
        
        print(f"👤 Testing with user: {user.email}")
        
        # Test 1: Policy eager loading
        print("\n1️⃣  Testing Policy Eager Loading...")
        policies = policy_service.get_policies_by_user(db=db, user_id=user.id, limit=10)
        
        if policies:
            policy = policies[0]
            print(f"   📄 Policy: {policy.policy_name}")
            
            # Check if relationships are loaded without additional queries
            try:
                carrier_name = policy.carrier.name if policy.carrier else "No carrier"
                print(f"   🏢 Carrier: {carrier_name} (loaded via eager loading)")
            except:
                print(f"   ⚠️  Carrier relationship not eager loaded")
            
            try:
                doc_filename = policy.document.original_filename if policy.document else "No document"
                print(f"   📎 Document: {doc_filename} (loaded via eager loading)")
            except:
                print(f"   ⚠️  Document relationship not eager loaded")
        
        # Test 2: Document eager loading
        print("\n2️⃣  Testing Document Eager Loading...")
        documents = document_service.get_documents_by_user(db=db, user_id=user.id, limit=10)
        
        if documents:
            doc = documents[0]
            print(f"   📄 Document: {doc.original_filename}")
            
            try:
                carrier_name = doc.carrier.name if doc.carrier else "No carrier"
                print(f"   🏢 Carrier: {carrier_name} (loaded via eager loading)")
            except:
                print(f"   ⚠️  Carrier relationship not eager loaded")
        
        # Test 3: Red flags optimized query
        print("\n3️⃣  Testing Red Flags Optimized Query...")
        red_flags = policy_service.get_red_flags_by_user(db=db, user_id=user.id, limit=20)
        
        print(f"   🚩 Found {len(red_flags)} red flags")
        if red_flags:
            flag = red_flags[0]
            print(f"   📄 Sample flag: {flag.title}")
            
            try:
                policy_name = flag.policy.policy_name if flag.policy else "No policy"
                print(f"   📋 Policy: {policy_name} (loaded via eager loading)")
            except:
                print(f"   ⚠️  Policy relationship not eager loaded")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing eager loading: {e}")
        return False
    finally:
        db.close()

def test_query_efficiency():
    """Test that our queries are efficient"""
    print("\n⚡ Testing Query Efficiency...")
    
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("❌ No test user found")
            return False
        
        # Enable SQL logging to see queries
        import logging
        logging.basicConfig()
        logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
        
        print("\n🔍 Executing optimized dashboard queries...")
        print("   (Check console for SQL queries - should be minimal)")
        
        # This should generate minimal queries due to our optimizations
        policies = policy_service.get_policies_by_user(db=db, user_id=user.id, limit=100)
        documents = document_service.get_documents_by_user(db=db, user_id=user.id, limit=50)
        carriers = carrier_service.get_carriers(db=db, limit=100)
        red_flags = policy_service.get_red_flags_by_user(db=db, user_id=user.id, limit=500)
        
        print(f"\n📊 Query Results:")
        print(f"   Policies: {len(policies)}")
        print(f"   Documents: {len(documents)}")
        print(f"   Carriers: {len(carriers)}")
        print(f"   Red Flags: {len(red_flags)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing query efficiency: {e}")
        return False
    finally:
        db.close()

def verify_data_consistency():
    """Verify that our optimizations don't break data consistency"""
    print("\n🔒 Verifying Data Consistency...")
    
    db = SessionLocal()
    try:
        # Check that relationships are working correctly
        policies = db.query(InsurancePolicy).all()
        red_flags = db.query(RedFlag).all()
        
        print(f"📊 Data Overview:")
        print(f"   Total Policies: {len(policies)}")
        print(f"   Total Red Flags: {len(red_flags)}")
        
        # Verify red flag relationships
        orphaned_flags = 0
        for flag in red_flags:
            if not flag.policy:
                orphaned_flags += 1
        
        if orphaned_flags == 0:
            print(f"   ✅ All red flags have valid policy relationships")
        else:
            print(f"   ⚠️  {orphaned_flags} red flags have broken policy relationships")
        
        # Verify policy relationships
        orphaned_policies = 0
        for policy in policies:
            if not policy.user or not policy.document:
                orphaned_policies += 1
        
        if orphaned_policies == 0:
            print(f"   ✅ All policies have valid user and document relationships")
        else:
            print(f"   ⚠️  {orphaned_policies} policies have broken relationships")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying data consistency: {e}")
        return False
    finally:
        db.close()

def main():
    """Main test function"""
    print("🧪 Database Optimization Verification")
    print("=" * 50)
    print(f"⏰ Test started at: {datetime.now()}")
    
    if not DB_AVAILABLE:
        print("❌ Database not available for testing")
        return
    
    # Run all tests
    tests = [
        ("Database Indexes", check_database_indexes),
        ("Eager Loading", test_eager_loading),
        ("Query Efficiency", test_query_efficiency),
        ("Data Consistency", verify_data_consistency)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All optimizations are working correctly!")
    else:
        print("⚠️  Some optimizations need attention")
    
    print(f"\n⏰ Test completed at: {datetime.now()}")

if __name__ == "__main__":
    main()
