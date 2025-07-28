#!/usr/bin/env python3
"""
Test the fixed dashboard API
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_dashboard_api():
    print('🔧 Testing Fixed Dashboard API')
    print('=' * 40)

    try:
        from backend.app.services.policy_service import get_dashboard_summary_optimized
        from backend.app.utils.db import SessionLocal
        from backend.app.models.user import User
        from backend.app.schemas.dashboard import DashboardSummary, DashboardPolicy, DashboardRedFlag
        import json
        
        # Test the dashboard function
        db = SessionLocal()
        try:
            user = db.query(User).first()
            if user:
                print(f'Testing with user: {user.email}')
                
                # Test the optimized dashboard query
                dashboard_stats = get_dashboard_summary_optimized(db, user.id)
                print(f'✅ Dashboard stats query successful')
                print(f'   Total policies: {dashboard_stats["total_policies"]}')
                print(f'   Total documents: {dashboard_stats["total_documents"]}')
                print(f'   Total red flags: {dashboard_stats["red_flags_summary"]["total"]}')
                
                # Test schema validation
                test_policy = DashboardPolicy(
                    id="test-id",
                    policy_name="Test Policy",
                    policy_type="health",
                    created_at="2024-01-01T00:00:00",
                    carrier_name="Test Carrier",
                    carrier_code="TC"
                )
                print(f'✅ DashboardPolicy schema validation successful')
                
                test_red_flag = DashboardRedFlag(
                    id="test-id",
                    policy_id="policy-id",
                    title="Test Red Flag",
                    severity="high",
                    flag_type="test",
                    description="Test description",
                    created_at="2024-01-01T00:00:00",
                    policy_name="Test Policy"
                )
                print(f'✅ DashboardRedFlag schema validation successful')
                
                # Test JSON serialization
                policy_json = test_policy.model_dump()
                red_flag_json = test_red_flag.model_dump()
                json.dumps(policy_json)
                json.dumps(red_flag_json)
                print(f'✅ Schema objects are JSON serializable')
                
                return True
                
            else:
                print('❌ No users found')
                return False
                
        finally:
            db.close()
            
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_dashboard_api()
    if success:
        print('\n🎉 Dashboard API fix validation successful!')
    else:
        print('\n❌ Dashboard API fix validation failed!')
