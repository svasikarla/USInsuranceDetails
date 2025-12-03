from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app import schemas
from app.utils.db import get_db
from app.services import document_service
from app.core.dependencies import get_current_user
from app.schemas.policy_extraction import AutoPolicyCreationResponse

router = APIRouter()


@router.post("/upload", response_model=schemas.PolicyDocument)
async def upload_document(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    carrier_id: str = Form(None),
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Upload a new insurance policy document for processing
    """
    try:
        print(f"[DEBUG] Upload request - filename: {file.filename}, content_type: {file.content_type}, carrier_id: {carrier_id}")

        # Validate file type
        if not document_service.is_valid_document(file):
            print(f"[DEBUG] File validation failed for {file.filename}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only PDF, DOCX, and TXT files are supported.",
            )

        print(f"[DEBUG] File validation passed for {file.filename}")

        # Create document in database and save file
        document = document_service.create_document(
            db=db,
            user_id=current_user.id,
            file=file,
            carrier_id=carrier_id if carrier_id else None,
        )

        print(f"[DEBUG] Document created successfully with ID: {document.id}")

        # Start async processing
        document_service.process_document_async(document.id)

        return document

    except Exception as e:
        print(f"[ERROR] Upload failed: {str(e)}")
        print(f"[ERROR] Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise


@router.get("", response_model=List[schemas.PolicyDocument])
async def get_documents(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all documents for the current user
    """
    documents = document_service.get_documents_by_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return documents


@router.get("/{document_id}", response_model=schemas.PolicyDocumentWithText)
async def get_document(
    *,
    db: Session = Depends(get_db),
    document_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve a specific document by ID
    """
    document = document_service.get_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Verify document ownership
    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this document",
        )
    
    return document


@router.get("/{document_id}/complete", response_model=schemas.CompleteDocumentData)
async def get_document_complete(
    *,
    response: Response,
    db: Session = Depends(get_db),
    document_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve complete document data in a single optimized request.
    Includes document details, associated policies, and processing status.
    OPTIMIZED: Single consolidated endpoint to reduce API calls and improve performance.
    """
    from datetime import datetime

    # Set caching headers for better performance
    response.headers["Cache-Control"] = "public, max-age=600"  # 10 minutes cache
    response.headers["ETag"] = f"document-{document_id}-{int(datetime.utcnow().timestamp() // 600)}"

    # Get document with text content
    document = document_service.get_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Verify document ownership
    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this document",
        )

    # Get associated policies for this document
    from app.services import policy_service
    associated_policies = policy_service.get_policies_by_document(db=db, document_id=document_id)

    # Get carrier information if available
    carrier = None
    if document.carrier_id:
        from app.services import carrier_service
        carrier = carrier_service.get_carrier(db=db, carrier_id=document.carrier_id)

    # Get processing status and any error information (using consistent field names)
    processing_status = {
        "status": document.processing_status,
        "processing_progress": getattr(document, 'processing_progress', 0),
        "error_message": getattr(document, 'processing_error', None),
        "processed_at": document.processed_at if document.processing_status == "completed" else None
    }

    return schemas.CompleteDocumentData(
        document=document,
        associated_policies=associated_policies,
        carrier=carrier,
        processing_status=processing_status
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    *,
    db: Session = Depends(get_db),
    document_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
):
    """
    Delete a document
    """
    document = document_service.get_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Verify document ownership
    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this document",
        )
    
    document_service.delete_document(db=db, document_id=document_id)
    return None


@router.get("/{document_id}/policy-status")
async def get_document_policy_status(
    *,
    db: Session = Depends(get_db),
    document_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Get the automatic policy creation status for a document
    """
    document = document_service.get_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this document",
        )

    # Check if a policy was auto-created for this document
    from app.services.policy_service import get_policies_by_document
    policies = get_policies_by_document(db=db, document_id=document_id)

    return {
        "document_id": str(document_id),
        "processing_status": document.processing_status,
        "has_auto_created_policy": len(policies) > 0,
        "policies": [{"id": str(p.id), "name": p.policy_name, "type": p.policy_type} for p in policies],
        "processed_at": document.processed_at,
        "extraction_confidence": document.ocr_confidence_score
    }


@router.post("/{document_id}/create-policy")
async def trigger_policy_creation(
    *,
    db: Session = Depends(get_db),
    document_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
    force_creation: bool = False
) -> AutoPolicyCreationResponse:
    """
    Manually trigger automatic policy creation for a document
    """
    document = document_service.get_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this document",
        )

    if document.processing_status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document processing must be completed before policy creation",
        )

    # Trigger automatic policy creation
    from app.services.auto_policy_creation_service import auto_policy_creation_service
    from app.schemas.policy_extraction import PolicyCreationWorkflow

    workflow = PolicyCreationWorkflow()
    if force_creation:
        workflow.auto_create_threshold = 0.3  # Lower threshold for forced creation

    result = auto_policy_creation_service.process_document_for_auto_creation(
        db=db, document=document, user=current_user, workflow=workflow
    )

    return result


@router.get("/{document_id}/extracted-policy-data")
async def get_extracted_policy_data(
    *,
    db: Session = Depends(get_db),
    document_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Get extracted policy data for user review
    """
    document = document_service.get_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this document",
        )

    return {
        "document_id": document.id,
        "auto_creation_status": document.auto_creation_status,
        "auto_creation_confidence": float(document.auto_creation_confidence) if document.auto_creation_confidence else 0.0,
        "extracted_policy_data": document.extracted_policy_data,
        "user_reviewed_at": document.user_reviewed_at,
        "processing_status": document.processing_status,
        "processing_error": document.processing_error,
        # Diagnostic information
        "has_extracted_text": bool(document.extracted_text),
        "extracted_text_length": len(document.extracted_text) if document.extracted_text else 0,
        "file_size_bytes": document.file_size_bytes,
        "mime_type": document.mime_type,
        "original_filename": document.original_filename
    }


@router.post("/{document_id}/create-policy-from-review")
async def create_policy_from_review(
    *,
    db: Session = Depends(get_db),
    document_id: UUID,
    policy_data: dict,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Create policy from user-reviewed extracted data
    """
    document = document_service.get_document(db=db, document_id=document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this document",
        )

    if document.auto_creation_status != "ready_for_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document is not ready for review",
        )

    try:
        # Mark as reviewed
        document.user_reviewed_at = datetime.utcnow()
        document.auto_creation_status = "creating"
        db.commit()

        # Create policy using the reviewed data
        from app.services.policy_service import create_policy
        from app.schemas.policy import InsurancePolicyCreate

        # Convert reviewed data to policy creation schema
        policy_create_data = InsurancePolicyCreate(
            document_id=document_id,
            **policy_data
        )

        policy = create_policy(db=db, obj_in=policy_create_data, user_id=current_user.id)

        # Update status to completed
        document.auto_creation_status = "completed"
        db.commit()

        return {
            "success": True,
            "policy_id": policy.id,
            "message": "Policy created successfully from reviewed data"
        }

    except Exception as e:
        document.auto_creation_status = "failed"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create policy: {str(e)}",
        )
