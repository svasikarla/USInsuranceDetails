#!/usr/bin/env python3
"""
Simple database check to see what data exists and test red flag detection
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

def connect_to_db():
    """Connect to the Supabase database"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return None
    
    try:
        conn = psycopg2.connect(database_url)
        print("✅ Connected to Supabase database successfully")
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to database: {str(e)}")
        return None

def check_tables(conn):
    """Check what tables exist in the database"""
    print("\n📊 Checking Database Tables")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    # Check if tables exist
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    
    tables = cursor.fetchall()
    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    cursor.close()
    return [table[0] for table in tables]

def check_data(conn, tables):
    """Check data in relevant tables"""
    print("\n📄 Checking Data in Tables")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    # Check documents
    if 'policy_documents' in tables:
        cursor.execute("SELECT COUNT(*) FROM policy_documents;")
        doc_count = cursor.fetchone()[0]
        print(f"📄 Documents: {doc_count}")
        
        if doc_count > 0:
            cursor.execute("""
                SELECT original_filename, processing_status, 
                       CASE WHEN extracted_text IS NOT NULL THEN LENGTH(extracted_text) ELSE 0 END as text_length
                FROM policy_documents 
                LIMIT 5;
            """)
            docs = cursor.fetchall()
            for doc in docs:
                print(f"  - {doc[0]}: {doc[1]} (text: {doc[2]} chars)")
    
    # Check policies
    if 'insurance_policies' in tables:
        cursor.execute("SELECT COUNT(*) FROM insurance_policies;")
        policy_count = cursor.fetchone()[0]
        print(f"\n📋 Policies: {policy_count}")
        
        if policy_count > 0:
            cursor.execute("SELECT policy_name, policy_type FROM insurance_policies LIMIT 5;")
            policies = cursor.fetchall()
            for policy in policies:
                print(f"  - {policy[0]}: {policy[1]}")
    
    # Check red flags
    if 'red_flags' in tables:
        cursor.execute("SELECT COUNT(*) FROM red_flags;")
        flag_count = cursor.fetchone()[0]
        print(f"\n🚩 Red Flags: {flag_count}")
        
        if flag_count > 0:
            cursor.execute("SELECT title, severity, flag_type FROM red_flags LIMIT 10;")
            flags = cursor.fetchall()
            for flag in flags:
                print(f"  - {flag[0]}: {flag[1]} ({flag[2]})")
    
    cursor.close()

def search_for_exclusions(conn):
    """Search for exclusion text in documents"""
    print("\n🔍 Searching for Exclusion Text in Documents")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    try:
        # Search for exclusion-related text
        cursor.execute("""
            SELECT original_filename, 
                   CASE WHEN extracted_text ILIKE '%exclusion%' THEN 'YES' ELSE 'NO' END as has_exclusions,
                   CASE WHEN extracted_text ILIKE '%cosmetic%' THEN 'YES' ELSE 'NO' END as has_cosmetic,
                   CASE WHEN extracted_text ILIKE '%infertility%' THEN 'YES' ELSE 'NO' END as has_infertility,
                   CASE WHEN extracted_text ILIKE '%experimental%' THEN 'YES' ELSE 'NO' END as has_experimental
            FROM policy_documents 
            WHERE extracted_text IS NOT NULL;
        """)
        
        results = cursor.fetchall()
        if results:
            print("Document analysis:")
            for result in results:
                filename, exclusions, cosmetic, infertility, experimental = result
                print(f"  📄 {filename}:")
                print(f"     - Contains 'exclusion': {exclusions}")
                print(f"     - Contains 'cosmetic': {cosmetic}")
                print(f"     - Contains 'infertility': {infertility}")
                print(f"     - Contains 'experimental': {experimental}")
        else:
            print("No documents with extracted text found")
            
    except Exception as e:
        print(f"Error searching documents: {str(e)}")
    
    cursor.close()

