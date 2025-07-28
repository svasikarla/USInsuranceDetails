#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.utils.db import SessionLocal
from backend.app.models.document import PolicyDocument
from backend.app.models.policy import InsurancePolicy
from backend.app.models.red_flag import RedFlag

def main():
    db = SessionLocal()
    
    try:
        # Check documents
        docs = db.query(PolicyDocument).all()
        print(f'Total documents: {len(docs)}')
        for doc in docs:
            print(f'  - {doc.original_filename}: {doc.processing_status}')
            if doc.extracted_text:
                print(f'    Text length: {len(doc.extracted_text)} chars')
                print(f'    Text preview: {doc.extracted_text[:200]}...')
        
        # Check policies
        policies = db.query(InsurancePolicy).all()
        print(f'\nTotal policies: {len(policies)}')
        for policy in policies:
            print(f'  - {policy.policy_name}: {policy.policy_type}')
        
        # Check red flags
        red_flags = db.query(RedFlag).all()
        print(f'\nTotal red flags: {len(red_flags)}')
        for flag in red_flags:
            print(f'  - {flag.title}: {flag.severity} ({flag.flag_type})')
            
    finally:
        db.close()

if __name__ == "__main__":
    main()
