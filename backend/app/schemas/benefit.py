from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class CoverageBenefitBase(BaseModel):
    benefit_category: str  # 'preventive', 'emergency', 'specialist', 'prescription'
    benefit_name: str
    coverage_percentage: Optional[Decimal] = None  # 0.00 to 100.00
    copay_amount: Optional[Decimal] = None
    coinsurance_percentage: Optional[Decimal] = None
    requires_preauth: bool = False
    network_restriction: Optional[str] = None  # 'in_network_only', 'out_of_network_allowed', 'no_restriction'
    annual_limit: Optional[Decimal] = None
    visit_limit: Optional[int] = None
    notes: Optional[str] = None

    # Categorization fields
    regulatory_level: Optional[Literal['federal', 'state', 'federal_state']] = None
    prominent_category: Optional[Literal['coverage_access', 'cost_financial', 'medical_necessity_exclusions', 'process_administrative', 'special_populations']] = None
    federal_regulation: Optional[Literal['aca_ehb', 'erisa', 'federal_consumer_protection', 'mental_health_parity', 'preventive_care', 'emergency_services']] = None
    state_regulation: Optional[Literal['state_mandated_benefits', 'state_consumer_protection', 'state_network_adequacy', 'state_prior_auth_limits', 'state_coverage_requirements']] = None
    state_code: Optional[str] = None  # US state code if state-specific
    regulatory_context: Optional[str] = None


class CoverageBenefitCreate(CoverageBenefitBase):
    policy_id: UUID


class CoverageBenefitUpdate(BaseModel):
    benefit_category: Optional[str] = None
    benefit_name: Optional[str] = None
    coverage_percentage: Optional[Decimal] = None
    copay_amount: Optional[Decimal] = None
    coinsurance_percentage: Optional[Decimal] = None
    requires_preauth: Optional[bool] = None
    network_restriction: Optional[str] = None
    annual_limit: Optional[Decimal] = None
    visit_limit: Optional[int] = None
    notes: Optional[str] = None


class CoverageBenefitInDBBase(CoverageBenefitBase):
    id: UUID
    policy_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CoverageBenefit(CoverageBenefitInDBBase):
    """Coverage benefit data returned to client"""
    pass
