#!/usr/bin/env python3
"""
Reprocess existing documents to trigger automatic policy creation

This script reprocesses existing documents that were uploaded before
the automatic policy creation pipeline was implemented.
"""

import sys
import os
import uuid
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.utils.db import SessionLocal
    from app.models import PolicyDocument, User, InsurancePolicy
    from app.services.auto_policy_creation_service import auto_policy_creation_service
    from app.schemas.policy_extraction import PolicyCreationWorkflow
except ImportError as e:
    print(f"❌ Import error: {str(e)}")
    print("Please ensure you're running this from the project root directory")
    print("and that the backend dependencies are installed.")
    sys.exit(1)


def reprocess_document(document_id: str, force_creation: bool = False):
    """Reprocess a specific document for automatic policy creation"""
    print(f"🔄 Reprocessing document: {document_id}")
    
    db = SessionLocal()
    try:
        # Get the document
        document = db.query(PolicyDocument).filter(
            PolicyDocument.id == uuid.UUID(document_id)
        ).first()
        
        if not document:
            print(f"❌ Document not found: {document_id}")
            return False
        
        # Get the user
        user = db.query(User).filter(User.id == document.user_id).first()
        if not user:
            print(f"❌ User not found for document: {document_id}")
            return False
        
        print(f"📄 Document: {document.original_filename}")
        print(f"👤 User: {user.email}")
        print(f"📊 Processing Status: {document.processing_status}")
        print(f"📝 Text Length: {len(document.extracted_text) if document.extracted_text else 0} characters")
        
        # Check if policy already exists
        existing_policies = db.query(InsurancePolicy).filter(
            InsurancePolicy.document_id == document.id
        ).all()
        
        if existing_policies and not force_creation:
            print(f"ℹ️  Policy already exists for this document:")
            for policy in existing_policies:
                print(f"   - {policy.policy_name} (ID: {policy.id})")
            print("   Use force_creation=True to create another policy")
            return True
        
        # Check if document is ready for processing
        if document.processing_status != "completed":
            print(f"❌ Document processing not completed: {document.processing_status}")
            return False
        
        if not document.extracted_text or len(document.extracted_text.strip()) < 100:
            print(f"❌ Insufficient text content for policy creation")
            return False
        
        # Configure workflow for reprocessing
        workflow = PolicyCreationWorkflow()
        if force_creation:
            workflow.auto_create_threshold = 0.3  # Lower threshold for forced creation
            workflow.review_required_threshold = 0.2
        
        print(f"🤖 Starting automatic policy creation...")
        print(f"   Auto-create threshold: {workflow.auto_create_threshold}")
        print(f"   Review threshold: {workflow.review_required_threshold}")
        
        # Trigger automatic policy creation
        result = auto_policy_creation_service.process_document_for_auto_creation(
            db=db, document=document, user=user, workflow=workflow
        )
        
        print(f"\n📊 Results:")
        print(f"   Success: {result.success}")
        print(f"   Policy ID: {result.policy_id}")
        print(f"   Confidence Score: {result.confidence_score:.2f}")
        print(f"   Requires Review: {result.requires_review}")
        
        # Show extracted data
        extracted = result.extracted_data
        print(f"\n📋 Extracted Data:")
        print(f"   Policy Name: {extracted.policy_name}")
        print(f"   Policy Type: {extracted.policy_type}")
        print(f"   Deductible (Individual): ${extracted.deductible_individual}")
        print(f"   Premium (Monthly): ${extracted.premium_monthly}")
        print(f"   Premium (Annual): ${extracted.premium_annual}")
        print(f"   Extraction Method: {extracted.extraction_method}")
        print(f"   Extraction Confidence: {extracted.extraction_confidence:.2f}")
        
        # Show validation results
        if result.validation_errors:
            print(f"\n❌ Validation Errors:")
            for error in result.validation_errors:
                print(f"   - {error}")
        
        if result.warnings:
            print(f"\n⚠️  Warnings:")
            for warning in result.warnings:
                print(f"   - {warning}")
        
        return result.success
        
    except Exception as e:
        print(f"❌ Error reprocessing document: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def reprocess_all_documents(force_creation: bool = False):
    """Reprocess all completed documents without policies"""
    print("🔄 Reprocessing all eligible documents...")
    
    db = SessionLocal()
    try:
        # Find documents that are completed but don't have policies
        query = """
        SELECT pd.id, pd.original_filename, pd.processing_status, 
               COUNT(ip.id) as policy_count
        FROM policy_documents pd
        LEFT JOIN insurance_policies ip ON pd.id = ip.document_id
        WHERE pd.processing_status = 'completed'
        GROUP BY pd.id, pd.original_filename, pd.processing_status
        """
        
        if not force_creation:
            query += " HAVING COUNT(ip.id) = 0"
        
        result = db.execute(query)
        documents = result.fetchall()
        
        print(f"📊 Found {len(documents)} documents to process")
        
        success_count = 0
        for doc in documents:
            print(f"\n{'='*60}")
            if reprocess_document(str(doc.id), force_creation):
                success_count += 1
        
        print(f"\n{'='*60}")
        print(f"📊 Summary: {success_count}/{len(documents)} documents processed successfully")
        
        return success_count == len(documents)
        
    except Exception as e:
        print(f"❌ Error in batch reprocessing: {str(e)}")
        return False
    finally:
        db.close()


def main():
    """Main function"""
    print("🔄 Document Reprocessing Tool")
    print("=" * 60)
    
    # Configuration
    TARGET_DOCUMENT_ID = "e177f655-02d3-484c-9f3c-cd9898c6b977"
    FORCE_CREATION = True  # Set to True to create policy even if one exists
    
    print(f"🎯 Target Document: {TARGET_DOCUMENT_ID}")
    print(f"🔧 Force Creation: {FORCE_CREATION}")
    
    # Test single document reprocessing
    print(f"\n📋 Testing Single Document Reprocessing...")
    success = reprocess_document(TARGET_DOCUMENT_ID, FORCE_CREATION)
    
    if success:
        print(f"\n✅ Document reprocessing completed successfully!")
        print(f"   The automatic policy creation pipeline is now working.")
        
        # Verify results in database
        print(f"\n📊 Verification:")
        print(f"   Check the database for:")
        print(f"   1. New policy record in insurance_policies table")
        print(f"   2. Red flags in red_flags table")
        print(f"   3. Benefits in coverage_benefits table (if implemented)")
        
    else:
        print(f"\n❌ Document reprocessing failed.")
        print(f"   Check the error messages above for details.")
    
    return success


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n⚠️  Process interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)
