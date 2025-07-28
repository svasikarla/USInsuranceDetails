from sqlalchemy import Column, String, BigInteger, Text, ForeignKey, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import Base, BaseModel
import uuid

class PolicyDocument(Base, BaseModel):
    __tablename__ = "policy_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("insurance_carriers.id"))
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    upload_method = Column(String(50), nullable=False)  # 'manual_upload', 'api_fetch', 'email_import'
    processing_status = Column(String(50), default="pending", index=True)  # 'pending', 'processing', 'completed', 'failed', 'auto_policy_pending'
    processing_error = Column(Text)
    extracted_text = Column(Text)
    ocr_confidence_score = Column(Numeric(5, 4))  # 0.0000 to 1.0000
    processed_at = Column(DateTime)

    # Enhanced fields for automatic policy creation
    extracted_policy_data = Column(JSONB)  # Store extracted policy data as JSON
    auto_creation_status = Column(String(50), index=True)  # 'not_attempted', 'extracting', 'ready_for_review', 'creating', 'completed', 'failed'
    auto_creation_confidence = Column(Numeric(5, 4))  # Overall confidence score for auto-creation
    user_reviewed_at = Column(DateTime)  # When user reviewed the extracted data
    
    # Relationships
    user = relationship("User", backref="documents")
    carrier = relationship("InsuranceCarrier", backref="documents")
