from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


class InsurancePolicyBase(BaseModel):
    policy_name: str
    policy_type: Optional[str] = None  # 'health', 'dental', 'vision', 'life'
    policy_number: Optional[str] = None
    plan_year: Optional[str] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    group_number: Optional[str] = None
    network_type: Optional[str] = None  # 'HMO', 'PPO', 'EPO', 'POS'
    deductible_individual: Optional[Decimal] = None
    deductible_family: Optional[Decimal] = None
    out_of_pocket_max_individual: Optional[Decimal] = None
    out_of_pocket_max_family: Optional[Decimal] = None
    premium_monthly: Optional[Decimal] = None
    premium_annual: Optional[Decimal] = None


class InsurancePolicyCreate(InsurancePolicyBase):
    document_id: UUID
    carrier_id: Optional[UUID] = None


class InsurancePolicyUpdate(BaseModel):
    policy_name: Optional[str] = None
    policy_type: Optional[str] = None
    policy_number: Optional[str] = None
    plan_year: Optional[str] = None
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    group_number: Optional[str] = None
    network_type: Optional[str] = None
    deductible_individual: Optional[Decimal] = None
    deductible_family: Optional[Decimal] = None
    out_of_pocket_max_individual: Optional[Decimal] = None
    out_of_pocket_max_family: Optional[Decimal] = None
    premium_monthly: Optional[Decimal] = None
    premium_annual: Optional[Decimal] = None
    carrier_id: Optional[UUID] = None


class InsurancePolicyInDBBase(InsurancePolicyBase):
    id: UUID
    document_id: UUID
    user_id: UUID
    carrier_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InsurancePolicy(InsurancePolicyInDBBase):
    """Insurance policy data returned to client"""
    pass


class CompletePolicyData(BaseModel):
    """
    Complete policy data schema for optimized single-request endpoint.
    Includes all necessary data to render policy details without additional API calls.
    """
    policy: InsurancePolicy
    benefits: List["CoverageBenefit"]  # Forward reference
    red_flags: List["RedFlag"]  # Forward reference
    document: Optional["PolicyDocument"] = None  # Forward reference
    carrier: Optional["InsuranceCarrier"] = None  # Forward reference

    model_config = {"from_attributes": True}
