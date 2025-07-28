#!/usr/bin/env python3
"""
Test script for red flag database storage and retrieval
"""
import sys
import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.policy import InsurancePolicy
from backend.app.models.red_flag import RedFlag

def test_database_storage():
    """Test red flag storage in database"""
    print("🗄️ Testing Red Flag Database Storage")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get all red flags from database
        all_red_flags = db.query(RedFlag).all()
        print(f"Total red flags in database: {len(all_red_flags)}")
        
        if len(all_red_flags) == 0:
            print("❌ No red flags found in database")
            return False
        
        # Test red flag data structure
        sample_flag = all_red_flags[0]
        print(f"\nSample Red Flag Analysis:")
        print(f"  ID: {sample_flag.id}")
        print(f"  Policy ID: {sample_flag.policy_id}")
        print(f"  Flag Type: {sample_flag.flag_type}")
        print(f"  Severity: {sample_flag.severity}")
        print(f"  Title: {sample_flag.title}")
        print(f"  Description: {sample_flag.description[:100]}...")
        print(f"  Source Text: {'✅ Present' if sample_flag.source_text else '❌ Missing'}")
        print(f"  Confidence Score: {sample_flag.confidence_score}")
        print(f"  Detected By: {sample_flag.detected_by}")
        print(f"  Created At: {sample_flag.created_at}")
        
        # Validate required fields
        required_fields = ['id', 'policy_id', 'flag_type', 'severity', 'title', 'description']
        missing_fields = []
        for field in required_fields:
            if not getattr(sample_flag, field):
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
            return False
        
        # Test severity distribution
        severity_counts = {}
        for flag in all_red_flags:
            severity = flag.severity
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        print(f"\nSeverity Distribution:")
        for severity, count in sorted(severity_counts.items()):
            print(f"  {severity}: {count} flags")
        
        # Test flag type distribution
        type_counts = {}
        for flag in all_red_flags:
            flag_type = flag.flag_type
            type_counts[flag_type] = type_counts.get(flag_type, 0) + 1
        
        print(f"\nFlag Type Distribution:")
        for flag_type, count in sorted(type_counts.items()):
            print(f"  {flag_type}: {count} flags")
        
        # Test detection method distribution
        detection_counts = {}
        for flag in all_red_flags:
            detected_by = flag.detected_by or 'unknown'
            detection_counts[detected_by] = detection_counts.get(detected_by, 0) + 1
        
        print(f"\nDetection Method Distribution:")
        for method, count in sorted(detection_counts.items()):
            print(f"  {method}: {count} flags")
        
        print("✅ Database storage validation completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database storage test error: {str(e)}")
        return False
    finally:
        db.close()

