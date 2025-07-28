#!/usr/bin/env python3
"""
Simple API Performance Test
"""

import requests
import time
import json

def test_api():
    print("🚀 Testing Dashboard API Performance")
    print("=" * 50)
    
    # Test authentication
    print("🔐 Testing Authentication...")
    login_data = {
        'username': 'vasikarla.satish@outlook.com',
        'password': 'testpassword123'
    }
    
    try:
        response = requests.post('http://127.0.0.1:8000/api/auth/login', 
                               data=login_data, timeout=10)
        print(f"Auth Status: {response.status_code}")
        
        if response.status_code == 200:
            token = response.json().get('access_token')
            print("✅ Authentication successful")
            
            # Test dashboard API performance
            print("\n📊 Testing Dashboard API...")
            headers = {'Authorization': f'Bearer {token}'}
            
            times = []
            for i in range(5):
                start_time = time.time()
                dash_response = requests.get('http://127.0.0.1:8000/api/dashboard/summary', 
                                           headers=headers, timeout=10)
                end_time = time.time()
                
                if dash_response.status_code == 200:
                    response_time = (end_time - start_time) * 1000  # Convert to ms
                    times.append(response_time)
                    print(f"   Attempt {i+1}: {response_time:.1f}ms")
                else:
                    print(f"   Attempt {i+1}: Failed ({dash_response.status_code})")
            
            if times:
                avg_time = sum(times) / len(times)
                min_time = min(times)
                max_time = max(times)
                
                print(f"\n📈 Performance Results:")
                print(f"   Average time: {avg_time:.1f}ms")
                print(f"   Min time: {min_time:.1f}ms")
                print(f"   Max time: {max_time:.1f}ms")
                
                # Get sample data
                data = dash_response.json()
                print(f"\n📊 Dashboard Data:")
                print(f"   Total policies: {data.get('total_policies', 0)}")
                print(f"   Total documents: {data.get('total_documents', 0)}")
                print(f"   Total red flags: {data.get('red_flags_summary', {}).get('total', 0)}")
                print(f"   Recent policies: {len(data.get('recent_policies', []))}")
                
                if avg_time < 500:
                    print("\n🎉 EXCELLENT: Dashboard loads very quickly!")
                elif avg_time < 1000:
                    print("\n✅ GOOD: Dashboard loads acceptably fast")
                else:
                    print("\n⚠️  FAIR: Dashboard could be faster")
                    
        else:
            print(f"❌ Authentication failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print(f"\n✅ Test completed!")

if __name__ == "__main__":
    test_api()
