from sqlalchemy import Column, String, Boolean, Text, ForeignKey, Numeric, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
from .categorization import RegulatoryLevel, ProminentCategory, FederalRegulation, StateRegulation
import uuid

class CoverageBenefit(Base):
    __tablename__ = "coverage_benefits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("insurance_policies.id", ondelete="CASCADE"), nullable=False)
    benefit_category = Column(String(100), nullable=False)  # 'preventive', 'emergency', 'specialist', 'prescription'
    benefit_name = Column(String(255), nullable=False)
    coverage_percentage = Column(Numeric(5, 2))  # 0.00 to 100.00
    copay_amount = Column(Numeric(10, 2))
    coinsurance_percentage = Column(Numeric(5, 2))
    requires_preauth = Column(Boolean, default=False)
    network_restriction = Column(String(50))  # 'in_network_only', 'out_of_network_allowed', 'no_restriction'
    annual_limit = Column(Numeric(10, 2))
    visit_limit = Column(Integer)
    notes = Column(Text)

    # Categorization fields
    regulatory_level = Column(String(20), nullable=True, index=True)  # federal, state, federal_state
    prominent_category = Column(String(50), nullable=True, index=True)  # coverage_access, cost_financial, etc.
    federal_regulation = Column(String(50), nullable=True, index=True)  # aca_ehb, erisa, etc.
    state_regulation = Column(String(50), nullable=True, index=True)  # state_mandated_benefits, etc.
    state_code = Column(String(2), nullable=True, index=True)  # US state code if state-specific
    regulatory_context = Column(Text, nullable=True)  # Explanation of regulatory context

    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    policy = relationship("InsurancePolicy", back_populates="benefits")