def test_api_retrieval():
    """Test red flag retrieval via API endpoints"""
    print("\n🌐 Testing Red Flag API Retrieval")
    print("=" * 60)
    
    # Test API endpoints
    base_url = "http://localhost:8000"
    
    try:
        # Test health check first
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend API is not running")
            return False
        
        print("✅ Backend API is running")
        
        # Get policies to test with
        db = SessionLocal()
        policies = db.query(InsurancePolicy).limit(3).all()
        db.close()
        
        if not policies:
            print("❌ No policies found to test with")
            return False
        
        print(f"Testing with {len(policies)} policies")
        
        # Test red flag retrieval for each policy
        for i, policy in enumerate(policies):
            print(f"\nTesting Policy {i+1}: {policy.policy_name}")
            
            # Test GET /policies/{policy_id}/red-flags
            try:
                response = requests.get(
                    f"{base_url}/policies/{policy.id}/red-flags",
                    timeout=10
                )
                
                if response.status_code == 200:
                    red_flags = response.json()
                    print(f"  ✅ Retrieved {len(red_flags)} red flags via API")
                    
                    # Validate red flag structure
                    if red_flags:
                        sample_flag = red_flags[0]
                        required_api_fields = ['id', 'policy_id', 'flag_type', 'severity', 'title', 'description']
                        missing_api_fields = []
                        for field in required_api_fields:
                            if field not in sample_flag:
                                missing_api_fields.append(field)
                        
                        if missing_api_fields:
                            print(f"  ❌ Missing API fields: {missing_api_fields}")
                        else:
                            print(f"  ✅ API response structure is valid")
                            print(f"  📊 Sample flag: {sample_flag['title']} ({sample_flag['severity']})")
                    
                elif response.status_code == 404:
                    print(f"  ⚠️ No red flags found for this policy (404)")
                else:
                    print(f"  ❌ API error: {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"  ❌ API request failed: {str(e)}")
                return False
        
        print("\n✅ API retrieval testing completed!")
        return True
        
    except Exception as e:
        print(f"❌ API retrieval test error: {str(e)}")
        return False

def test_data_integrity():
    """Test data integrity and relationships"""
    print("\n🔗 Testing Data Integrity")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Test foreign key relationships
        red_flags_with_policies = db.query(RedFlag).join(InsurancePolicy).all()
        total_red_flags = db.query(RedFlag).count()
        
        print(f"Total red flags: {total_red_flags}")
        print(f"Red flags with valid policies: {len(red_flags_with_policies)}")
        
        if len(red_flags_with_policies) != total_red_flags:
            orphaned_count = total_red_flags - len(red_flags_with_policies)
            print(f"⚠️ Found {orphaned_count} orphaned red flags")
        else:
            print("✅ All red flags have valid policy relationships")
        
        # Test data consistency
        inconsistent_flags = []
        for flag in red_flags_with_policies[:10]:  # Test first 10
            issues = []
            
            # Check severity values
            valid_severities = ['low', 'medium', 'high', 'critical']
            if flag.severity not in valid_severities:
                issues.append(f"Invalid severity: {flag.severity}")
            
            # Check flag type values
            valid_flag_types = ['preauth_required', 'coverage_limitation', 'exclusion', 'network_limitation', 'high_cost']
            if flag.flag_type not in valid_flag_types:
                issues.append(f"Invalid flag_type: {flag.flag_type}")
            
            # Check confidence score range
            if flag.confidence_score and (flag.confidence_score < 0 or flag.confidence_score > 1):
                issues.append(f"Invalid confidence_score: {flag.confidence_score}")
            
            if issues:
                inconsistent_flags.append({
                    'flag_id': flag.id,
                    'issues': issues
                })
        
        if inconsistent_flags:
            print(f"⚠️ Found {len(inconsistent_flags)} flags with data issues:")
            for flag_issue in inconsistent_flags[:3]:  # Show first 3
                print(f"  Flag {flag_issue['flag_id']}: {', '.join(flag_issue['issues'])}")
        else:
            print("✅ Data consistency validation passed")
        
        return len(inconsistent_flags) == 0
        
    except Exception as e:
        print(f"❌ Data integrity test error: {str(e)}")
        return False
    finally:
        db.close()

def main():
    print("🔍 Red Flag Database Storage & Retrieval Testing")
    print("=" * 80)
    
    # Run all tests
    storage_success = test_database_storage()
    api_success = test_api_retrieval()
    integrity_success = test_data_integrity()
    
    # Summary
    print("\n📊 DATABASE TESTING SUMMARY")
    print("=" * 80)
    print(f"Database Storage: {'✅ PASS' if storage_success else '❌ FAIL'}")
    print(f"API Retrieval: {'✅ PASS' if api_success else '❌ FAIL'}")
    print(f"Data Integrity: {'✅ PASS' if integrity_success else '❌ FAIL'}")
    
    overall_success = storage_success and api_success and integrity_success
    
    if overall_success:
        print("🎉 EXCELLENT: All database tests passed!")
    else:
        print("⚠️ ISSUES FOUND: Some database tests failed")
    
    return overall_success

if __name__ == "__main__":
    main()
