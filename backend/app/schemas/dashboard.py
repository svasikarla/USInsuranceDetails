from pydantic import BaseModel
from typing import List, Dict, Optional
from .red_flag import RedFlag
from .policy import InsurancePolicy

class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    timestamp: str

class DashboardPolicy(BaseModel):
    """Lightweight policy object for dashboard display"""
    id: str
    policy_name: str
    policy_type: Optional[str] = None
    created_at: str
    carrier_name: Optional[str] = None
    carrier_code: Optional[str] = None

class DashboardRedFlag(BaseModel):
    """Lightweight red flag object for dashboard display"""
    id: str
    policy_id: str
    title: str
    severity: str
    flag_type: str
    description: str
    created_at: str
    policy_name: str

class RedFlagsSummary(BaseModel):
    total: int
    by_severity: Dict[str, int]
    by_risk_level: Dict[str, int]
    by_regulatory_level: Dict[str, int]
    by_prominent_category: Dict[str, int]

class BenefitsSummary(BaseModel):
    total: int
    by_regulatory_level: Dict[str, int]
    by_prominent_category: Dict[str, int]
    by_federal_regulation: Dict[str, int]

class CategorizationSummary(BaseModel):
    total_categorized_items: int
    benefits_summary: BenefitsSummary
    red_flags_summary: RedFlagsSummary
    regulatory_compliance_score: float
    top_regulatory_concerns: List[str]
    coverage_gaps: List[str]

class DashboardSummary(BaseModel):
    total_policies: int
    total_documents: int
    policies_by_type: Dict[str, int]
    policies_by_carrier: Dict[str, int]
    recent_activity: List[ActivityItem]
    red_flags_summary: RedFlagsSummary
    recent_red_flags: List[DashboardRedFlag]  # Use lightweight red flag objects
    recent_policies: List[DashboardPolicy]    # Use lightweight policy objects
    categorization_summary: CategorizationSummary

    model_config = {"from_attributes": True}


class CompleteDashboardData(BaseModel):
    """
    Complete dashboard data schema for optimized single-request endpoint.
    Includes all necessary data to render the dashboard without additional API calls.
    """
    summary: DashboardSummary
    recent_policies: List[DashboardPolicy]
    recent_documents: List["PolicyDocument"]  # Forward reference
    recent_red_flags: List[DashboardRedFlag]
    carriers: List["InsuranceCarrier"]  # Forward reference

    model_config = {"from_attributes": True}
