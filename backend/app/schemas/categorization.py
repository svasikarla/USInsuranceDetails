"""
Categorization schemas for benefits and red flags regulatory framework
"""
from pydantic import BaseModel
from typing import Optional, Literal, List
from uuid import UUID
from datetime import datetime


# Enum-like types for categorization
RegulatoryLevel = Literal['federal', 'state', 'federal_state']
ProminentCategory = Literal['coverage_access', 'cost_financial', 'medical_necessity_exclusions', 'process_administrative', 'special_populations']
FederalRegulation = Literal['aca_ehb', 'erisa', 'federal_consumer_protection', 'mental_health_parity', 'preventive_care', 'emergency_services']
StateRegulation = Literal['state_mandated_benefits', 'state_consumer_protection', 'state_network_adequacy', 'state_prior_auth_limits', 'state_coverage_requirements']
RiskLevel = Literal['low', 'medium', 'high', 'critical']


class BenefitCategoryBase(BaseModel):
    regulatory_level: RegulatoryLevel
    prominent_category: ProminentCategory
    federal_regulation: Optional[FederalRegulation] = None
    state_regulation: Optional[StateRegulation] = None
    state_code: Optional[str] = None
    category_name: str
    category_description: str
    regulatory_context: Optional[str] = None
    badge_color: str = "blue"
    icon_name: Optional[str] = None
    is_active: bool = True


class BenefitCategoryCreate(BenefitCategoryBase):
    pass


class BenefitCategoryUpdate(BaseModel):
    regulatory_level: Optional[RegulatoryLevel] = None
    prominent_category: Optional[ProminentCategory] = None
    federal_regulation: Optional[FederalRegulation] = None
    state_regulation: Optional[StateRegulation] = None
    state_code: Optional[str] = None
    category_name: Optional[str] = None
    category_description: Optional[str] = None
    regulatory_context: Optional[str] = None
    badge_color: Optional[str] = None
    icon_name: Optional[str] = None
    is_active: Optional[bool] = None


class BenefitCategory(BenefitCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RedFlagCategoryBase(BaseModel):
    regulatory_level: RegulatoryLevel
    prominent_category: ProminentCategory
    federal_regulation: Optional[FederalRegulation] = None
    state_regulation: Optional[StateRegulation] = None
    state_code: Optional[str] = None
    category_name: str
    category_description: str
    regulatory_context: Optional[str] = None
    risk_level: RiskLevel = "medium"
    badge_color: str = "red"
    icon_name: Optional[str] = None
    is_active: bool = True


class RedFlagCategoryCreate(RedFlagCategoryBase):
    pass


class RedFlagCategoryUpdate(BaseModel):
    regulatory_level: Optional[RegulatoryLevel] = None
    prominent_category: Optional[ProminentCategory] = None
    federal_regulation: Optional[FederalRegulation] = None
    state_regulation: Optional[StateRegulation] = None
    state_code: Optional[str] = None
    category_name: Optional[str] = None
    category_description: Optional[str] = None
    regulatory_context: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    badge_color: Optional[str] = None
    icon_name: Optional[str] = None
    is_active: Optional[bool] = None


class RedFlagCategory(RedFlagCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategorizationFilter(BaseModel):
    """Filter for categorized benefits and red flags"""
    regulatory_level: Optional[List[RegulatoryLevel]] = None
    prominent_category: Optional[List[ProminentCategory]] = None
    federal_regulation: Optional[List[FederalRegulation]] = None
    state_regulation: Optional[List[StateRegulation]] = None
    state_code: Optional[str] = None
    risk_level: Optional[List[RiskLevel]] = None


class CategorizationSummary(BaseModel):
    """Summary of categorization statistics"""
    total_items: int
    by_regulatory_level: dict[RegulatoryLevel, int]
    by_prominent_category: dict[ProminentCategory, int]
    by_federal_regulation: dict[FederalRegulation, int]
    by_state_regulation: dict[StateRegulation, int]
    by_risk_level: dict[RiskLevel, int]  # For red flags only


class CategorizedBenefit(BaseModel):
    """Benefit with categorization information"""
    benefit: 'CoverageBenefit'
    category: Optional[BenefitCategory] = None
    regulatory_badges: List[str]
    visual_indicators: dict


class CategorizedRedFlag(BaseModel):
    """Red flag with categorization information"""
    red_flag: 'RedFlag'
    category: Optional[RedFlagCategory] = None
    regulatory_badges: List[str]
    visual_indicators: dict
    risk_indicators: dict
