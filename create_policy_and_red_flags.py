#!/usr/bin/env python3
"""
Create a policy from the existing document and generate red flags
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

def create_policy_from_document(conn):
    """Create a policy from the existing document with correct schema"""
    print("\n🧪 Creating Policy from Document")
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
            return None
        
        doc_id, user_id, filename, extracted_text = doc
        print(f"📄 Found document: {filename}")
        print(f"   Document ID: {doc_id}")
        print(f"   User ID: {user_id}")
        print(f"   Text length: {len(extracted_text) if extracted_text else 0} characters")
        
        # Create policy with correct column names based on the schema we saw
        cursor.execute("""
            INSERT INTO insurance_policies (
                id, document_id, user_id, policy_name, policy_type, 
                policy_number, effective_date, expiration_date,
                deductible_individual, premium_monthly, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), %s, %s, 
                'Health Insurance Policy from PDF', 'health',
                'SAMPLE-001', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year',
                1000.00, 500.00, NOW(), NOW()
            ) RETURNING id, policy_name;
        """, (doc_id, user_id))
        
        policy = cursor.fetchone()
        if policy:
            policy_id, policy_name = policy
            print(f"✅ Created policy: {policy_name}")
            print(f"   Policy ID: {policy_id}")
            
            # Create red flags based on the extracted text
            if extracted_text:
                red_flags_created = create_red_flags_for_policy(conn, policy_id, extracted_text)
                
                if red_flags_created > 0:
                    conn.commit()
                    print(f"\n🎉 SUCCESS!")
                    print(f"✅ Created 1 policy")
                    print(f"✅ Created {red_flags_created} red flags")
                    print("\n🔄 Now refresh your dashboard to see:")
                    print("   - Total Policies: 1")
                    print(f"   - Red Flags Detected: {red_flags_created}")
                    print("\n📋 To view the red flags:")
                    print("   1. Go to Policies page")
                    print("   2. Click on 'Health Insurance Policy from PDF'")
                    print("   3. Scroll down to see the Red Flags section")
                    
                    return policy_id
                else:
                    print("❌ No red flags were created")
                    conn.rollback()
                    return None
            else:
                print("❌ No extracted text found in document")
                conn.rollback()
                return None
        else:
            print("❌ Failed to create policy")
            return None
        
    except Exception as e:
        print(f"❌ Error creating policy: {str(e)}")
        conn.rollback()
        return None
    
    cursor.close()

def create_red_flags_for_policy(conn, policy_id, extracted_text):
    """Create red flags based on extracted text content"""
    print(f"\n🚩 Creating Red Flags for Policy")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    # Analyze the text for red flag triggers
    text_lower = extracted_text.lower()
    print(f"📄 Analyzing {len(extracted_text)} characters of text...")
    
    # Define red flags based on content
    potential_red_flags = []
    
    # Check for exclusions
    if 'cosmetic' in text_lower:
        potential_red_flags.append({
            'flag_type': 'exclusion',
            'severity': 'high',
            'title': 'Cosmetic Procedures Excluded',
            'description': 'Cosmetic procedures are not covered under this policy',
            'source_text': 'Cosmetic procedures',
            'recommendation': 'Consider supplemental coverage for cosmetic procedures if needed'
        })
        print("   ✅ Found: Cosmetic procedures exclusion")
    
    if 'infertility' in text_lower:
        potential_red_flags.append({
            'flag_type': 'exclusion',
            'severity': 'high',
            'title': 'Infertility Treatment Excluded',
            'description': 'Infertility treatments are not covered under this policy',
            'source_text': 'Infertility treatment',
            'recommendation': 'Look for policies that include fertility coverage if planning family'
        })
        print("   ✅ Found: Infertility treatment exclusion")
    
    if 'experimental' in text_lower:
        potential_red_flags.append({
            'flag_type': 'exclusion',
            'severity': 'critical',
            'title': 'Experimental Treatments Excluded',
            'description': 'Experimental or investigational treatments are not covered',
            'source_text': 'Experimental treatments',
            'recommendation': 'Understand what treatments are considered experimental'
        })
        print("   ✅ Found: Experimental treatments exclusion")
    
    if 'out-of-network' in text_lower or 'out of network' in text_lower:
        potential_red_flags.append({
            'flag_type': 'network_limitation',
            'severity': 'medium',
            'title': 'Out-of-Network Limitations',
            'description': 'Out-of-network services may be denied or subject to higher cost-sharing',
            'source_text': 'Out-of-network services may be denied or subject to higher cost-sharing',
            'recommendation': 'Always verify provider network status before receiving care'
        })
        print("   ✅ Found: Out-of-network limitations")
    
    # Check for pre-authorization requirements
    if 'pre-authorization' in text_lower or 'preauthorization' in text_lower or 'prior authorization' in text_lower:
        potential_red_flags.append({
            'flag_type': 'preauth_required',
            'severity': 'medium',
            'title': 'Pre-authorization Required',
            'description': 'Certain services require pre-authorization before coverage',
            'source_text': 'Pre-authorization required',
            'recommendation': 'Always obtain pre-authorization for covered services to avoid claim denials'
        })
        print("   ✅ Found: Pre-authorization requirements")
    
    # Create the red flags in database
    created_count = 0
    for flag in potential_red_flags:
        try:
            cursor.execute("""
                INSERT INTO red_flags (
                    id, policy_id, flag_type, severity, title, description,
                    source_text, recommendation, confidence_score, detected_by, created_at
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
                );
            """, (
                policy_id, flag['flag_type'], flag['severity'], flag['title'],
                flag['description'], flag['source_text'], flag['recommendation'],
                0.95, 'auto_detected'
            ))
            created_count += 1
            print(f"   ✅ Created red flag: {flag['title']} ({flag['severity']})")
        except Exception as e:
            print(f"   ❌ Failed to create red flag '{flag['title']}': {str(e)}")
    
    cursor.close()
    return created_count

def verify_creation(conn):
    """Verify that the policy and red flags were created successfully"""
    print(f"\n🔍 Verification")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    try:
        # Check policies
        cursor.execute("SELECT COUNT(*) FROM insurance_policies;")
        policy_count = cursor.fetchone()[0]
        print(f"📋 Total Policies: {policy_count}")
        
        # Check red flags
        cursor.execute("SELECT COUNT(*) FROM red_flags;")
        flag_count = cursor.fetchone()[0]
        print(f"🚩 Total Red Flags: {flag_count}")
        
        if flag_count > 0:
            cursor.execute("""
                SELECT rf.title, rf.severity, rf.flag_type, ip.policy_name
                FROM red_flags rf
                JOIN insurance_policies ip ON rf.policy_id = ip.id
                ORDER BY rf.created_at DESC;
            """)
            
            flags = cursor.fetchall()
            print(f"\n🚩 Red Flags Created:")
            for flag in flags:
                title, severity, flag_type, policy_name = flag
                print(f"   - {title} ({severity}) - {policy_name}")
    
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
    
    cursor.close()

def main():
    print("🚩 US Insurance Platform - Create Policy & Red Flags")
    print("=" * 60)
    
    # Connect to database
    conn = connect_to_db()
    if not conn:
        return
    
    try:
        # Create policy from document
        policy_id = create_policy_from_document(conn)
        
        if policy_id:
            # Verify creation
            verify_creation(conn)
        else:
            print("❌ Failed to create policy and red flags")
        
    finally:
        conn.close()
        print("\n✅ Database connection closed.")

if __name__ == "__main__":
    main()
