import os
import uuid
import shutil
from typing import List, Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session, joinedload, selectinload
from datetime import datetime

from app import models, schemas
from app.core.config import settings


def is_valid_document(file: UploadFile) -> bool:
    """
    Check if uploaded file is a valid document type
    """
    valid_mime_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ]
    valid_extensions = [".pdf", ".doc", ".docx", ".txt"]
    
    # Check mime type
    if file.content_type not in valid_mime_types:
        # Check file extension as fallback
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in valid_extensions:
            return False
    
    return True


def save_upload_file(file: UploadFile, document_id: str) -> str:
    """
    Save uploaded file to disk and verify its contents
    """
    # Create uploads directory if it doesn't exist (use absolute path)
    # Get the backend directory (where this file is located)
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    base_upload_folder = os.path.join(backend_dir, settings.UPLOAD_FOLDER.lstrip('./'))
    upload_dir = os.path.join(base_upload_folder, str(document_id))
    os.makedirs(upload_dir, exist_ok=True)

    print(f"[DEBUG] Backend dir: {backend_dir}")
    print(f"[DEBUG] Base upload folder: {base_upload_folder}")
    print(f"[DEBUG] Upload dir: {upload_dir}")
    
    # Create file path
    file_ext = os.path.splitext(file.filename)[1].lower()
    file_path = os.path.join(upload_dir, f"original{file_ext}")
    
    # Save file
    file_size = 0
    with open(file_path, "wb") as buffer:
        chunk = file.file.read(8192)
        while chunk:
            file_size += len(chunk)
            buffer.write(chunk)
            chunk = file.file.read(8192)
    
    print(f"[DEBUG] File saved successfully. Size: {file_size} bytes")
    
    # Verify PDF content if it's a PDF
    if file_ext.lower() == '.pdf':
        try:
            import PyPDF2
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                num_pages = len(pdf_reader.pages)
                first_page_text = pdf_reader.pages[0].extract_text()
                print(f"[DEBUG] PDF verification - Pages: {num_pages}")
                print(f"[DEBUG] First page preview: {first_page_text[:200]}")
        except Exception as e:
            print(f"[WARNING] PDF verification failed: {str(e)}")
    
    return file_path


