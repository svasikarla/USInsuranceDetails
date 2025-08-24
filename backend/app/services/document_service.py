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


def save_upload_file(file: UploadFile, document_id: uuid.UUID) -> str:
    """
    Save uploaded file to disk
    """
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_FOLDER, str(document_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Create file path
    file_ext = os.path.splitext(file.filename)[1].lower()
    file_path = os.path.join(upload_dir, f"original{file_ext}")
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return file_path


def create_document(
    db: Session, user_id: uuid.UUID, file: UploadFile, carrier_id: Optional[str] = None
) -> models.PolicyDocument:
    """
    Create new document record and save uploaded file
    """
    try:
        print(f"[DEBUG] create_document called with carrier_id: {carrier_id} (type: {type(carrier_id)})")

        # Generate new document ID
        document_id = uuid.uuid4()
        print(f"[DEBUG] Generated document_id: {document_id}")

        # Save uploaded file
        file_path = save_upload_file(file, document_id)
        print(f"[DEBUG] File saved to: {file_path}")

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
    Process document and extract text, then attempt automatic policy creation

    This pipeline includes:
    1. PDF text extraction
    2. OCR for scanned documents
    3. Text normalization
    4. AI-powered policy data extraction
    5. Automatic policy creation (if confidence is high enough)
    """
    # Get database session
    from app.utils.db import SessionLocal
    db = SessionLocal()

    try:
        # Get document
        document = db.query(models.PolicyDocument).filter(models.PolicyDocument.id == document_id).first()
        if not document:
            print(f"Document not found: {document_id}")
            return

        # Get user for policy creation
        user = db.query(models.User).filter(models.User.id == document.user_id).first()
        if not user:
            print(f"User not found for document: {document_id}")
            return

        # Update status to processing
        document.processing_status = "processing"
        db.commit()

        # Extract text from document based on mime type
        try:
            if document.mime_type == "application/pdf" or document.file_path.endswith(".pdf"):
                text = extract_text_from_pdf(document.file_path)
            elif document.mime_type == "text/plain" or document.file_path.endswith(".txt"):
                text = extract_text_from_txt(document.file_path)
            else:
                text = f"Text extraction not yet implemented for {document.mime_type}"

            # Update document with extracted text
            document.extracted_text = text
            document.processing_status = "completed"
            document.processed_at = datetime.utcnow()
            document.ocr_confidence_score = 1.0  # Default for text extraction

            db.commit()

            print(f"[DEBUG] Text extraction completed for document {document_id}")
            print(f"[DEBUG] Extracted text length: {len(text)} characters")

            # Attempt automatic policy extraction and creation if text extraction was successful
            if text and len(text.strip()) > 100:  # Only if we have substantial text
                try:
                    print(f"[DEBUG] Starting automatic policy extraction for document {document_id}")
                    from app.services.auto_policy_creation_service import auto_policy_creation_service
                    from app.services.ai_policy_extraction_service import ai_policy_extraction_service

                    # Refresh document to get latest state
                    db.refresh(document)

                    # Step 1: Extract policy data with timeout and fallback
                    document.auto_creation_status = "extracting"
                    db.commit()

                    print(f"[DEBUG] Extracting policy data for document {document_id}")

                    # Try AI extraction with timeout
                    extracted_data = None
                    try:
                        extracted_data = ai_policy_extraction_service.extract_policy_data(document)
                    except Exception as ai_error:
                        print(f"[WARNING] AI extraction failed: {str(ai_error)}")
                        # Create basic policy with minimal data as fallback
                        extracted_data = _create_fallback_policy_data(document, text)

                    if extracted_data:
                        # Store extracted data in the document
                        document.extracted_policy_data = extracted_data.__dict__
                        document.auto_creation_confidence = extracted_data.extraction_confidence

                        print(f"[DEBUG] Extraction completed with confidence {extracted_data.extraction_confidence:.2f}")

                        # Step 2: Determine next action based on confidence
                        if extracted_data.extraction_confidence >= 0.8:
                            # High confidence - attempt automatic creation
                            print(f"[DEBUG] High confidence ({extracted_data.extraction_confidence:.2f}) - attempting auto-creation")
                            try:
                                creation_result = auto_policy_creation_service.process_document_for_auto_creation(
                                    db=db, document=document, user=user
                                )

                                if creation_result.success:
                                    document.auto_creation_status = "completed"
                                    print(f"[SUCCESS] Auto-created policy {creation_result.policy_id} for document {document_id}")
                                else:
                                    document.auto_creation_status = "ready_for_review"
                                    print(f"[INFO] Auto-creation failed, marked for review: {creation_result.validation_errors}")
                            except Exception as creation_error:
                                print(f"[ERROR] Policy creation failed: {str(creation_error)}")
                                document.auto_creation_status = "ready_for_review"
                        elif extracted_data.extraction_confidence >= 0.3:
                            # Medium confidence - mark for user review
                            document.auto_creation_status = "ready_for_review"
                            print(f"[INFO] Medium confidence ({extracted_data.extraction_confidence:.2f}) - marked for user review")
                        else:
                            # Low confidence - create basic policy anyway for user to edit
                            print(f"[INFO] Low confidence ({extracted_data.extraction_confidence:.2f}) - creating basic policy for user review")
                            try:
                                creation_result = auto_policy_creation_service.process_document_for_auto_creation(
                                    db=db, document=document, user=user
                                )
                                if creation_result.success:
                                    document.auto_creation_status = "completed"
                                    print(f"[SUCCESS] Created basic policy {creation_result.policy_id} for user review")
                                else:
                                    document.auto_creation_status = "ready_for_review"
                                    print(f"[INFO] Basic policy creation failed, marked for review")
                            except Exception as creation_error:
                                print(f"[ERROR] Basic policy creation failed: {str(creation_error)}")
                                document.auto_creation_status = "ready_for_review"
                    else:
                        # No extracted data
                        document.auto_creation_status = "failed"
                        document.auto_creation_confidence = 0.0
                        print(f"[ERROR] No policy data extracted for document {document_id}")

                    db.commit()

                except Exception as auto_create_error:
                    print(f"[WARNING] Automatic policy extraction failed for document {document_id}: {str(auto_create_error)}")
                    document.auto_creation_status = "failed"
                    db.commit()
                    # Don't fail the entire document processing if auto-creation fails
                    pass
            else:
                print(f"[INFO] Skipping auto policy creation - insufficient text content")

        except Exception as e:
            print(f"[ERROR] Text extraction failed for document {document_id}: {str(e)}")
            document.processing_status = "failed"
            document.processing_error = str(e)
            db.commit()
        
    except Exception as e:
        print(f"Error processing document: {e}")
    
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
