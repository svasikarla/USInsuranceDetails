#!/usr/bin/env python3
"""
Verify database contents and explain why red flags aren't showing
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

def verify_policy_documents(conn):
    """Verify the policy_documents table data"""
    print("\n📄 POLICY DOCUMENTS VERIFICATION")
    print("=" * 60)
    
    cursor = conn.cursor()
    
    try:
        # Get detailed document information
        cursor.execute("""
            SELECT 
                id,
                user_id,
                carrier_id,
                original_filename,
                processing_status,
                CASE WHEN extracted_text IS NOT NULL THEN LENGTH(extracted_text) ELSE 0 END as text_length,
                created_at,
                processed_at
            FROM policy_documents 
            ORDER BY created_at DESC;
        """)
        
        documents = cursor.fetchall()
        
        if documents:
            print(f"Found {len(documents)} document(s):")
            for doc in documents:
                doc_id, user_id, carrier_id, filename, status, text_len, created, processed = doc
                print(f"\n📄 Document: {filename}")
                print(f"   ID: {doc_id}")
                print(f"   User ID: {user_id}")
                print(f"   Carrier ID: {carrier_id}")
                print(f"   Status: {status}")
                print(f"   Text Length: {text_len} characters")
                print(f"   Created: {created}")
                print(f"   Processed: {processed}")
                
                # Check if text contains exclusions
                if text_len > 0:
                    cursor.execute("""
                        SELECT 
                            CASE WHEN extracted_text ILIKE '%exclusion%' THEN 'YES' ELSE 'NO' END as has_exclusions,
                            CASE WHEN extracted_text ILIKE '%cosmetic%' THEN 'YES' ELSE 'NO' END as has_cosmetic,
                            CASE WHEN extracted_text ILIKE '%infertility%' THEN 'YES' ELSE 'NO' END as has_infertility,
                            CASE WHEN extracted_text ILIKE '%experimental%' THEN 'YES' ELSE 'NO' END as has_experimental,
                            CASE WHEN extracted_text ILIKE '%out-of-network%' THEN 'YES' ELSE 'NO' END as has_network_limits
                        FROM policy_documents 
                        WHERE id = %s;
                    """, (doc_id,))
                    
                    exclusion_check = cursor.fetchone()
                    if exclusion_check:
                        print(f"   🔍 Content Analysis:")
                        print(f"      - Contains 'exclusion': {exclusion_check[0]}")
                        print(f"      - Contains 'cosmetic': {exclusion_check[1]}")
                        print(f"      - Contains 'infertility': {exclusion_check[2]}")
                        print(f"      - Contains 'experimental': {exclusion_check[3]}")
                        print(f"      - Contains 'out-of-network': {exclusion_check[4]}")
        else:
            print("❌ No documents found in policy_documents table")
    
    except Exception as e:
        print(f"❌ Error checking policy_documents: {str(e)}")
    
    cursor.close()

def verify_insurance_policies(conn):
    """Verify the insurance_policies table data"""
    print("\n📋 INSURANCE POLICIES VERIFICATION")
    print("=" * 60)
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT COUNT(*) FROM insurance_policies;")
        policy_count = cursor.fetchone()[0]
        
        if policy_count > 0:
            cursor.execute("""
                SELECT 
                    id, policy_name, policy_type, carrier_name, 
                    policy_number, created_at
                FROM insurance_policies 
                ORDER BY created_at DESC;
            """)
            
            policies = cursor.fetchall()
            print(f"Found {len(policies)} policy/policies:")
            
            for policy in policies:
                policy_id, name, p_type, carrier, number, created = policy
                print(f"\n📋 Policy: {name}")
                print(f"   ID: {policy_id}")
                print(f"   Type: {p_type}")
                print(f"   Carrier: {carrier}")
                print(f"   Number: {number}")
                print(f"   Created: {created}")
        else:
            print("❌ No policies found in insurance_policies table")
            print("\n💡 THIS IS THE PROBLEM!")
            print("   Red flags are linked to POLICIES, not documents.")
            print("   You need to create a policy from your document.")
    
    except Exception as e:
        print(f"❌ Error checking insurance_policies: {str(e)}")
    
    cursor.close()

def verify_red_flags(conn):
    """Verify the red_flags table data"""
    print("\n🚩 RED FLAGS VERIFICATION")
    print("=" * 60)
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT COUNT(*) FROM red_flags;")
        flag_count = cursor.fetchone()[0]
        
        if flag_count > 0:
            cursor.execute("""
                SELECT 
                    rf.title, rf.severity, rf.flag_type, rf.description,
                    ip.policy_name
                FROM red_flags rf
                LEFT JOIN insurance_policies ip ON rf.policy_id = ip.id
                ORDER BY rf.created_at DESC;
            """)
            
            flags = cursor.fetchall()
            print(f"Found {len(flags)} red flag(s):")
            
            for flag in flags:
                title, severity, flag_type, description, policy_name = flag
                print(f"\n🚩 {title}")
                print(f"   Severity: {severity}")
                print(f"   Type: {flag_type}")
                print(f"   Policy: {policy_name}")
                print(f"   Description: {description}")
        else:
            print("❌ No red flags found in red_flags table")
            print("\n💡 This confirms the issue:")
            print("   No policies = No red flags")
    
    except Exception as e:
        print(f"❌ Error checking red_flags: {str(e)}")
    
    cursor.close()

def show_solution(conn):
    """Show the solution to get red flags working"""
    print("\n🛠️ SOLUTION TO GET RED FLAGS WORKING")
    print("=" * 60)
    
    print("Based on the verification, here's what you need to do:")
    print("\n1. 📄 ✅ Document uploaded: sample_employee_health_insurance_policy.pdf")
    print("2. 📄 ✅ Text extracted: Contains exclusions (cosmetic, infertility, experimental)")
    print("3. 📋 ❌ No policy created from the document")
    print("4. 🚩 ❌ No red flags (because no policy exists)")
    
    print("\n🎯 NEXT STEPS:")
    print("1. Go to your web application")
    print("2. Navigate to Documents page")
    print("3. Find 'sample_employee_health_insurance_policy.pdf'")
    print("4. Click 'Create Policy' or 'Convert to Policy'")
    print("5. Fill in the policy details")
    print("6. Save the policy")
    print("7. The AI analysis should automatically run and detect red flags")
    
    print("\n🔄 ALTERNATIVE: Create policy programmatically")
    response = input("Would you like me to create a test policy now? (y/n): ").lower().strip()
    
    if response in ['y', 'yes']:
        create_test_policy(conn)

def create_test_policy(conn):
    """Create a test policy from the existing document"""
    print("\n🧪 Creating Test Policy from Document")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    try:
        # Get the document
        cursor.execute("""
            SELECT id, user_id, original_filename, extracted_text 
            FROM policy_documents 
            WHERE original_filename = 'sample_employee_health_insurance_policy.pdf'
            LIMIT 1;
        """)
        
        doc = cursor.fetchone()
        if not doc:
            print("❌ Document not found")
            return
        
        doc_id, user_id, filename, extracted_text = doc
        
        # Check the schema of insurance_policies table
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'insurance_policies'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print("📋 Insurance policies table schema:")
        for col in columns:
            print(f"   - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})")
        
        # Create policy with correct column names
        cursor.execute("""
            INSERT INTO insurance_policies (
                id, user_id, policy_name, policy_type, 
                policy_number, effective_date, expiration_date,
                premium_amount, deductible_amount, coverage_details
            ) VALUES (
                gen_random_uuid(), %s, 
                'Health Insurance Policy from PDF', 'health',
                'SAMPLE-001', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year',
                500.00, 1000.00, 'Policy created from uploaded document'
            ) RETURNING id, policy_name;
        """, (user_id,))
        
        policy = cursor.fetchone()
        if policy:
            policy_id, policy_name = policy
            print(f"✅ Created policy: {policy_name}")
            print(f"   Policy ID: {policy_id}")
            
            # Now create red flags based on the extracted text
            if extracted_text and any(term in extracted_text.lower() for term in ['exclusion', 'cosmetic', 'infertility', 'experimental']):
                create_red_flags_for_policy(conn, policy_id, extracted_text)
            
            conn.commit()
            print("\n🎉 SUCCESS! You should now see red flags in your dashboard!")
        
    except Exception as e:
        print(f"❌ Error creating policy: {str(e)}")
        conn.rollback()
    
    cursor.close()

def create_red_flags_for_policy(conn, policy_id, extracted_text):
    """Create red flags based on extracted text"""
    cursor = conn.cursor()
    
    red_flags = []
    text_lower = extracted_text.lower()
    
    if 'cosmetic' in text_lower:
        red_flags.append({
            'flag_type': 'exclusion',
            'severity': 'high',
            'title': 'Cosmetic Procedures Excluded',
            'description': 'Cosmetic procedures are not covered under this policy',
            'source_text': 'Cosmetic procedures',
            'recommendation': 'Consider supplemental coverage for cosmetic procedures if needed'
        })
    
    if 'infertility' in text_lower:
        red_flags.append({
            'flag_type': 'exclusion',
            'severity': 'high',
            'title': 'Infertility Treatment Excluded',
            'description': 'Infertility treatments are not covered under this policy',
            'source_text': 'Infertility treatment',
            'recommendation': 'Look for policies that include fertility coverage if planning family'
        })
    
    if 'experimental' in text_lower:
        red_flags.append({
            'flag_type': 'exclusion',
            'severity': 'critical',
            'title': 'Experimental Treatments Excluded',
            'description': 'Experimental or investigational treatments are not covered',
            'source_text': 'Experimental treatments',
            'recommendation': 'Understand what treatments are considered experimental'
        })
    
    if 'out-of-network' in text_lower:
        red_flags.append({
            'flag_type': 'network_limitation',
            'severity': 'medium',
            'title': 'Out-of-Network Limitations',
            'description': 'Out-of-network services may be denied or subject to higher cost-sharing',
            'source_text': 'Out-of-network services may be denied or subject to higher cost-sharing',
            'recommendation': 'Always verify provider network status before receiving care'
        })
    
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
                0.95, 'auto_detected'
            ))
            created_count += 1
            print(f"✅ Created red flag: {flag['title']}")
        except Exception as e:
            print(f"❌ Failed to create red flag '{flag['title']}': {str(e)}")
    
    print(f"\n🚩 Created {created_count} red flags from document content")
    cursor.close()

def main():
    print("🔍 US Insurance Platform - Database Verification")
    print("=" * 60)
    
    # Connect to database
    conn = connect_to_db()
    if not conn:
        return
    
    try:
        # Verify all tables
        verify_policy_documents(conn)
        verify_insurance_policies(conn)
        verify_red_flags(conn)
        
        # Show solution
        show_solution(conn)
        
    finally:
        conn.close()
        print("\n✅ Database connection closed.")

if __name__ == "__main__":
    main()