def create_document(
    db: Session, user_id: uuid.UUID, file: UploadFile, carrier_id: Optional[str] = None
) -> models.PolicyDocument:
    """
    Create new document record and save uploaded file
    """
    try:
        print(f"[DEBUG] create_document called with carrier_id: {carrier_id} (type: {type(carrier_id)})")
        print(f"[DEBUG] File details - filename: {file.filename}, content_type: {file.content_type}")

        # Generate new document ID
        document_id = uuid.uuid4()
        print(f"[DEBUG] Generated document_id: {document_id}")

        # Save uploaded file
        file_path = save_upload_file(file, document_id)
        print(f"[DEBUG] File saved to: {file_path}")

        # Read first few bytes to verify file content
        file.file.seek(0)
        first_bytes = file.file.read(1024)
        print(f"[DEBUG] First 1024 bytes of file: {first_bytes[:100]}")
        file.file.seek(0)  # Reset file pointer

        # Handle carrier_id conversion
        carrier_uuid = None
        if carrier_id and carrier_id.strip():
            try:
                carrier_uuid = uuid.UUID(carrier_id)
                print(f"[DEBUG] Converted carrier_id to UUID: {carrier_uuid}")
            except ValueError as e:
                print(f"[ERROR] Invalid carrier_id UUID format: {carrier_id}, error: {e}")
                raise ValueError(f"Invalid carrier_id format: {carrier_id}")

        # Create document record
        db_obj = models.PolicyDocument(
            id=document_id,
            user_id=user_id,
            carrier_id=carrier_uuid,
            original_filename=file.filename,
            file_path=file_path,
            file_size_bytes=os.path.getsize(file_path),
            mime_type=file.content_type or "application/octet-stream",
            upload_method="manual_upload",
            processing_status="pending"
        )

        print(f"[DEBUG] Created PolicyDocument object")

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        print(f"[DEBUG] Document saved to database with ID: {db_obj.id}")

        return db_obj

    except Exception as e:
        print(f"[ERROR] create_document failed: {str(e)}")
        print(f"[ERROR] Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise


def process_document_async(document_id: uuid.UUID) -> None:
    """
    Start asynchronous document processing
    
    In a production environment, this would be handled by a task queue
    like Celery. For the MVP, we'll implement a simple processing flow.
    """
    # In a production app, this would be:
    # from app.worker import process_document_task
    # process_document_task.delay(document_id)
    
    # For MVP, we'll implement a simpler approach to be replaced later
    import threading
    threading.Thread(target=process_document, args=(document_id,)).start()


def process_document(document_id: uuid.UUID) -> None:
    """
    Process document using the simplified pipeline.

    SIMPLIFIED FLOW:
    1. Extract text
    2. Extract policy data
    3. Create policy (if possible)

    NO COMPLEXITY. NO CONFUSION.
    """
    # Get database session
    from app.utils.db import SessionLocal
    db = SessionLocal()

    try:
        # Get document
        document = db.query(models.PolicyDocument).filter(models.PolicyDocument.id == document_id).first()
        if not document:
            print(f"[ERROR] Document not found: {document_id}")
            return

        print(f"[INFO] Processing document {document_id} with simplified processor")
        print(f"[INFO] File: {document.original_filename}, Path: {document.file_path}")

        # Use simplified processor
        from app.services.simplified_document_processor import simplified_document_processor

        result = simplified_document_processor.process_document(db, document)

        # Log result
        if result["success"]:
            print(f"[SUCCESS] Document processed: {result['status']}")
            if "policy_id" in result:
                print(f"[SUCCESS] Policy created: {result['policy_id']}")
        else:
            print(f"[ERROR] Document processing failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"[ERROR] Exception processing document: {e}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()


def _create_fallback_policy_data(document, text: str):
    """
    Create basic policy data when AI extraction fails
    Uses simple pattern matching and document metadata
    """
    from app.services.ai_policy_extraction_service import ExtractedPolicyData
    import re
    from datetime import date

    # Extract basic information using simple patterns
    policy_name = document.original_filename.replace('.pdf', '').replace('.txt', '').replace('_', ' ').title()

    # Try to extract policy number
    policy_number_match = re.search(r'policy\s*(?:number|#)?\s*:?\s*([A-Z0-9-]+)', text, re.IGNORECASE)
    policy_number = policy_number_match.group(1) if policy_number_match else None

    # Try to extract dates
    date_patterns = [
        r'effective\s*date\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
    ]

    effective_date = None
    for pattern in date_patterns:
        date_match = re.search(pattern, text, re.IGNORECASE)
        if date_match:
            try:
                date_str = date_match.group(1)
                # Simple date parsing - could be improved
                effective_date = date.today()  # Fallback to today
                break
            except:
                pass

    # Determine policy type from filename or content
    policy_type = "health"  # Default
    if any(word in text.lower() for word in ['dental', 'teeth', 'oral']):
        policy_type = "dental"
    elif any(word in text.lower() for word in ['vision', 'eye', 'optical']):
        policy_type = "vision"
    elif any(word in text.lower() for word in ['life insurance', 'life policy']):
        policy_type = "life"

    return ExtractedPolicyData(
        policy_name=policy_name,
        policy_type=policy_type,
        policy_number=policy_number,
        effective_date=effective_date,
        extraction_confidence=0.5,  # Medium confidence for fallback
        extraction_method="pattern_matching_fallback",
        extraction_errors=["AI extraction failed, using pattern matching fallback"]
    )


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from PDF using PyPDF2
    """
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        # If PyPDF2 fails, we could fall back to OCR with Tesseract
        # This would be implemented in Sprint 2 (US-007)
        return f"Error extracting text: {str(e)}"


def extract_text_from_txt(file_path: str) -> str:
    """
    Extract text from a text file
    """
    with open(file_path, "r", encoding="utf-8", errors="replace") as file:
        return file.read()


def get_document(db: Session, document_id: uuid.UUID) -> Optional[models.PolicyDocument]:
    """
    Get document by ID with eager loading of related data
    """
    return (
        db.query(models.PolicyDocument)
        .options(
            joinedload(models.PolicyDocument.carrier),
            selectinload(models.PolicyDocument.policies)
        )
        .filter(models.PolicyDocument.id == document_id)
        .first()
    )


def get_documents_by_user(
    db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> List[models.PolicyDocument]:
    """
    Get all documents for a user with eager loading of related data
    """
    return (
        db.query(models.PolicyDocument)
        .options(
            joinedload(models.PolicyDocument.carrier),
            selectinload(models.PolicyDocument.policies)
        )
        .filter(models.PolicyDocument.user_id == user_id)
        .order_by(models.PolicyDocument.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def delete_document(db: Session, document_id: uuid.UUID) -> None:
    """
    Delete document from database and file system
    """
    document = get_document(db, document_id)
    if document:
        # Delete file from disk
        try:
            os.remove(document.file_path)
            # Remove directory if empty
            os.rmdir(os.path.dirname(document.file_path))
        except Exception as e:
            print(f"Error deleting file: {e}")
        
        # Delete document from database
        db.delete(document)
        db.commit()
