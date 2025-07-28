#!/usr/bin/env python3
"""
Dashboard Performance Test Script

This script tests the performance improvements made to the dashboard loading:
1. N+1 Query Problem Fix
2. Redundant API Call Elimination  
3. Database Index Optimization
4. Pagination and Limits
5. Eager Loading Implementation

Run this script to measure the performance improvements.
"""

import time
import requests
import json
import statistics
from datetime import datetime
from typing import Dict, List, Tuple
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Database testing
try:
    from app.utils.db import SessionLocal
    from app.services import policy_service, document_service, carrier_service
    from app.models import User, InsurancePolicy, RedFlag
    from sqlalchemy import text
    DB_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Database imports not available: {e}")
    DB_AVAILABLE = False

# API testing configuration
API_BASE_URL = "http://127.0.0.1:8000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

class PerformanceTest:
    def __init__(self):
        self.results = {}
        self.auth_token = None
        
    def authenticate(self) -> bool:
        """Authenticate with the API to get access token"""
        try:
            response = requests.post(f"{API_BASE_URL}/api/auth/login", 
                data={
                    "username": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                })
            
            if response.status_code == 200:
                self.auth_token = response.json().get("access_token")
                print("✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {e}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    def measure_api_performance(self, endpoint: str, iterations: int = 5) -> Tuple[float, float, List[float]]:
        """Measure API endpoint performance"""
        times = []
        
        for i in range(iterations):
            start_time = time.time()
            try:
                response = requests.get(f"{API_BASE_URL}{endpoint}", headers=self.get_headers())
                end_time = time.time()
                
                if response.status_code == 200:
                    times.append(end_time - start_time)
                else:
                    print(f"⚠️  API call failed: {response.status_code}")
            except Exception as e:
                print(f"⚠️  API error: {e}")
        
        if times:
            avg_time = statistics.mean(times)
            median_time = statistics.median(times)
            return avg_time, median_time, times
        else:
            return 0, 0, []
    
    def test_database_queries(self) -> Dict[str, float]:
        """Test database query performance"""
        if not DB_AVAILABLE:
            return {"error": "Database not available"}
        
        db = SessionLocal()
        results = {}
        
        try:
            # Test 1: Get user policies with eager loading
            start_time = time.time()
            user = db.query(User).first()
            if user:
                policies = policy_service.get_policies_by_user(db=db, user_id=user.id, limit=100)
                results["policies_with_eager_loading"] = time.time() - start_time
                
                # Test 2: Get red flags using optimized query
                start_time = time.time()
                red_flags = policy_service.get_red_flags_by_user(db=db, user_id=user.id, limit=500)
                results["red_flags_optimized"] = time.time() - start_time
                
                # Test 3: Get documents with eager loading
                start_time = time.time()
                documents = document_service.get_documents_by_user(db=db, user_id=user.id, limit=50)
                results["documents_with_eager_loading"] = time.time() - start_time
                
                # Test 4: Get carriers with eager loading
                start_time = time.time()
                carriers = carrier_service.get_carriers(db=db, limit=100)
                results["carriers_with_eager_loading"] = time.time() - start_time
                
                print(f"📊 Database Query Results:")
                print(f"   Policies: {len(policies)} records in {results['policies_with_eager_loading']:.3f}s")
                print(f"   Red Flags: {len(red_flags)} records in {results['red_flags_optimized']:.3f}s")
                print(f"   Documents: {len(documents)} records in {results['documents_with_eager_loading']:.3f}s")
                print(f"   Carriers: {len(carriers)} records in {results['carriers_with_eager_loading']:.3f}s")
            
        except Exception as e:
            results["error"] = str(e)
            print(f"❌ Database test error: {e}")
        finally:
            db.close()
        
        return results
    
    def test_dashboard_api(self) -> Dict[str, any]:
        """Test dashboard API performance"""
        print("\n🔍 Testing Dashboard API Performance...")
        
        # Test dashboard summary endpoint
        avg_time, median_time, times = self.measure_api_performance("/api/dashboard/summary", iterations=10)
        
        if times:
            print(f"📈 Dashboard API Results:")
            print(f"   Average time: {avg_time:.3f}s")
            print(f"   Median time: {median_time:.3f}s")
            print(f"   Min time: {min(times):.3f}s")
            print(f"   Max time: {max(times):.3f}s")
            print(f"   All times: {[f'{t:.3f}s' for t in times]}")
            
            return {
                "average_time": avg_time,
                "median_time": median_time,
                "min_time": min(times),
                "max_time": max(times),
                "all_times": times,
                "success": True
            }
        else:
            return {"success": False, "error": "No successful API calls"}
    
    def test_individual_endpoints(self) -> Dict[str, Dict]:
        """Test individual API endpoints for comparison"""
        print("\n🔍 Testing Individual API Endpoints...")
        
        endpoints = {
            "policies": "/api/policies",
            "documents": "/api/documents", 
            "carriers": "/api/carriers"
        }
        
        results = {}
        
        for name, endpoint in endpoints.items():
            avg_time, median_time, times = self.measure_api_performance(endpoint, iterations=5)
            results[name] = {
                "average_time": avg_time,
                "median_time": median_time,
                "times": times
            }
            print(f"   {name.capitalize()}: {avg_time:.3f}s avg")
        
        return results
    
    def run_comprehensive_test(self):
        """Run all performance tests"""
        print("🚀 Dashboard Performance Test Suite")
        print("=" * 50)
        print(f"⏰ Test started at: {datetime.now()}")
        
        # Test API authentication
        if not self.authenticate():
            print("❌ Cannot proceed without authentication")
            return
        
        # Test database queries
        if DB_AVAILABLE:
            print("\n🗄️  Testing Database Performance...")
            db_results = self.test_database_queries()
            self.results["database"] = db_results
        
        # Test dashboard API
        dashboard_results = self.test_dashboard_api()
        self.results["dashboard_api"] = dashboard_results
        
        # Test individual endpoints
        individual_results = self.test_individual_endpoints()
        self.results["individual_apis"] = individual_results
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary and recommendations"""
        print("\n" + "=" * 50)
        print("📊 PERFORMANCE TEST SUMMARY")
        print("=" * 50)
        
        if "dashboard_api" in self.results and self.results["dashboard_api"].get("success"):
            dashboard_time = self.results["dashboard_api"]["average_time"]
            print(f"🎯 Dashboard Load Time: {dashboard_time:.3f}s")
            
            if dashboard_time < 0.5:
                print("✅ EXCELLENT: Dashboard loads very quickly!")
            elif dashboard_time < 1.0:
                print("✅ GOOD: Dashboard loads acceptably fast")
            elif dashboard_time < 2.0:
                print("⚠️  FAIR: Dashboard could be faster")
            else:
                print("❌ SLOW: Dashboard needs optimization")
        
        print(f"\n🔧 Optimizations Applied:")
        print(f"   ✅ Fixed N+1 query problem (single query for red flags)")
        print(f"   ✅ Eliminated redundant API calls (dashboard includes policies)")
        print(f"   ✅ Added database indexes (user_id, policy_id, carrier_id, etc.)")
        print(f"   ✅ Implemented pagination limits (100 policies, 50 documents)")
        print(f"   ✅ Added eager loading for relationships")
        
        print(f"\n⏰ Test completed at: {datetime.now()}")

def main():
    """Main test function"""
    test = PerformanceTest()
    test.run_comprehensive_test()

if __name__ == "__main__":
    main()