def create_test_red_flags(conn):
    """Create test red flags for demonstration"""
    print("\n🧪 Creating Test Red Flags")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    try:
        # First, check if we have any policies
        cursor.execute("SELECT id, policy_name FROM insurance_policies LIMIT 1;")
        policy = cursor.fetchone()
        
        if not policy:
            print("❌ No policies found. Creating a test policy first...")
            
            # Create a test policy
            cursor.execute("""
                INSERT INTO insurance_policies (
                    id, user_id, policy_name, policy_type, carrier_name, 
                    policy_number, effective_date, expiration_date, 
                    premium_amount, deductible_amount, coverage_details
                ) VALUES (
                    gen_random_uuid(), gen_random_uuid(), 
                    'Test Health Insurance Policy', 'health', 'Test Insurance Co.',
                    'TEST-001', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year',
                    500.00, 1000.00, 'Test policy for red flag demonstration'
                ) RETURNING id, policy_name;
            """)
            
            policy = cursor.fetchone()
            print(f"✅ Created test policy: {policy[1]}")
        
        policy_id = policy[0]
        
        # Create red flags for the exclusions mentioned
        red_flags = [
            {
                'flag_type': 'exclusion',
                'severity': 'high',
                'title': 'Cosmetic Procedures Excluded',
                'description': 'Cosmetic procedures are not covered under this policy',
                'source_text': 'Cosmetic procedures',
                'recommendation': 'Consider supplemental coverage for cosmetic procedures if needed'
            },
            {
                'flag_type': 'exclusion',
                'severity': 'high', 
                'title': 'Infertility Treatment Excluded',
                'description': 'Infertility treatments are not covered under this policy',
                'source_text': 'Infertility treatment',
                'recommendation': 'Look for policies that include fertility coverage if planning family'
            },
            {
                'flag_type': 'exclusion',
                'severity': 'critical',
                'title': 'Experimental Treatments Excluded', 
                'description': 'Experimental or investigational treatments are not covered',
                'source_text': 'Experimental treatments',
                'recommendation': 'Understand what treatments are considered experimental'
            },
            {
                'flag_type': 'network_limitation',
                'severity': 'medium',
                'title': 'Out-of-Network Limitations',
                'description': 'Out-of-network services may be denied or subject to higher cost-sharing',
                'source_text': 'Out-of-network services may be denied or subject to higher cost-sharing',
                'recommendation': 'Always verify provider network status before receiving care'
            }
        ]
        
        created_count = 0
        for flag in red_flags:
            try:
                cursor.execute("""
                    INSERT INTO red_flags (
                        id, policy_id, flag_type, severity, title, description,
                        source_text, recommendation, confidence_score, detected_by
                    ) VALUES (
                        gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s
                    );
                """, (
                    policy_id, flag['flag_type'], flag['severity'], flag['title'],
                    flag['description'], flag['source_text'], flag['recommendation'],
                    0.95, 'manual_test'
                ))
                created_count += 1
                print(f"✅ Created red flag: {flag['title']}")
            except Exception as e:
                print(f"❌ Failed to create red flag '{flag['title']}': {str(e)}")
        
        conn.commit()
        print(f"\n🎉 Successfully created {created_count} red flags!")
        
        if created_count > 0:
            print("\nNow you can:")
            print("1. Refresh your dashboard to see the red flag count update")
            print("2. Go to the Policies page")
            print("3. Click on 'Test Health Insurance Policy'")
            print("4. Scroll down to see the Red Flags section")
        
    except Exception as e:
        print(f"❌ Error creating test red flags: {str(e)}")
        conn.rollback()
    
    cursor.close()

def main():
    print("🔍 US Insurance Platform - Database Check & Red Flag Test")
    print("=" * 60)
    
    # Connect to database
    conn = connect_to_db()
    if not conn:
        return
    
    try:
        # Check tables
        tables = check_tables(conn)
        
        # Check existing data
        check_data(conn, tables)
        
        # Search for exclusion text
        search_for_exclusions(conn)
        
        # Ask user if they want to create test red flags
        print("\n" + "=" * 60)
        response = input("Would you like to create test red flags? (y/n): ").lower().strip()
        
        if response in ['y', 'yes']:
            create_test_red_flags(conn)
        else:
            print("Skipping test red flag creation.")
            
    finally:
        conn.close()
        print("\n✅ Database connection closed.")

if __name__ == "__main__":
    main()
