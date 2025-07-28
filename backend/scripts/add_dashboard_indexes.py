#!/usr/bin/env python3
"""
Add optimized composite indexes for dashboard performance
This script creates additional indexes specifically designed for the optimized dashboard queries.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from app.utils.db import engine, SessionLocal
from datetime import datetime

def check_index_exists(inspector, table_name, index_name):
    """Check if an index exists on a table"""
    try:
        indexes = inspector.get_indexes(table_name)
        return any(idx['name'] == index_name for idx in indexes)
    except Exception:
        return False

def create_dashboard_indexes():
    """Create optimized indexes for dashboard queries"""
    
    print("🔧 Creating Dashboard Performance Indexes")
    print("=" * 50)
    
    inspector = inspect(engine)
    
    # Define the indexes we want to create
    indexes_to_create = [
        {
            "name": "idx_policies_user_created_composite",
            "table": "insurance_policies", 
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_user_created_composite ON insurance_policies(user_id, created_at DESC)",
            "description": "Composite index for user policies ordered by creation date"
        },
        {
            "name": "idx_policies_user_type_composite", 
            "table": "insurance_policies",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_user_type_composite ON insurance_policies(user_id, policy_type)",
            "description": "Composite index for policies by user and type"
        },
        {
            "name": "idx_policies_user_carrier_composite",
            "table": "insurance_policies", 
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_user_carrier_composite ON insurance_policies(user_id, carrier_id) WHERE carrier_id IS NOT NULL",
            "description": "Partial composite index for policies by user and carrier"
        },
        {
            "name": "idx_documents_user_created_composite",
            "table": "policy_documents",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_created_composite ON policy_documents(user_id, created_at DESC)",
            "description": "Composite index for user documents ordered by creation date"
        },
        {
            "name": "idx_documents_user_status_composite",
            "table": "policy_documents", 
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_status_composite ON policy_documents(user_id, processing_status)",
            "description": "Composite index for documents by user and processing status"
        },
        {
            "name": "idx_red_flags_policy_severity_composite",
            "table": "red_flags",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_red_flags_policy_severity_composite ON red_flags(policy_id, severity, created_at DESC)",
            "description": "Composite index for red flags by policy, severity, and date"
        },
        {
            "name": "idx_red_flags_user_created_composite",
            "table": "red_flags", 
            "sql": """CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_red_flags_user_created_composite 
                     ON red_flags(created_at DESC) 
                     WHERE policy_id IN (SELECT id FROM insurance_policies)""",
            "description": "Optimized index for recent red flags across all user policies"
        },
        {
            "name": "idx_carriers_active_name",
            "table": "insurance_carriers",
            "sql": "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carriers_active_name ON insurance_carriers(is_active, name) WHERE is_active = true",
            "description": "Partial index for active carriers ordered by name"
        }
    ]
    
    created_count = 0
    skipped_count = 0
    
    # Use autocommit mode for CREATE INDEX CONCURRENTLY
    connection = engine.connect()
    connection = connection.execution_options(autocommit=True)

    try:
        for index_info in indexes_to_create:
            index_name = index_info["name"]
            table_name = index_info["table"]
            sql = index_info["sql"]
            description = index_info["description"]

            print(f"\n📋 Processing: {index_name}")
            print(f"   Table: {table_name}")
            print(f"   Description: {description}")

            # Check if index already exists
            if check_index_exists(inspector, table_name, index_name):
                print(f"   ⏭️  Index already exists, skipping")
                skipped_count += 1
                continue

            try:
                # Create the index without CONCURRENTLY for now to avoid transaction issues
                sql_non_concurrent = sql.replace("CONCURRENTLY ", "")
                print(f"   🔨 Creating index...")
                connection.execute(text(sql_non_concurrent))
                print(f"   ✅ Index created successfully")
                created_count += 1

            except Exception as e:
                print(f"   ❌ Failed to create index: {e}")
                # Continue with other indexes even if one fails
                continue
    finally:
        connection.close()
    
    print(f"\n📊 Index Creation Summary:")
    print(f"   ✅ Created: {created_count} indexes")
    print(f"   ⏭️  Skipped: {skipped_count} indexes (already exist)")
    print(f"   📋 Total: {len(indexes_to_create)} indexes processed")

def verify_dashboard_query_performance():
    """Test the performance of dashboard queries with new indexes"""
    
    print(f"\n🔍 Testing Dashboard Query Performance")
    print("=" * 50)
    
    test_queries = [
        {
            "name": "User Policies Count",
            "sql": """
                EXPLAIN ANALYZE 
                SELECT COUNT(*) FROM insurance_policies 
                WHERE user_id = (SELECT id FROM users LIMIT 1)
            """
        },
        {
            "name": "Recent Policies by User", 
            "sql": """
                EXPLAIN ANALYZE
                SELECT id, policy_name, policy_type, created_at
                FROM insurance_policies 
                WHERE user_id = (SELECT id FROM users LIMIT 1)
                ORDER BY created_at DESC 
                LIMIT 5
            """
        },
        {
            "name": "Red Flags by User Policies",
            "sql": """
                EXPLAIN ANALYZE
                SELECT COUNT(*), severity
                FROM red_flags rf
                JOIN insurance_policies p ON rf.policy_id = p.id
                WHERE p.user_id = (SELECT id FROM users LIMIT 1)
                GROUP BY severity
            """
        },
        {
            "name": "Policies by Type and User",
            "sql": """
                EXPLAIN ANALYZE
                SELECT policy_type, COUNT(*)
                FROM insurance_policies
                WHERE user_id = (SELECT id FROM users LIMIT 1)
                GROUP BY policy_type
            """
        }
    ]
    
    with engine.connect() as connection:
        for query_info in test_queries:
            query_name = query_info["name"]
            sql = query_info["sql"]
            
            print(f"\n📊 Testing: {query_name}")
            try:
                result = connection.execute(text(sql))
                execution_plan = result.fetchall()
                
                # Look for execution time in the plan
                execution_time = None
                for row in execution_plan:
                    row_str = str(row[0]) if row else ""
                    if "Execution Time:" in row_str:
                        execution_time = row_str.split("Execution Time:")[1].strip()
                        break
                
                if execution_time:
                    print(f"   ⏱️  Execution Time: {execution_time}")
                else:
                    print(f"   ✅ Query executed successfully")
                    
                # Check if indexes are being used
                index_used = any("Index Scan" in str(row[0]) for row in execution_plan if row)
                if index_used:
                    print(f"   🚀 Index scan detected - optimized!")
                else:
                    print(f"   ⚠️  Sequential scan - may need optimization")
                    
            except Exception as e:
                print(f"   ❌ Query failed: {e}")

def main():
    """Main function to create indexes and test performance"""
    
    print("🚀 Dashboard Performance Index Optimization")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Create the indexes
        create_dashboard_indexes()
        
        # Test query performance
        verify_dashboard_query_performance()
        
        print(f"\n✅ Dashboard index optimization completed successfully!")
        print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        print(f"\n❌ Error during index optimization: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
