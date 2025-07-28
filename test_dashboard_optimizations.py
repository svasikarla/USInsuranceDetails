#!/usr/bin/env python3
"""
Test Dashboard Performance Optimizations
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.services.policy_service import get_dashboard_summary_optimized, get_recent_policies_lightweight, get_recent_red_flags_lightweight
from backend.app.utils.db import SessionLocal, check_database_health
import time

def test_dashboard_performance():
    print('🚀 Testing Optimized Dashboard Performance')
    print('=' * 50)

    # Test database health
    health = check_database_health()
    print(f'Database Health: {health}')

    # Test with a real user ID
    db = SessionLocal()
    try:
        from backend.app.models.user import User
        user = db.query(User).first()
        if user:
            print(f'Testing with user: {user.email}')
            
            # Test optimized dashboard query
            start_time = time.time()
            dashboard_stats = get_dashboard_summary_optimized(db, user.id)
            dashboard_time = (time.time() - start_time) * 1000
            
            print(f'✅ Dashboard stats query: {dashboard_time:.2f}ms')
            print(f'   Total policies: {dashboard_stats["total_policies"]}')
            print(f'   Total documents: {dashboard_stats["total_documents"]}')
            print(f'   Total red flags: {dashboard_stats["red_flags_summary"]["total"]}')
            
            # Test lightweight recent policies
            start_time = time.time()
            recent_policies = get_recent_policies_lightweight(db, user.id, 5)
            policies_time = (time.time() - start_time) * 1000
            
            print(f'✅ Recent policies query: {policies_time:.2f}ms')
            print(f'   Recent policies count: {len(recent_policies)}')
            
            # Test lightweight recent red flags
            start_time = time.time()
            recent_red_flags = get_recent_red_flags_lightweight(db, user.id, 5)
            red_flags_time = (time.time() - start_time) * 1000
            
            print(f'✅ Recent red flags query: {red_flags_time:.2f}ms')
            print(f'   Recent red flags count: {len(recent_red_flags)}')
            
            total_time = dashboard_time + policies_time + red_flags_time
            print(f'🎯 Total optimized dashboard load time: {total_time:.2f}ms')
            
            return {
                "success": True,
                "dashboard_time": dashboard_time,
                "policies_time": policies_time,
                "red_flags_time": red_flags_time,
                "total_time": total_time,
                "health": health
            }
            
        else:
            print('❌ No users found in database')
            return {"success": False, "error": "No users found"}
            
    except Exception as e:
        print(f'❌ Error during testing: {e}')
        return {"success": False, "error": str(e)}
    finally:
        db.close()

if __name__ == "__main__":
    result = test_dashboard_performance()
    print(f"\n📊 Test Result: {result}")
