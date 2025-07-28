from sqlalchemy import Column, String, Text, ForeignKey, Numeric, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
from .categorization import RegulatoryLevel, ProminentCategory, FederalRegulation, StateRegulation
import uuid

class RedFlag(Base):
    __tablename__ = "red_flags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("insurance_policies.id", ondelete="CASCADE"), nullable=False, index=True)
    flag_type = Column(String(50), nullable=False)  # 'preauth_required', 'coverage_limitation', 'exclusion', 'network_limitation'
    severity = Column(String(20), nullable=False, index=True)  # 'high', 'medium', 'low'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    source_text = Column(Text)  # The original text that triggered the flag
    page_number = Column(String(10))
    recommendation = Column(Text)
    confidence_score = Column(Numeric(5, 4))  # AI confidence in detection
    detected_by = Column(String(50), default='system')  # 'system', 'manual', 'ai'

    # Categorization fields
    regulatory_level = Column(String(20), nullable=True, index=True)  # federal, state, federal_state
    prominent_category = Column(String(50), nullable=True, index=True)  # coverage_access, cost_financial, etc.
    federal_regulation = Column(String(50), nullable=True, index=True)  # aca_ehb, erisa, etc.
    state_regulation = Column(String(50), nullable=True, index=True)  # state_mandated_benefits, etc.
    state_code = Column(String(2), nullable=True, index=True)  # US state code if state-specific
    regulatory_context = Column(Text, nullable=True)  # Explanation of regulatory context
    risk_level = Column(String(20), nullable=True, default="medium")  # low, medium, high, critical

    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    policy = relationship("InsurancePolicy", back_populates="red_flags")
