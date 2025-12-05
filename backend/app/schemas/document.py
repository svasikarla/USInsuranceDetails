from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class PolicyDocumentBase(BaseModel):
    original_filename: str
    upload_method: str = "manual_upload"  # 'manual_upload', 'api_fetch', 'email_import'


class PolicyDocumentCreate(PolicyDocumentBase):
    carrier_id: Optional[UUID] = None


class PolicyDocumentUpdate(BaseModel):
    carrier_id: Optional[UUID] = None
    processing_status: Optional[str] = None
    processing_error: Optional[str] = None
    extracted_text: Optional[str] = None
    ocr_confidence_score: Optional[float] = None
    processed_at: Optional[datetime] = None
    # Enhanced fields for automatic policy creation
    extracted_policy_data: Optional[Dict[str, Any]] = None
    auto_creation_status: Optional[str] = None
    auto_creation_confidence: Optional[float] = None
    user_reviewed_at: Optional[datetime] = None


class PolicyDocumentInDBBase(PolicyDocumentBase):
    id: UUID
    user_id: UUID
    carrier_id: Optional[UUID] = None
    file_path: str
    file_size_bytes: int
    mime_type: str
    processing_status: str  # 'pending', 'processing', 'completed', 'failed', 'auto_policy_pending'
    processing_error: Optional[str] = None
    ocr_confidence_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    # Enhanced fields for automatic policy creation
    extracted_policy_data: Optional[Dict[str, Any]] = None
    auto_creation_status: Optional[str] = None  # 'not_attempted', 'extracting', 'ready_for_review', 'creating', 'completed', 'failed'
    auto_creation_confidence: Optional[float] = None
    user_reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PolicyDocument(PolicyDocumentInDBBase):
    """Policy document data returned to client"""
    pass


class PolicyDocumentWithText(PolicyDocument):
    """Policy document with extracted text"""
    extracted_text: Optional[str] = None


class PolicyDocumentWithExtractedData(PolicyDocument):
    """Policy document with extracted policy data for review"""
    extracted_text: Optional[str] = None
    extracted_policy_data: Optional[Dict[str, Any]] = None


class ProcessingStage(BaseModel):
    """Individual processing stage information"""
    name: str  # 'upload', 'extraction', 'ai_analysis', 'policy_creation'
    status: str  # 'pending', 'in_progress', 'completed', 'failed'
    progress_percentage: int = 0
    message: Optional[str] = None
    completed_at: Optional[datetime] = None


class DocumentProcessingStatus(BaseModel):
    """
    Enhanced document processing status with detailed stage information.
    Used for real-time status updates on the status page.
    """
    document_id: UUID
    overall_status: str  # 'pending', 'processing', 'completed', 'failed'
    overall_progress: int  # 0-100
    current_stage: str  # Current processing stage name
    stages: List[ProcessingStage]

    # Processing results
    extraction_confidence: Optional[float] = None
    auto_creation_status: Optional[str] = None
    auto_creation_confidence: Optional[float] = None

    # Routing information
    should_review: bool = False
    policy_created: bool = False
    policy_id: Optional[UUID] = None

    # Timing
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # Messages
    error_message: Optional[str] = None
    info_message: Optional[str] = None


class CompleteDocumentData(BaseModel):
    """
    Complete document data schema for optimized single-request endpoint.
    Includes all necessary data to render document details without additional API calls.
    """
    document: PolicyDocumentWithText
    associated_policies: List["InsurancePolicy"]  # Forward reference
    carrier: Optional["InsuranceCarrier"] = None  # Forward reference
    processing_status: Dict[str, Any]

    model_config = {"from_attributes": True}
