from pydantic import BaseModel
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class RedFlagBase(BaseModel):
    flag_type: str  # 'preauth_required', 'coverage_limitation', 'exclusion', 'network_limitation'
    severity: str  # 'high', 'medium', 'low'
    title: str
    description: str
    source_text: Optional[str] = None
    page_number: Optional[str] = None
    recommendation: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    detected_by: str = 'system'  # 'system', 'manual', 'ai'

    # Categorization fields
    regulatory_level: Optional[Literal['federal', 'state', 'federal_state']] = None
    prominent_category: Optional[Literal['coverage_access', 'cost_financial', 'medical_necessity_exclusions', 'process_administrative', 'special_populations']] = None
    federal_regulation: Optional[Literal['aca_ehb', 'erisa', 'federal_consumer_protection', 'mental_health_parity', 'preventive_care', 'emergency_services']] = None
    state_regulation: Optional[Literal['state_mandated_benefits', 'state_consumer_protection', 'state_network_adequacy', 'state_prior_auth_limits', 'state_coverage_requirements']] = None
    state_code: Optional[str] = None  # US state code if state-specific
    regulatory_context: Optional[str] = None
    risk_level: Optional[Literal['low', 'medium', 'high', 'critical']] = 'medium'


class RedFlagCreate(RedFlagBase):
    policy_id: UUID


class RedFlagUpdate(BaseModel):
    flag_type: Optional[str] = None
    severity: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    source_text: Optional[str] = None
    page_number: Optional[str] = None
    recommendation: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    detected_by: Optional[str] = None


class RedFlagInDBBase(RedFlagBase):
    id: UUID
    policy_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class RedFlag(RedFlagInDBBase):
    """Red flag data returned to client"""
    pass
