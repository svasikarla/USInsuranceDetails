"""
Categorization models for benefits and red flags regulatory framework
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
import uuid
import enum


class RegulatoryLevel(enum.Enum):
    """Regulatory level classification"""
    FEDERAL = "federal"
    STATE = "state"
    FEDERAL_STATE = "federal_state"


class ProminentCategory(enum.Enum):
    """Prominent category classifications"""
    COVERAGE_ACCESS = "coverage_access"
    COST_FINANCIAL = "cost_financial"
    MEDICAL_NECESSITY_EXCLUSIONS = "medical_necessity_exclusions"
    PROCESS_ADMINISTRATIVE = "process_administrative"
    SPECIAL_POPULATIONS = "special_populations"


class FederalRegulation(enum.Enum):
    """Federal regulation types"""
    ACA_EHB = "aca_ehb"  # ACA Essential Health Benefits
    ERISA = "erisa"  # ERISA regulations
    FEDERAL_CONSUMER_PROTECTION = "federal_consumer_protection"
    MENTAL_HEALTH_PARITY = "mental_health_parity"
    PREVENTIVE_CARE = "preventive_care"
    EMERGENCY_SERVICES = "emergency_services"


class StateRegulation(enum.Enum):
    """State regulation types"""
    STATE_MANDATED_BENEFITS = "state_mandated_benefits"
    STATE_CONSUMER_PROTECTION = "state_consumer_protection"
    STATE_NETWORK_ADEQUACY = "state_network_adequacy"
    STATE_PRIOR_AUTH_LIMITS = "state_prior_auth_limits"
    STATE_COVERAGE_REQUIREMENTS = "state_coverage_requirements"


class BenefitCategory(Base):
    """
    Categorization framework for insurance benefits
    """
    __tablename__ = "benefit_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Primary categorization
    regulatory_level = Column(SQLEnum(RegulatoryLevel), nullable=False, index=True)
    prominent_category = Column(SQLEnum(ProminentCategory), nullable=False, index=True)
    
    # Regulatory specifics
    federal_regulation = Column(SQLEnum(FederalRegulation), nullable=True, index=True)
    state_regulation = Column(SQLEnum(StateRegulation), nullable=True, index=True)
    state_code = Column(String(2), nullable=True, index=True)  # US state code if state-specific
    
    # Category details
    category_name = Column(String(255), nullable=False)
    category_description = Column(Text, nullable=False)
    regulatory_context = Column(Text, nullable=True)
    
    # Visual indicators
    badge_color = Column(String(20), nullable=False, default="blue")
    icon_name = Column(String(50), nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)


class RedFlagCategory(Base):
    """
    Categorization framework for red flags
    """
    __tablename__ = "red_flag_categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Primary categorization
    regulatory_level = Column(SQLEnum(RegulatoryLevel), nullable=False, index=True)
    prominent_category = Column(SQLEnum(ProminentCategory), nullable=False, index=True)
    
    # Regulatory specifics
    federal_regulation = Column(SQLEnum(FederalRegulation), nullable=True, index=True)
    state_regulation = Column(SQLEnum(StateRegulation), nullable=True, index=True)
    state_code = Column(String(2), nullable=True, index=True)  # US state code if state-specific
    
    # Category details
    category_name = Column(String(255), nullable=False)
    category_description = Column(Text, nullable=False)
    regulatory_context = Column(Text, nullable=True)
    risk_level = Column(String(20), nullable=False, default="medium")  # low, medium, high, critical
    
    # Visual indicators
    badge_color = Column(String(20), nullable=False, default="red")
    icon_name = Column(String(50), nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
